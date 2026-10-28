import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { onRequestPost, onRequest as outrosMetodos, dispositivoDe, origemDe } from '../../functions/api/evento.js';
import { onRequestGet, tokenConfere } from '../../functions/api/admin/resumo.js';
import { resumir, limitesDoPeriodo } from '../../functions/_lib/metricas.js';

// Banco SQLite de verdade, com o mesmo esquema do D1, atrás de uma casca com a API do D1.
function bancoFalso() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8'));
  return {
    bruto: db,
    prepare: (sql) => ({
      bind: (...p) => ({
        all: async () => ({ results: db.prepare(sql).all(...p).map((r) => ({ ...r })) }),
        run: async () => db.prepare(sql).run(...p),
      }),
    }),
  };
}

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1';
const evento = (corpo, cabecalhos = {}) =>
  new Request('https://www.exemplo.com.br/api/evento', {
    method: 'POST',
    headers: { 'User-Agent': UA, ...cabecalhos },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });
const visita = (extra = {}) => ({
  t: 'v', pv: 'pv-00000001', vis: 'visitante-0001', ses: 'sessao-00001', p: '/noticias/2026-10-19-teste/',
  ref: 'https://www.google.com/', novo: true, ...extra,
});

test('evento: grava a visita sem IP nem user agent e atualiza a leitura', async () => {
  const db = bancoFalso();
  assert.equal((await onRequestPost({ request: evento(visita()), env: { DB: db } })).status, 204);
  const linha = db.bruto.prepare('SELECT * FROM visitas').get();
  assert.equal(linha.caminho, '/noticias/2026-10-19-teste/');
  assert.equal(linha.origem, 'google.com');
  assert.equal(linha.dispositivo, 'celular');
  assert.equal(linha.novo, 1);
  assert.deepEqual(Object.keys(linha).sort(), ['caminho', 'dispositivo', 'novo', 'origem', 'pais', 'pv', 'rolagem', 'segundos', 'sessao', 'ts', 'visitante']);

  await onRequestPost({ request: evento({ t: 'l', pv: 'pv-00000001', vis: 'visitante-0001', ses: 'sessao-00001', p: '/noticias/x/', rol: 80, seg: 95 }), env: { DB: db } });
  await onRequestPost({ request: evento({ t: 'l', pv: 'pv-00000001', vis: 'visitante-0001', ses: 'sessao-00001', p: '/noticias/x/', rol: 40, seg: 10 }), env: { DB: db } });
  const lida = db.bruto.prepare('SELECT rolagem, segundos FROM visitas').get();
  assert.deepEqual({ ...lida }, { rolagem: 80, segundos: 95 }, 'só sobe, nunca desce');
});

test('evento: ignora DNT, GPC, robôs e rotas internas, sem gravar', async () => {
  const db = bancoFalso();
  for (const req of [
    evento(visita(), { DNT: '1' }),
    evento(visita(), { 'Sec-GPC': '1' }),
    evento(visita(), { 'User-Agent': 'Googlebot/2.1' }),
    evento(visita({ p: '/painel-grafous/' })),
    evento(visita({ p: '/api/lead' })),
  ]) {
    assert.equal((await onRequestPost({ request: req, env: { DB: db } })).status, 204);
  }
  // Prévia de pull request e rede de data center também não contam.
  const previa = new Request('https://abc123.blog-de-finan-as.pages.dev/api/evento', { method: 'POST', body: JSON.stringify(visita()), headers: { 'User-Agent': 'Mozilla/5.0 (iPhone)' } });
  assert.equal((await onRequestPost({ request: previa, env: { DB: db } })).status, 204);
  const nuvem = evento(visita());
  Object.defineProperty(nuvem, 'cf', { value: { asOrganization: 'Amazon.com, Inc.' } });
  assert.equal((await onRequestPost({ request: nuvem, env: { DB: db } })).status, 204);
  assert.equal(db.bruto.prepare('SELECT COUNT(*) AS n FROM visitas').get().n, 0);
});

test('evento: rejeita corpo inválido e origem não permitida', async () => {
  const env = { DB: bancoFalso(), ALLOWED_ORIGIN: 'https://www.exemplo.com.br' };
  const com = (corpo) => onRequestPost({ request: evento(corpo, { Origin: 'https://www.exemplo.com.br' }), env });
  assert.equal((await com('não é json')).status, 400);
  assert.equal((await com({ ...visita(), pv: 'curto' })).status, 400);
  assert.equal((await com({ ...visita(), p: 'sem-barra' })).status, 400);
  assert.equal((await com({ ...visita(), p: '/<script>' })).status, 400);
  assert.equal((await com({ ...visita(), t: 'x' })).status, 400);
  assert.equal((await com('x'.repeat(3000))).status, 413);
  assert.equal((await onRequestPost({ request: evento(visita(), { Origin: 'https://outro.com' }), env })).status, 403);
  assert.equal((await onRequestPost({ request: evento(visita(), { Origin: 'https://www.exemplo.com.br' }), env })).status, 204);
  assert.equal(outrosMetodos({ request: new Request('https://x.com/api/evento', { method: 'GET' }) }).status, 405);
});

test('dispositivo e origem', () => {
  assert.equal(dispositivoDe('Mozilla/5.0 (iPad; CPU OS 17_0)'), 'tablet');
  assert.equal(dispositivoDe('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari'), 'celular');
  assert.equal(dispositivoDe('Mozilla/5.0 (Linux; Android 14; SM-X900) Safari'), 'tablet');
  assert.equal(dispositivoDe('Mozilla/5.0 (Windows NT 10.0) Chrome'), 'computador');
  assert.equal(origemDe('https://www.exemplo.com.br/x', 'www.exemplo.com.br'), null, 'mesmo site não é origem');
  assert.equal(origemDe('https://l.instagram.com/?u=1', 'www.exemplo.com.br'), 'l.instagram.com');
  assert.equal(origemDe('', 'x'), null);
  assert.equal(origemDe('lixo', 'x'), null);
});

test('painel: token obrigatório, comparado em tempo constante', async () => {
  const TOKEN = 'um-segredo-bem-longo-e-aleatorio-123456';
  const pedir = (cab = {}, env = { DB: bancoFalso(), ADMIN_TOKEN: TOKEN }, q = '') =>
    onRequestGet({ request: new Request(`https://x.com/api/admin/resumo${q}`, { headers: cab }), env });
  assert.equal((await pedir({}, { DB: bancoFalso() })).status, 503, 'sem ADMIN_TOKEN configurado');
  assert.equal((await pedir({}, { DB: bancoFalso(), ADMIN_TOKEN: 'curto' })).status, 503, 'token curto não vale');
  assert.equal((await pedir()).status, 401);
  assert.equal((await pedir({ Authorization: 'Bearer errado' })).status, 401);
  const ok = await pedir({ Authorization: `Bearer ${TOKEN}` }, undefined, '?dias=7');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Cache-Control'), 'no-store');
  assert.equal((await ok.json()).periodo.dias, 7);
  assert.equal((await (await pedir({ Authorization: `Bearer ${TOKEN}` }, undefined, '?dias=999')).json()).periodo.dias, 30);
  assert.equal(await tokenConfere('a', 'a'), true);
  assert.equal(await tokenConfere('a', 'b'), false);
});

// 20/10/2026 12:00 em Brasília.
const AGORA = Date.parse('2026-10-20T15:00:00Z');
const dia = (d, h = 12) => Date.parse(`2026-10-${String(d).padStart(2, '0')}T${String(h + 3).padStart(2, '0')}:00:00Z`);

function semear(db, linhas) {
  let n = 0;
  for (const l of linhas) {
    db.bruto
      .prepare('INSERT INTO visitas (pv, ts, visitante, sessao, caminho, origem, dispositivo, pais, novo, rolagem, segundos) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(`pv-${String(++n).padStart(8, '0')}`, l.ts, l.v, l.s ?? `s-${l.v}-${l.ts}`, l.c, l.o ?? null, l.d ?? 'computador', l.pais ?? 'BR', l.novo ?? 0, l.rol ?? 0, l.seg ?? 0);
  }
}

test('painel: agrega visitas, matérias, retorno e origens', async () => {
  const db = bancoFalso();
  const A = '/noticias/2026-10-19-a/', B = '/guias/guia-b/', LISTA = '/noticias/brasil/';
  semear(db, [
    // Ana lê A até o fim em dois dias diferentes (voltou) e B uma vez.
    { v: 'ana', ts: dia(19), c: A, o: 'google.com', rol: 90, seg: 120, novo: 1 },
    { v: 'ana', ts: dia(20, 9), c: A, rol: 100, seg: 60 },
    { v: 'ana', ts: dia(20, 10), c: B, rol: 30, seg: 30 },
    // Beto: uma visita só, lista de editoria (não é matéria), celular.
    { v: 'beto', ts: dia(20), c: LISTA, d: 'celular', pais: 'PT', novo: 1 },
    // Caio: já tinha aparecido antes do período (dia 1), volta no dia 20.
    { v: 'caio', ts: dia(1), c: A, rol: 20, seg: 10 },
    { v: 'caio', ts: dia(20, 8), c: A, o: 'l.instagram.com', rol: 50, seg: 40 },
    // Fora da janela de 7 dias, mas dentro da de 30.
    { v: 'dani', ts: dia(5), c: B, rol: 80, seg: 200, novo: 1 },
  ]);

  const r7 = await resumir(db, 7, AGORA);
  assert.deepEqual(r7.periodo, { dias: 7, de: '2026-10-14', ate: '2026-10-20' });
  assert.equal(r7.porDia.length, 7);
  assert.equal(r7.porDia.at(-1).dia, '2026-10-20');
  assert.deepEqual(r7.porDia.at(-1), { dia: '2026-10-20', visitas: 4, visitantes: 3 });
  assert.equal(r7.porDia[0].visitas, 0, 'dia sem visita aparece com zero');
  assert.equal(r7.totais.visitas, 5);
  assert.equal(r7.totais.visitantes, 3);
  assert.equal(r7.totais.voltaram, 2, 'Ana (2 dias) e Caio (já tinha vindo antes); Beto não');
  assert.equal(r7.totais.taxaRetorno, 66.7);
  assert.equal(r7.totais.leituras, 4, 'a lista de editoria não conta como matéria');

  const a = r7.materias.find((m) => m.caminho === A);
  assert.equal(a.visitas, 3);
  assert.equal(a.leitores, 2);
  assert.equal(r7.materias[0].caminho, A, 'ordenadas por visitas');
  assert.equal(a.taxaConclusao, 66.7, 'Ana 90 e 100 passam de 75; Caio com 50 não');
  assert.equal(a.segundosMedios, 73);
  assert.ok(!r7.materias.some((m) => m.caminho === LISTA));

  assert.equal(r7.origens[0].origem, 'Acesso direto ou sem origem');
  assert.ok(r7.origens.some((o) => o.origem === 'google.com' && o.visitas === 1));
  assert.deepEqual(r7.dispositivos.map((d) => d.dispositivo).sort(), ['celular', 'computador']);
  assert.ok(r7.paises.some((p) => p.pais === 'PT'));
  assert.equal(r7.entradas[0].caminho, A);

  const dist = Object.fromEntries(r7.retorno.distribuicao.map((d) => [d.faixa, d.visitantes]));
  assert.deepEqual(dist, { 1: 2, 2: 1, '3 a 4': 0, '5 ou mais': 0 });
  assert.equal(r7.retorno.recorrentes.length, 2);
  const ana = r7.retorno.recorrentes.find((v) => v.visitante === 'ana');
  assert.equal(ana.visitas, 3);
  assert.deepEqual(ana.materias.sort(), [A, B].sort());
  assert.ok(r7.retorno.recorrentes.find((v) => v.visitante === 'caio').jaTinhaVisitado);

  const r30 = await resumir(db, 30, AGORA);
  assert.equal(r30.totais.visitantes, 4);
  assert.equal(r30.porDia.length, 30);
});

test('painel: banco vazio não quebra e a janela respeita o fuso de Brasília', async () => {
  const r = await resumir(bancoFalso(), 7, AGORA);
  assert.equal(r.totais.visitas, 0);
  assert.equal(r.totais.taxaRetorno, 0);
  assert.deepEqual(r.materias, []);
  // 21h de Brasília do dia 19 = 00h UTC do dia 20: ainda é dia 19 para o painel.
  const { de, ate } = limitesDoPeriodo(1, Date.parse('2026-10-20T00:30:00Z'));
  assert.equal(new Date(de).toISOString(), '2026-10-19T03:00:00.000Z');
  assert.equal(new Date(ate).toISOString(), '2026-10-20T03:00:00.000Z');
});

test('painel: depois da chave, diz se falta o banco, a tabela ou qual foi o erro', async () => {
  const TOKEN = 'chave-de-teste-com-mais-de-16';
  const pedir = (env) => onRequestGet({ request: new Request('https://x.com/api/admin/resumo', { headers: { Authorization: `Bearer ${TOKEN}` } }), env });
  const semBanco = await pedir({ ADMIN_TOKEN: TOKEN });
  assert.equal(semBanco.status, 500);
  assert.equal((await semBanco.json()).erro, 'sem-banco');
  const quebra = (msg) => ({ prepare: () => ({ bind: () => ({ all: async () => { throw new Error(msg); } }) }) });
  assert.equal((await (await pedir({ ADMIN_TOKEN: TOKEN, DB: quebra('D1_ERROR: no such table: visitas') })).json()).erro, 'sem-tabela');
  const outro = await (await pedir({ ADMIN_TOKEN: TOKEN, DB: quebra('D1_ERROR: database is locked') })).json();
  assert.equal(outro.erro, 'banco');
  assert.match(outro.detalhe, /database is locked/);
  assert.equal((await pedir({ DB: quebra('x') })).status, 503, 'sem chave configurada nada vaza');
});

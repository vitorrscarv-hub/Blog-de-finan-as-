import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequest, normalizarWhatsapp } from '../../functions/api/lead.js';

// D1 falso: guarda os cadastros num Map indexado pelo e-mail, imitando o upsert da tabela.
function d1Falso({ falhar = false } = {}) {
  const linhas = new Map();
  const chamadas = [];
  return {
    linhas,
    chamadas,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (falhar) throw new Error('D1 indisponível');
              chamadas.push({ sql, args });
              const [nome, email, whatsapp, pagina, origem, agora] = args;
              const atual = linhas.get(email);
              linhas.set(email, {
                nome,
                email,
                whatsapp,
                pagina,
                origem,
                consentimento_em: agora,
                criado_em: atual?.criado_em ?? agora,
                atualizado_em: agora,
              });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

const valido = {
  nome: '  Maria   Teste ',
  email: ' Maria.Teste@Exemplo.COM.br ',
  whatsapp: '(11) 91234-5678',
  consentimento: true,
  site: '',
  pagina: '/noticias/exemplo/',
  origem: 'https://www.google.com/',
};

const pedido = (corpo, { origem = 'https://www.seudominio.com.br', metodo = 'POST' } = {}) =>
  new Request('https://www.seudominio.com.br/api/lead', {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Origin: origem },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });

const chamar = async (corpo, env = {}, opcoes) => {
  const resp = await onRequestPost({ request: pedido(corpo, opcoes), env });
  return { status: resp.status, dados: await resp.json() };
};

test('cadastro válido grava no D1 com e-mail em minúsculas e WhatsApp +55', async () => {
  const DB = d1Falso();
  const { status, dados } = await chamar(valido, { DB });
  assert.equal(status, 200);
  assert.deepEqual(dados, { ok: true });
  const linha = DB.linhas.get('maria.teste@exemplo.com.br');
  assert.ok(linha);
  assert.equal(linha.nome, 'Maria Teste');
  assert.equal(linha.whatsapp, '+5511912345678');
  assert.equal(linha.pagina, '/noticias/exemplo/');
  assert.equal(linha.origem, 'https://www.google.com/');
  assert.match(linha.consentimento_em, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(DB.chamadas[0].sql, /ON CONFLICT\(email\) DO UPDATE/);
});

test('mesmo e-mail duas vezes atualiza o cadastro em vez de duplicar', async () => {
  const DB = d1Falso();
  await chamar(valido, { DB });
  const criado = DB.linhas.get('maria.teste@exemplo.com.br').criado_em;
  await new Promise((r) => setTimeout(r, 5));
  await chamar({ ...valido, nome: 'Maria T.', whatsapp: '21987654321' }, { DB });
  assert.equal(DB.linhas.size, 1);
  const linha = DB.linhas.get('maria.teste@exemplo.com.br');
  assert.equal(linha.nome, 'Maria T.');
  assert.equal(linha.whatsapp, '+5521987654321');
  assert.equal(linha.criado_em, criado);
});

test('sem consentimento é recusado', async () => {
  const DB = d1Falso();
  for (const consentimento of [false, undefined, 'true', 1]) {
    const { status, dados } = await chamar({ ...valido, consentimento }, { DB });
    assert.equal(status, 422);
    assert.equal(dados.erro, 'consentimento');
  }
  assert.equal(DB.chamadas.length, 0);
});

test('WhatsApp curto, longo ou com DDD inválido é recusado', async () => {
  const DB = d1Falso();
  for (const whatsapp of ['1191234', '(11) 9123-456', '119123456789', '(10) 91234-5678', '']) {
    const { status, dados } = await chamar({ ...valido, whatsapp }, { DB });
    assert.equal(status, 422, whatsapp);
    assert.equal(dados.erro, 'whatsapp');
  }
  assert.equal(DB.chamadas.length, 0);
});

test('WhatsApp fixo com 10 dígitos e número colado com +55 são aceitos', async () => {
  const DB = d1Falso();
  assert.equal((await chamar({ ...valido, whatsapp: '(11) 3333-4444' }, { DB })).status, 200);
  assert.equal(DB.linhas.get('maria.teste@exemplo.com.br').whatsapp, '+551133334444');
  assert.equal(normalizarWhatsapp('+55 (11) 91234-5678'), '11912345678');
  assert.equal(normalizarWhatsapp('011 91234-5678'), '11912345678');
});

test('e-mail inválido é recusado', async () => {
  const DB = d1Falso();
  for (const email of ['maria', 'maria@exemplo', 'maria @exemplo.com', '@exemplo.com', `${'a'.repeat(160)}@x.com`]) {
    const { status, dados } = await chamar({ ...valido, email }, { DB });
    assert.equal(status, 422, email);
    assert.equal(dados.erro, 'email');
  }
  assert.equal(DB.chamadas.length, 0);
});

test('nome vazio é recusado', async () => {
  const { status, dados } = await chamar({ ...valido, nome: ' ' }, { DB: d1Falso() });
  assert.equal(status, 422);
  assert.equal(dados.erro, 'nome');
});

test('robô que preenche o campo-armadilha recebe ok e nada é gravado', async () => {
  const DB = d1Falso();
  const { status, dados } = await chamar({ ...valido, site: 'https://spam.example' }, { DB });
  assert.equal(status, 200);
  assert.deepEqual(dados, { ok: true });
  assert.equal(DB.chamadas.length, 0);
});

test('corpo que não é JSON de objeto é recusado', async () => {
  for (const corpo of ['não é json', 'null', '[]', '"texto"']) {
    const { status } = await chamar(corpo, { DB: d1Falso() });
    assert.equal(status, 400, corpo);
  }
});

test('outros métodos recebem 405', async () => {
  const resp = onRequest();
  assert.equal(resp.status, 405);
  assert.equal(resp.headers.get('Allow'), 'POST');
});

test('ALLOWED_ORIGIN recusa outras origens e aceita a lista configurada', async () => {
  const env = { DB: d1Falso(), ALLOWED_ORIGIN: 'https://www.seudominio.com.br, https://seudominio.com.br/' };
  assert.equal((await chamar(valido, env, { origem: 'https://outro.site' })).status, 403);
  assert.equal((await chamar(valido, env, { origem: 'https://seudominio.com.br' })).status, 200);
  assert.equal((await chamar(valido, env)).status, 200);
});

test('falha no banco responde 500', async () => {
  const { status, dados } = await chamar(valido, { DB: d1Falso({ falhar: true }) });
  assert.equal(status, 500);
  assert.equal(dados.ok, false);
});

test('sem vínculo DB responde 500', async () => {
  const { status } = await chamar(valido, {});
  assert.equal(status, 500);
});

test('webhook recebe o cadastro e uma falha nele não bloqueia a resposta', async (t) => {
  const recebidos = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    recebidos.push({ url, corpo: JSON.parse(init.body) });
    throw new Error('webhook fora do ar');
  });
  const pendentes = [];
  const DB = d1Falso();
  const resp = await onRequestPost({
    request: pedido(valido),
    env: { DB, LEAD_WEBHOOK_URL: 'https://hooks.example/lead' },
    waitUntil: (p) => pendentes.push(p),
  });
  assert.equal(resp.status, 200);
  await Promise.all(pendentes);
  assert.equal(recebidos.length, 1);
  assert.equal(recebidos[0].url, 'https://hooks.example/lead');
  assert.equal(recebidos[0].corpo.email, 'maria.teste@exemplo.com.br');
  assert.equal(recebidos[0].corpo.whatsapp, '+5511912345678');
  assert.equal(DB.linhas.size, 1);
});

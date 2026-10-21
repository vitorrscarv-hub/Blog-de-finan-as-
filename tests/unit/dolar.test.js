import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarNota, comparacoes } from '../../scripts/lib/dolar.mjs';
import { lerIpca12m, lerSelic, diaCurto, diaLongo } from '../../scripts/lib/oficiais.mjs';

const f = (data, venda) => ({ data, compra: +(venda - 0.0006).toFixed(4), venda });
// Série curta e conhecida: o fechamento de hoje é 5,0140.
const serie = [
  f('2025-12-30', 5.5), f('2026-09-30', 5.2), f('2026-10-13', 5.1), f('2026-10-14', 5.09), f('2026-10-15', 5.08),
  f('2026-10-16', 5.0826), f('2026-10-19', 5.02), f('2026-10-20', 5.014),
];

test('comparações usam só pontos que existem na série', () => {
  const c = comparacoes(serie, '2026-10-20');
  assert.deepEqual(c.itens.map((i) => i.rotulo), ['Fechamento anterior', 'Cinco fechamentos antes', 'Último fechamento do mês anterior', 'Último fechamento do ano anterior']);
  assert.equal(c.itens[0].data, '2026-10-19');
  assert.equal(c.itens[1].data, '2026-10-13');
  assert.equal(c.itens[2].data, '2026-09-30');
  assert.equal(c.itens[3].data, '2025-12-30');
  assert.equal(comparacoes(serie, '2026-10-21'), null);
});

test('nota em dia de queda tem título, descrição dentro do limite e sem travessão', () => {
  const n = montarNota(serie, '2026-10-20');
  assert.equal(n.arquivo, '2026-10-20-dolar-ptax-fechamento.md');
  assert.equal(n.titulo, 'Dólar PTAX fecha a R$ 5,0140, queda de 0,12% sobre o dia anterior');
  assert.ok(n.descricao.length <= 155, `description com ${n.descricao.length} caracteres`);
  assert.doesNotMatch(n.texto, /[—–]/);
  assert.match(n.texto, /draft: false/);
  assert.match(n.texto, /\| Último fechamento do ano anterior \| 30 de dezembro de 2025 \| R\$ 5,5000 \| -8,84% \|/);
  assert.doesNotMatch(n.texto, /\b(compre|venda a|recomend)/i);
});

test('dia de alta e dia sem variação', () => {
  const alta = montarNota([...serie.slice(0, -1), f('2026-10-20', 5.1)], '2026-10-20');
  assert.match(alta.titulo, /alta de 1,59%/);
  const igual = montarNota([...serie.slice(0, -1), f('2026-10-20', 5.02)], '2026-10-20');
  assert.match(igual.titulo, /estável/);
});

test('com um só fechamento a nota sai sem tabela nem comparação inventada', () => {
  const n = montarNota([f('2026-10-20', 5.014)], '2026-10-20');
  assert.doesNotMatch(n.texto, /\| Comparação/);
  assert.match(n.titulo, /fecha a R\$ 5,0140 em 20 de outubro de 2026/);
  assert.ok(n.descricao.length <= 155);
});

test('sem fechamento na data pedida não há nota', () => {
  assert.equal(montarNota(serie, '2026-10-21'), null);
  assert.equal(montarNota([], '2026-10-21'), null);
});

test('leitura do IPCA, da Selic e das datas', () => {
  assert.deepEqual(lerIpca12m([{ resultados: [{ series: [{ serie: { 202608: '4.40', 202609: '4.58' } }] }] }]), { valor: 4.58, mes: 9, ano: 2026 });
  assert.equal(lerIpca12m([]), null);
  assert.deepEqual(lerSelic({ conteudo: [{ MetaSelic: 13.75, NumeroReuniaoCopom: 281, DataInicioVigencia: '2026-09-17T03:00:00Z' }] }), { meta: 13.75, reuniao: 281, desde: '2026-09-17' });
  assert.equal(diaCurto('2026-10-20'), '20 out 2026');
  assert.equal(diaLongo('2026-03-01'), '1 de março de 2026');
});

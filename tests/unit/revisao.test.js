import { test } from 'node:test';
import assert from 'node:assert/strict';
import { revisar } from '../../scripts/lib/revisao.mjs';

const texto = (corpo, extra = '') =>
  `---\ntitle: "T"\ndescription: "D"\ndate: 2026-10-22\nteaser: "Resumo. [LINK]"\nfontes:\n  - titulo: "IBGE"\n    url: "https://ibge.gov.br"\n${extra}---\n${corpo}\n`;
const corpoOk = Array(600).fill('palavra').join(' ');

test('texto limpo passa sem erro', () => {
  const r = revisar(texto(corpoOk));
  assert.deepEqual(r.erros, []);
  assert.deepEqual(r.avisos, []);
});

test('travessão, emoji e expressão proibida são erros', () => {
  const r = revisar(texto(`${corpoOk} O dólar dispara — e vale a pena olhar 📈.`));
  assert.ok(r.erros.some((e) => e.startsWith('travessão')));
  assert.ok(r.erros.includes('emoji'));
  assert.ok(r.erros.includes('expressão proibida: "dispara"'));
  assert.ok(r.erros.includes('expressão proibida: "vale a pena"'));
});

test('palavra proibida só conta inteira ("corrida" não é "corra")', () => {
  assert.deepEqual(revisar(texto(`${corpoOk} A corrida eleitoral seguiu.`)).erros, []);
});

test('teaser sem [LINK] e matéria sem fontes', () => {
  const sem = `---\ntitle: "T"\nteaser: "Resumo."\n---\n${corpoOk}`;
  const r = revisar(sem);
  assert.ok(r.erros.includes('teaser precisa terminar em [LINK]'));
  assert.ok(r.erros.some((e) => e.startsWith('sem fontes')));
});

test('pesquisa eleitoral com números exige o registro no TSE', () => {
  assert.ok(revisar(texto(`${corpoOk} Na Quaest, o candidato A tem 45% e o B, 41%.`)).erros.some((e) => e.includes('registro no TSE')));
  assert.deepEqual(revisar(texto(`${corpoOk} Na Quaest (registro BR-01234/2026), A tem 45% e B, 41%.`)).erros, []);
  assert.deepEqual(revisar(texto(`${corpoOk} Na Quaest (registro BR012342026), A tem 45% e B, 41%.`)).erros, []);
});

test('tamanho fora da faixa e rascunho viram aviso, não erro', () => {
  const r = revisar(texto('curto demais', 'draft: true\n'));
  assert.deepEqual(r.erros, []);
  assert.equal(r.avisos.length, 2);
});

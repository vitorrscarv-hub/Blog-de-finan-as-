import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validarCalendario, lerCalendario, dataValida, porPagamento, reais } from '../../src/scripts/calendario.ts';

const fonte = { titulo: 'Aviso aos acionistas', url: 'https://www.rad.cvm.gov.br/exemplo' };
const acao = {
  empresa: 'Empresa Exemplo S.A.', ticker: 'EXEM3', tipo: 'JCP', valorPorAcao: 0.1234,
  dataCom: '2026-10-23', dataPagamento: '2026-11-10', fonte,
};
const fii = {
  fundo: 'Fundo Exemplo', ticker: 'EXEM11', valorPorCota: 0.95,
  dataBase: '2026-10-30', dataPagamento: '2026-11-14', fonte,
};
const base = (extra = {}) => ({ atualizado: '2026-10-19', acoes: [acao], fiis: [fii], ...extra });

test('o arquivo versionado é válido', () => {
  const real = JSON.parse(readFileSync(new URL('../../src/data/calendario.json', import.meta.url), 'utf8'));
  assert.deepEqual(validarCalendario(real), []);
});

test('calendário correto passa e vazio também', () => {
  assert.deepEqual(validarCalendario(base()), []);
  assert.deepEqual(validarCalendario({ atualizado: '2026-10-19', acoes: [], fiis: [] }), []);
});

test('datas precisam existir', () => {
  assert.equal(dataValida('2026-02-30'), false);
  assert.equal(dataValida('26-10-19'), false);
  assert.equal(dataValida('2026-10-19'), true);
  assert.ok(validarCalendario(base({ atualizado: '19/10/2026' })).length > 0);
});

test('cada linha exige fonte https, valor positivo e ticker válido', () => {
  assert.ok(validarCalendario(base({ acoes: [{ ...acao, fonte: { titulo: 'x', url: 'http://a.com' } }] })).join().includes('fonte'));
  assert.ok(validarCalendario(base({ acoes: [{ ...acao, fonte: undefined }] })).join().includes('fonte'));
  assert.ok(validarCalendario(base({ acoes: [{ ...acao, valorPorAcao: 0 }] })).join().includes('valor'));
  assert.ok(validarCalendario(base({ acoes: [{ ...acao, ticker: 'exem3' }] })).join().includes('ticker'));
  assert.ok(validarCalendario(base({ fiis: [{ ...fii, ticker: 'EXEM3' }] })).join().includes('ticker'));
  assert.ok(validarCalendario(base({ acoes: [{ ...acao, tipo: 'Bonificação' }] })).join().includes('tipo'));
});

test('pagamento não pode vir antes da data com', () => {
  assert.ok(validarCalendario(base({ acoes: [{ ...acao, dataPagamento: '2026-10-01' }] })).join().includes('antes'));
});

test('lerCalendario derruba o build com dado inválido', () => {
  assert.throws(() => lerCalendario(base({ fiis: [{ ...fii, valorPorCota: -1 }] })), /inválido/);
  assert.equal(lerCalendario(base()).acoes.length, 1);
});

test('ordem por pagamento e depois ticker; reais em pt-BR', () => {
  const l = [{ dataPagamento: '2026-11-10', ticker: 'BBBB3' }, { dataPagamento: '2026-11-10', ticker: 'AAAA3' }, { dataPagamento: '2026-10-30', ticker: 'ZZZZ3' }];
  assert.deepEqual(l.sort(porPagamento).map((x) => x.ticker), ['ZZZZ3', 'AAAA3', 'BBBB3']);
  assert.equal(reais(0.1234), 'R$ 0,1234');
  assert.equal(reais(1), 'R$ 1,00');
});

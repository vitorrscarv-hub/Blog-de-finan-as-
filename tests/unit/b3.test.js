import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickerDoIsin, dia, numero, urlDe } from '../../scripts/lib/b3.mjs';

test('ISIN vira código de negociação', () => {
  assert.equal(tickerDoIsin('BRPETRACNOR9'), 'PETR3');
  assert.equal(tickerDoIsin('BRPETRACNPR6'), 'PETR4');
  assert.equal(tickerDoIsin('BRSANBCDAM13'), 'SANB11');
  assert.equal(tickerDoIsin('BRCMIGACNPA6'), 'CMIG5');
  assert.equal(tickerDoIsin('BRB3SAACNOR6'), 'B3SA3');
  assert.equal(tickerDoIsin('BRXPMLCTF000'), null);
  assert.equal(tickerDoIsin(undefined), null);
});

test('datas e valores da B3', () => {
  assert.equal(dia('21/12/2026'), '2026-12-21');
  assert.equal(dia('2026-12-21'), null);
  assert.equal(numero('0,47156696000'), 0.47156696);
  assert.equal(numero('1.234,5'), 1234.5);
});

test('consulta da B3 vai em base64 na url', () => {
  const url = urlDe('rota/Teste', { a: 1 });
  assert.equal(url, `https://sistemaswebb3-listados.b3.com.br/rota/Teste/${Buffer.from('{"a":1}').toString('base64')}`);
});

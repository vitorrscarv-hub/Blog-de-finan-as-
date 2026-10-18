import { test } from 'node:test';
import assert from 'node:assert/strict';

// Fuso do Brasil antes de carregar o módulo: é nele que o erro de "um dia antes" aparecia.
// O import é dinâmico porque imports estáticos rodariam antes desta linha.
process.env.TZ = 'America/Sao_Paulo';
const { dataBR, minutosDeLeitura } = await import('../../src/scripts/formatos.ts');

test('data do cabeçalho aparece no mesmo dia, sem erro de fuso', () => {
  // O Astro lê "date: 2026-10-12" como meia-noite UTC, que em São Paulo ainda é dia 11.
  assert.equal(dataBR(new Date('2026-10-12')), '12 de outubro de 2026');
  assert.equal(dataBR(new Date('2026-01-01')), '1 de janeiro de 2026');
  assert.equal(dataBR(new Date('2026-12-31')), '31 de dezembro de 2026');
});

test('tempo de leitura arredonda para pelo menos 1 minuto', () => {
  assert.equal(minutosDeLeitura(''), 1);
  assert.equal(minutosDeLeitura('palavra '.repeat(1000)), 5);
});

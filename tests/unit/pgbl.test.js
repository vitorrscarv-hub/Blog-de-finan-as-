import { test } from 'node:test';
import assert from 'node:assert/strict';
import { impostoTabela, reducaoAnual, calcularPgbl } from '../../src/scripts/pgbl.ts';

// Contribuição de empregado no teto do INSS em 2026: R$ 988,09 por mês.
const inssTeto = 11857.1;
const base = (extra) => ({ rendimentos: 120000, inss: inssTeto, dependentes: 0, saude: 0, educacao: 0, pgbl: 0, ...extra });

test('tabela anual de 2026 da Receita', () => {
  assert.equal(impostoTabela(29145.6), 0);
  assert.equal(impostoTabela(40000), 1270.09);
  assert.equal(impostoTabela(102360), 17244.34);
});

test('redução da Lei 15.270: zera até R$ 60 mil e some em R$ 88,2 mil', () => {
  assert.equal(reducaoAnual(60000, 1000), 1000);
  assert.equal(reducaoAnual(72000, 5000), 1548.33);
  assert.equal(reducaoAnual(88200, 5000), 0);
  assert.equal(reducaoAnual(72000, 100), 100);
});

test('Ana: simplificada sem PGBL, completa no limite de 12%', () => {
  const r = calcularPgbl(base());
  assert.equal(r.limite, 14400);
  assert.equal(r.semPgbl.modelo, 'simplificada');
  assert.equal(r.semPgbl.imposto, 17244.34);
  assert.equal(r.noLimite.modelo, 'completa');
  assert.equal(r.noLimite.imposto, 14874.64);
  assert.equal(r.economiaLimite, 2369.7);
  assert.equal(calcularPgbl(base({ pgbl: 7200 })).economiaAporte, 389.7);
});

test('Bruno: já na completa, cada real sai da faixa de 27,5%', () => {
  const r = calcularPgbl(base({ rendimentos: 240000, dependentes: 2, saude: 6000, educacao: 7123 }));
  assert.equal(r.economiaLimite, 7920);
});

test('Carla e Diego: redução de 2026 e imposto zero', () => {
  assert.equal(calcularPgbl(base({ rendimentos: 72000, inss: 7698.17 })).economiaLimite, 517.28);
  assert.equal(calcularPgbl(base({ rendimentos: 60000, inss: 6018.17 })).economiaLimite, 0);
});

test('sem INSS não há dedução; aporte acima do limite não conta; restituição', () => {
  assert.equal(calcularPgbl(base({ inss: 0 })).limite, 0);
  assert.equal(calcularPgbl(base({ pgbl: 50000 })).comAporte.pgblDeduzido, 14400);
  const r = calcularPgbl(base({ retido: 18000 }));
  assert.equal(r.saldoSemPgbl, 755.66);
  assert.equal(r.saldoNoLimite, 3125.36);
});

test('lê valores digitados no formato brasileiro', async () => {
  const { lerValor } = await import('../../src/scripts/pgbl.ts');
  assert.equal(lerValor('240.000'), 240000);
  assert.equal(lerValor('120.000,50'), 120000.5);
  assert.equal(lerValor('R$ 1.234'), 1234);
  assert.equal(lerValor('11857.10'), 11857.1);
  assert.equal(lerValor('2'), 2);
  assert.equal(lerValor(''), null);
  assert.equal(lerValor('abc'), null);
});

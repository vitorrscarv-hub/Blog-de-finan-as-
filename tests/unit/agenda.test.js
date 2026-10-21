import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventosDoIbge, devidos, paraIsoUtc, proximos } from '../../scripts/lib/agenda.mjs';

const itens = [
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: '12/11/2026 12:00:00' },
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo 15', data_divulgacao: '26/11/2026 12:00:00' },
  { titulo: 'Pesquisa de Estoques', data_divulgacao: '13/11/2026 12:00:00' },
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: '12/11/2026 12:00:00' },
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: 'sem data' },
];

test('converte a data do IBGE (UTC) e rejeita formato estranho', () => {
  assert.equal(paraIsoUtc('12/11/2026 12:00:00'), '2026-11-12T12:00:00Z');
  assert.equal(paraIsoUtc('2026-11-12'), null);
});

test('guarda só o que é acompanhado, sem duplicata, e distingue IPCA de IPCA-15', () => {
  const e = eventosDoIbge(itens);
  assert.deepEqual(e.map((x) => x.id), ['ipca-2026-11-12', 'ipca-15-2026-11-26']);
  assert.equal(e[0].atualizaIndicadores, true);
  assert.equal(e[1].atualizaIndicadores, false);
});

test('devido só depois da divulgação (com margem) e dentro da janela', () => {
  const e = eventosDoIbge(itens);
  const em = (hhmm) => new Date(`2026-11-12T${hhmm}:00Z`);
  assert.equal(devidos(e, em('11:59')).length, 0); // antes de sair
  assert.equal(devidos(e, em('12:05')).length, 0); // dentro da margem de 10 min
  assert.equal(devidos(e, em('12:25')).length, 1);
  assert.equal(devidos(e, em('14:55')).length, 1);
  assert.equal(devidos(e, em('15:30')).length, 0); // janela de 3 h vencida
});

test('próximos respeita o horizonte', () => {
  const e = eventosDoIbge(itens);
  assert.equal(proximos(e, new Date('2026-11-10T00:00:00Z'), 5).length, 1);
  assert.equal(proximos(e, new Date('2026-11-10T00:00:00Z'), 30).length, 2);
});

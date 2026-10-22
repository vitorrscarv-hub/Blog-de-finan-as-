import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventosDoIbge, eventosDoCopom, pautaDoTurno, paraIsoUtc, proximos } from '../../scripts/lib/agenda.mjs';

const itens = [
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: '12/11/2026 12:00:00' },
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo 15', data_divulgacao: '26/11/2026 12:00:00' },
  { titulo: 'Pesquisa Nacional por Amostra de Domicílios Contínua Mensal', data_divulgacao: '12/11/2026 12:00:00' },
  { titulo: 'Pesquisa de Estoques', data_divulgacao: '13/11/2026 12:00:00' },
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: '12/11/2026 12:00:00' },
  { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', data_divulgacao: 'sem data' },
];
const ibge = eventosDoIbge(itens);
const copom = { atas: [{ nroReuniao: 282, dataPublicacao: '2026-11-10' }], comunicados: [{ nro_reuniao: 282, dataReferencia: '2026-11-04' }] };

test('converte a data do IBGE (UTC) e rejeita formato estranho', () => {
  assert.equal(paraIsoUtc('12/11/2026 12:00:00'), '2026-11-12T12:00:00Z');
  assert.equal(paraIsoUtc('2026-11-12'), null);
});

test('guarda só o acompanhado, sem duplicata, com dia e hora de Brasília, e distingue IPCA de IPCA-15', () => {
  assert.deepEqual(ibge.map((e) => `${e.chave} ${e.dia} ${e.hora}`), ['ipca 2026-11-12 09:00', 'pnad 2026-11-12 09:00', 'ipca-15 2026-11-26 09:00']);
});

test('dia de IPCA: a manhã tem matéria obrigatória; a Pnad do mesmo dia é sugestão', () => {
  const p = pautaDoTurno({ ibge, copom: eventosDoCopom(copom, '2026-11-12') }, '2026-11-12', 'manha');
  assert.deepEqual(p.obrigatoria, ['IPCA (IBGE, 09:00)']);
  assert.deepEqual(p.sugestoes, ['desemprego (Pnad) (IBGE, 09:00)']);
});

test('ata do Copom é da manhã do dia da publicação; decisão é da noite do dia da reunião', () => {
  const ata = pautaDoTurno({ ibge: [], copom: eventosDoCopom(copom, '2026-11-10') }, '2026-11-10', 'manha');
  assert.deepEqual(ata.obrigatoria, ['ata da 282ª reunião do Copom']);
  assert.deepEqual(pautaDoTurno({ ibge: [], copom: eventosDoCopom(copom, '2026-11-10') }, '2026-11-10', 'noite').obrigatoria, []);
  const decisao = pautaDoTurno({ ibge: [], copom: eventosDoCopom(copom, '2026-11-04') }, '2026-11-04', 'noite');
  assert.deepEqual(decisao.obrigatoria, ['decisão do Copom (282ª reunião)']);
});

test('dia comum: nada obrigatório', () => {
  assert.deepEqual(pautaDoTurno({ ibge, copom: eventosDoCopom(copom, '2026-11-11') }, '2026-11-11', 'manha'), { obrigatoria: [], sugestoes: [] });
});

test('próximos respeita o horizonte', () => {
  assert.equal(proximos(ibge, new Date('2026-11-10T00:00:00Z'), 5).length, 2);
  assert.equal(proximos(ibge, new Date('2026-11-10T00:00:00Z'), 30).length, 3);
});

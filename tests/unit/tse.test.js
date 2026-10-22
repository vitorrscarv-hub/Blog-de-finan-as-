import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCsv, registroFormatado, pesquisasPresidente } from '../../scripts/lib/tse.mjs';

const CAB = 'SG_UE;NR_PROTOCOLO_REGISTRO;NM_EMPRESA;NM_EMPRESA_FANTASIA;DS_CARGO;DT_INICIO_PESQUISA;DT_FIM_PESQUISA;DT_DIVULGACAO;QT_ENTREVISTADO;DS_PLANO_AMOSTRAL;DS_METODOLOGIA_PESQUISA';
const linha = (reg, fantasia, cargo, div, plano = '', ue = 'BR') =>
  `"${ue}";"${reg}";"EMPRESA LTDA";"${fantasia}";"${cargo}";"2026-10-18 00:00:00";"2026-10-20 00:00:00";"${div} 00:00:00";"2000";"${plano}";""`;

test('CSV com aspas, ponto e vírgula e quebra de linha dentro do campo', () => {
  const r = lerCsv('a;b\n"x;1";"linha 1\nlinha 2"\r\n"y";"diz ""oi"""\n');
  assert.deepEqual(r, [{ a: 'x;1', b: 'linha 1\nlinha 2' }, { a: 'y', b: 'diz "oi"' }]);
});

test('registro no formato da divulgação', () => {
  assert.equal(registroFormatado('BR059082026'), 'BR-05908/2026');
  assert.equal(registroFormatado('XYZ'), 'XYZ');
});

test('só nacionais para presidente na janela, mais recentes primeiro, com margem quando o registro traz', () => {
  const csv = [
    CAB,
    linha('BR000012026', 'QUAEST', 'Presidente', '2026-10-21', 'margem de erro de 2,2 pontos percentuais'),
    linha('BR000022026', '#NULO#', 'Presidente', '2026-10-22'),
    linha('BR000032026', 'X', 'Governador, Senador', '2026-10-22'),
    linha('GO000042026', 'Y', 'Presidente', '2026-10-22', '', 'GO'),
    linha('BR000052026', 'Z', 'Presidente', '2026-10-01'),
  ].join('\n');
  const p = pesquisasPresidente(lerCsv(csv), '2026-10-15', '2026-10-22');
  assert.deepEqual(p.map((x) => x.registro), ['BR-00002/2026', 'BR-00001/2026']);
  assert.equal(p[0].instituto, 'EMPRESA LTDA');
  assert.equal(p[1].margem, '2,2');
  assert.equal(p[1].campo, '2026-10-18 a 2026-10-20');
});

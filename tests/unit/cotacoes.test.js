import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCotacaoB3, lerPtax, pregaoAberto, segundosDeCache, urlPtax } from '../../functions/_lib/cotacoes.js';

// Formato real da resposta de cotacao.b3.com.br (campos reduzidos).
const b3 = (extra = {}) => ({
  BizSts: { cd: 'OK' },
  Msg: { dtTm: '2026-10-21 10:45:15' },
  Trad: [{ scty: { SctyQtn: { curPrc: 58.09, prcFlcn: -0.2061501 }, mkt: { nm: 'Vista' }, symb: 'PETR4', desc: 'PETROBRAS   PN      N2', indxCmpnInd: true, ...extra }, ttlQty: 3718 }],
});

test('lê cotação da B3 e limpa os espaços do nome', () => {
  assert.deepEqual(lerCotacaoB3(b3()), { simbolo: 'PETR4', nome: 'PETROBRAS PN N2', preco: 58.09, variacao: -0.2061501, hora: '2026-10-21 10:45:15' });
});

test('descarta papel fora do Ibovespa, mas aceita o próprio índice', () => {
  assert.equal(lerCotacaoB3(b3({ indxCmpnInd: false })), null);
  assert.equal(lerCotacaoB3(b3({ indxCmpnInd: undefined, mkt: { nm: 'Indices' }, symb: 'IBOV' }))?.simbolo, 'IBOV');
});

test('descarta resposta sem preço ou malformada', () => {
  assert.equal(lerCotacaoB3({}), null);
  assert.equal(lerCotacaoB3(null), null);
  assert.equal(lerCotacaoB3(b3({ SctyQtn: { curPrc: 0 } })), null);
  assert.equal(lerCotacaoB3(b3({ SctyQtn: { curPrc: '58,09' } })), null);
});

const boletim = (venda, quando, tipo) => ({ cotacaoVenda: venda, dataHoraCotacao: quando, tipoBoletim: tipo });

test('PTAX antes do fechamento: boletim mais recente, parcial, comparado com o fechamento anterior', () => {
  const r = lerPtax({ value: [
    boletim(5.0414, '2026-10-22 12:04:11.7', 'Intermediário'),
    boletim(5.0391, '2026-10-22 10:06:13.2', 'Abertura'),
    boletim(5.0277, '2026-10-21 13:08:17.0', 'Fechamento'),
    boletim(5.0352, '2026-10-21 13:08:16.7', 'Intermediário'),
  ] });
  assert.equal(r.valor, 5.0414);
  assert.equal(r.parcial, true);
  assert.equal(r.hora, '12:04');
  assert.equal(r.data, '2026-10-22');
  assert.ok(Math.abs(r.variacao - ((5.0414 - 5.0277) / 5.0277) * 100) < 1e-9);
});

test('PTAX depois do fechamento: valor de fechamento, não parcial', () => {
  const r = lerPtax({ value: [boletim(5.0383, '2026-10-22 13:12:09.3', 'Fechamento'), boletim(5.0363, '2026-10-22 13:12:09.2', 'Intermediário'), boletim(5.0277, '2026-10-21 13:08:17.0', 'Fechamento')] });
  assert.equal(r.valor, 5.0383);
  assert.equal(r.parcial, false);
  assert.ok(Math.abs(r.variacao - ((5.0383 - 5.0277) / 5.0277) * 100) < 1e-9);
});

test('PTAX sem fechamento anterior não inventa variação; vazio vira null', () => {
  assert.equal(lerPtax({ value: [boletim(5.014, '2026-10-20 13:09:36', 'Fechamento')] }).variacao, null);
  assert.equal(lerPtax({ value: [] }), null);
  assert.equal(lerPtax({}), null);
});

test('url da PTAX usa MM-DD-AAAA e pede os boletins do dia', () => {
  const u = urlPtax(new Date('2026-10-21T12:00:00Z'));
  assert.match(u, /@di='10-07-2026'&@df='10-21-2026'/);
  assert.match(u, /CotacaoMoedaPeriodo\(/);
  assert.match(u, /tipoBoletim/);
});

test('pregão: dia útil, 10h às 18h de Brasília', () => {
  assert.equal(pregaoAberto(new Date('2026-10-21T13:00:00Z')), true); // quarta, 10h em Brasília
  assert.equal(pregaoAberto(new Date('2026-10-21T12:59:00Z')), false); // 9h59
  assert.equal(pregaoAberto(new Date('2026-10-21T20:59:00Z')), true); // 17h59
  assert.equal(pregaoAberto(new Date('2026-10-21T21:00:00Z')), false); // 18h
  assert.equal(pregaoAberto(new Date('2026-10-24T15:00:00Z')), false); // sábado
});

test('cache curto no pregão e longo fora dele', () => {
  assert.equal(segundosDeCache(new Date('2026-10-21T15:00:00Z')), 60);
  assert.equal(segundosDeCache(new Date('2026-10-24T15:00:00Z')), 900);
});


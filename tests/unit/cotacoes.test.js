import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCotacaoReserva, URL_RESERVA, lerCotacaoB3, lerPtax, pregaoAberto, segundosDeCache, urlPtax } from '../../functions/_lib/cotacoes.js';

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

test('PTAX: valor, variação sobre o fechamento anterior e data', () => {
  const r = lerPtax({ value: [{ cotacaoVenda: 5.1, dataHoraCotacao: '2026-10-20 13:09:36.25' }, { cotacaoVenda: 5.0, dataHoraCotacao: '2026-10-19 13:10:00.1' }] });
  assert.equal(r.valor, 5.1);
  assert.equal(r.data, '2026-10-20');
  assert.ok(Math.abs(r.variacao - 2) < 1e-9);
});

test('PTAX com um só fechamento não inventa variação; vazio vira null', () => {
  assert.equal(lerPtax({ value: [{ cotacaoVenda: 5.014, dataHoraCotacao: '2026-10-20 13:09:36' }] }).variacao, null);
  assert.equal(lerPtax({ value: [] }), null);
  assert.equal(lerPtax({}), null);
});

test('url da PTAX usa MM-DD-AAAA e pede só o fechamento de venda', () => {
  const u = urlPtax(new Date('2026-10-21T12:00:00Z'));
  assert.match(u, /@di='10-07-2026'&@df='10-21-2026'/);
  assert.match(u, /CotacaoMoedaPeriodoFechamento/);
  assert.match(u, /\$select=cotacaoVenda,dataHoraCotacao/);
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

test('fonte de reserva: preço, variação sobre o fechamento anterior e endereço do índice e da ação', () => {
  const r = lerCotacaoReserva({ chart: { result: [{ meta: { regularMarketPrice: 58.09, chartPreviousClose: 58.0, longName: 'Petroleo  Brasileiro' } }] } }, 'PETR4');
  assert.equal(r.simbolo, 'PETR4');
  assert.equal(r.nome, 'Petroleo Brasileiro');
  assert.ok(Math.abs(r.variacao - 0.155172) < 1e-4);
  assert.equal(lerCotacaoReserva({}, 'X'), null);
  assert.match(URL_RESERVA('IBOV'), /chart\/%5EBVSP\?/);
  assert.match(URL_RESERVA('PETR4'), /chart\/PETR4\.SA\?/);
});

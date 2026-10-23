import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerSelic, lerIpca12m, lerIpca12mSidra, itensIndicadores, diaCurto } from '../../functions/_lib/indicadores.js';
import { decodificar, lerRss } from '../../scripts/lib/rss.mjs';

test('leitura da Selic e do IPCA nas respostas do Banco Central e do IBGE', () => {
  assert.deepEqual(lerSelic({ conteudo: [{ MetaSelic: 13.75, NumeroReuniaoCopom: 281, DataInicioVigencia: '2026-09-17T03:00:00Z' }] }), { meta: 13.75, reuniao: 281, desde: '2026-09-17' });
  assert.equal(lerSelic({}), null);
  assert.deepEqual(lerIpca12m([{ resultados: [{ series: [{ serie: { 202608: '4.40', 202609: '4.58' } }] }] }]), { valor: 4.58, mes: 9, ano: 2026 });
  assert.equal(lerIpca12m([]), null);
});

test('itens da faixa no formato de indicadores.json; o que falta fica de fora', () => {
  assert.deepEqual(
    itensIndicadores({ selic: { meta: 13.75, desde: '2026-09-17' }, ipca: { valor: 4.58, mes: 9, ano: 2026 }, ptax: { valor: 5.0383, data: '2026-10-22', hora: '13:12', parcial: false } }),
    [
      { nome: 'Selic', valor: '13,75% a.a.', data: 'desde 17 set 2026' },
      { nome: 'IPCA 12m', valor: '4,58%', data: 'set 2026' },
      { nome: 'Dólar PTAX', valor: 'R$ 5,0383', data: '22 out 2026' },
    ]
  );
  assert.deepEqual(itensIndicadores({ selic: null, ipca: null, ptax: null }), []);
  assert.equal(itensIndicadores({ ptax: { valor: 5.0414, data: '2026-10-22', hora: '12:04', parcial: true } })[0].data, '22 out 2026, 12h04 (parcial)');
  assert.equal(diaCurto('2026-03-01'), '1 mar 2026');
});

test('RSS: lê título, link e data, com CDATA, entidades e codificação latin1', () => {
  const xml = '<?xml version="1.0" encoding="ISO-8859-1"?><rss><channel>' +
    '<item><title><![CDATA[Copom mantém Selic]]></title><link>https://a.com/1</link><pubDate>Thu, 22 Oct 2026 13:00:00 -0300</pubDate></item>' +
    '<item><title>IPCA &amp; câmbio</title><link>https://a.com/2</link><pubDate>Thu, 22 Oct 2026 14:00:00 -0300</pubDate></item>' +
    '<item><title>Sem data</title><link>https://a.com/3</link></item></channel></rss>';
  const itens = lerRss(decodificar(Buffer.from(xml, 'latin1')));
  assert.deepEqual(itens.map((i) => i.titulo), ['IPCA & câmbio', 'Copom mantém Selic']);
  assert.equal(itens[1].link, 'https://a.com/1');
});

test('IPCA 12m pelo endereço alternativo do IBGE (Sidra)', () => {
  const sidra = [{ V: 'Valor', D3C: 'Mês (Código)' }, { V: '4.58', D3C: '202609' }];
  assert.deepEqual(lerIpca12mSidra(sidra), { valor: 4.58, mes: 9, ano: 2026 });
  assert.equal(lerIpca12mSidra([{ V: 'Valor', D3C: 'Mês (Código)' }]), null);
  assert.equal(lerIpca12mSidra({}), null);
});

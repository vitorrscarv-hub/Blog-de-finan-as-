import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nomeDaFonte, instituicoes } from '../../src/scripts/fontes.ts';

test('reconhece as instituições pelo endereço', () => {
  assert.equal(nomeDaFonte('https://www.bcb.gov.br/controleinflacao/historicotaxasjuros'), 'Banco Central');
  assert.equal(nomeDaFonte('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados'), 'Banco Central');
  assert.equal(nomeDaFonte('https://agenciadenoticias.ibge.gov.br/agencia-noticias/x'), 'IBGE');
  assert.equal(nomeDaFonte('https://www.gov.br/receitafederal/pt-br/assuntos'), 'Receita Federal');
  assert.equal(nomeDaFonte('https://www.gov.br/cvm/pt-br'), 'CVM');
  assert.equal(nomeDaFonte('https://www.federalreserve.gov/newsevents/pressreleases.htm'), 'Federal Reserve');
  assert.equal(nomeDaFonte('https://ec.europa.eu/eurostat/web/main'), 'Eurostat');
  assert.equal(nomeDaFonte('https://ec.europa.eu/commission/presscorner'), 'Comissão Europeia');
  assert.equal(nomeDaFonte('https://www.reuters.com/markets/'), 'Reuters');
});

test('endereço desconhecido aparece pelo domínio, sem www', () => {
  assert.equal(nomeDaFonte('https://www.exemplo.com/pagina'), 'exemplo.com');
  assert.equal(nomeDaFonte('https://www.gov.br/outro-orgao/x'), 'gov.br');
  assert.equal(nomeDaFonte('não é url'), 'não é url');
});

test('lista cada instituição uma vez, na ordem, com a primeira url', () => {
  const lista = instituicoes([
    { url: 'https://www.bcb.gov.br/a' },
    { url: 'https://www.ibge.gov.br/b' },
    { url: 'https://api.bcb.gov.br/c' },
  ]);
  assert.deepEqual(lista, [
    { nome: 'Banco Central', url: 'https://www.bcb.gov.br/a' },
    { nome: 'IBGE', url: 'https://www.ibge.gov.br/b' },
  ]);
});

test('nomes das instituições da ampliação (mercado e potências)', () => {
  assert.equal(nomeDaFonte('https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/'), 'CVM');
  assert.equal(nomeDaFonte('https://www.rad.cvm.gov.br/ENET/x'), 'CVM');
  assert.equal(nomeDaFonte('https://www.ons.gov.uk/economy'), 'ONS (Reino Unido)');
  assert.equal(nomeDaFonte('https://www.gov.uk/government/news/x'), 'Governo do Reino Unido');
  assert.equal(nomeDaFonte('https://www.bundesbank.de/en'), 'Bundesbank');
  assert.equal(nomeDaFonte('https://www.iaea.org/newscenter'), 'AIEA');
  assert.equal(nomeDaFonte('https://ofac.treasury.gov/recent-actions'), 'Tesouro dos EUA');
});

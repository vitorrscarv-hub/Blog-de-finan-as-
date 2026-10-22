// Atualiza src/data/indicadores.json (Selic, IPCA 12m, dólar PTAX) direto das fontes oficiais, sem IA.
// Uso: node scripts/indicadores.mjs
// No site, a faixa troca esses valores pelos da função /api/cotacoes assim que a página abre; este arquivo é o valor
// de reserva gravado no build (página sem JavaScript ou função fora do ar). A edição diária roda este script antes do commit.
// Só troca valor e data do que mudou; item cuja fonte não respondeu fica como estava.
import { readFileSync, writeFileSync } from 'node:fs';
import { baixarJson, URL_SELIC, URL_IPCA, lerSelic, lerIpca12m, itensIndicadores } from './lib/oficiais.mjs';
import { urlPtax, lerPtax } from '../functions/_lib/cotacoes.js';

const ARQUIVO = new URL('../src/data/indicadores.json', import.meta.url);
const tentar = (nome, fn) => {
  try {
    return fn();
  } catch (e) {
    console.warn(`aviso: ${nome} falhou (${e.message.split('\n')[0]}), mantido como estava`);
    return null;
  }
};

const novos = Object.fromEntries(
  itensIndicadores({
    selic: tentar('Selic', () => lerSelic(baixarJson(URL_SELIC))),
    ipca: tentar('IPCA', () => lerIpca12m(baixarJson(URL_IPCA))),
    ptax: tentar('PTAX', () => lerPtax(baixarJson(urlPtax()))),
  }).map((i) => [i.nome, i])
);

const arquivo = JSON.parse(readFileSync(ARQUIVO, 'utf8'));
const mudancas = [];
for (const item of arquivo.itens) {
  const n = novos[item.nome];
  if (n && (item.valor !== n.valor || item.data !== n.data)) {
    mudancas.push(`${item.nome}: ${item.valor} (${item.data}) -> ${n.valor} (${n.data})`);
    Object.assign(item, { valor: n.valor, data: n.data });
  }
}
if (mudancas.length) writeFileSync(ARQUIVO, JSON.stringify(arquivo, null, 2) + '\n');
console.log(mudancas.length ? mudancas.join('\n') : 'indicadores sem mudança');

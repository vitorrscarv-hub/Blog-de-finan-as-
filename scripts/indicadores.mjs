// Atualiza src/data/indicadores.json (Selic, IPCA 12m, dólar PTAX) direto das fontes oficiais, sem IA.
// Uso: node scripts/indicadores.mjs [--so=selic|ipca|ptax]
// Só troca valor e data do que mudou; item cuja fonte não respondeu fica como estava. Imprime o que mudou.
import { readFileSync, writeFileSync } from 'node:fs';
import { baixarJson, URL_SELIC, URL_IPCA, lerSelic, lerIpca12m, mesAno, lerFechamentos, urlFechamentos, diaCurto, virgula, hojeBrasilia } from './lib/oficiais.mjs';

const ARQUIVO = new URL('../src/data/indicadores.json', import.meta.url);
const so = (process.argv.find((a) => a.startsWith('--so=')) ?? '').split('=')[1];
const quer = (nome) => !so || so === nome;

const novos = {};
const tentar = (nome, fn) => {
  if (!quer(nome)) return;
  try {
    const r = fn();
    if (r) novos[r.nome] = r;
    else console.warn(`aviso: ${nome} sem dado válido, mantido como estava`);
  } catch (e) {
    console.warn(`aviso: ${nome} falhou (${e.message.split('\n')[0]}), mantido como estava`);
  }
};

tentar('selic', () => {
  const s = lerSelic(baixarJson(URL_SELIC));
  return s && { nome: 'Selic', valor: `${virgula(s.meta, 2)}% a.a.`, data: `desde ${diaCurto(s.desde)}` };
});
tentar('ipca', () => {
  const i = lerIpca12m(baixarJson(URL_IPCA));
  return i && { nome: 'IPCA 12m', valor: `${virgula(i.valor, 2)}%`, data: mesAno(i.mes, i.ano) };
});
tentar('ptax', () => {
  const hoje = hojeBrasilia();
  const de = new Date(Date.parse(hoje) - 10 * 86400_000).toISOString().slice(0, 10);
  const f = lerFechamentos(baixarJson(urlFechamentos(de, hoje))).pop();
  return f && { nome: 'Dólar PTAX', valor: `R$ ${virgula(f.venda, 4)}`, data: diaCurto(f.data) };
});

const arquivo = JSON.parse(readFileSync(ARQUIVO, 'utf8'));
const mudancas = [];
for (const item of arquivo.itens) {
  const n = novos[item.nome];
  if (n && (item.valor !== n.valor || item.data !== n.data)) {
    mudancas.push(`${item.nome}: ${item.valor} (${item.data}) -> ${n.valor} (${n.data})`);
    item.valor = n.valor;
    item.data = n.data;
  }
}
if (mudancas.length) writeFileSync(ARQUIVO, JSON.stringify(arquivo, null, 2) + '\n');
console.log(mudancas.length ? mudancas.join('\n') : 'indicadores sem mudança');

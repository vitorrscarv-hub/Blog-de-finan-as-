// Cloudflare Pages Function: dados ao vivo do topo do site.
// Rota: GET /api/cotacoes
//
// Lê o dólar PTAX e a meta Selic (Banco Central) e o IPCA em 12 meses (IBGE). Devolve:
//   ptax         para a tarja de cotações
//   indicadores  para a faixa de indicadores, no formato de src/data/indicadores.json
// O Ibovespa e as ações são lidos pelo navegador do leitor direto na B3 (src/components/Tarja.astro): a B3 libera
// CORS, mas recusa consultas vindas da Cloudflare, onde esta função roda.
// A resposta fica guardada na borda da Cloudflare (60 s no pregão, 15 min fora dele). Não usa banco, chave nem segredo.
// O campo "diagnostico" diz, por fonte, "ok" ou o motivo da falha: abra /api/cotacoes para ver.
import { urlPtax, lerPtax, segundosDeCache } from '../_lib/cotacoes.js';
import { URL_SELIC, URL_IPCA, URL_IPCA_SIDRA, lerSelic, lerIpca12m, lerIpca12mSidra, itensIndicadores } from '../_lib/indicadores.js';

async function ler(diagnostico, nome, url, ler) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const v = ler(await r.json());
    diagnostico[nome] = v ? 'ok' : 'resposta sem dado';
    return v;
  } catch (e) {
    diagnostico[nome] = e.name === 'TimeoutError' ? 'tempo esgotado' : e.message;
    return null;
  }
}

export async function onRequestGet({ request, waitUntil }) {
  const cache = caches.default;
  const chave = new Request(new URL('/api/cotacoes', request.url).href);
  const guardada = await cache.match(chave);
  if (guardada) return guardada;

  const diagnostico = {};
  const [ptax, selic, ipca] = await Promise.all([
    ler(diagnostico, 'ptax', urlPtax(), lerPtax),
    ler(diagnostico, 'selic', URL_SELIC, lerSelic),
    // IPCA: se o endereço principal do IBGE cair, lê o alternativo.
    ler(diagnostico, 'ipca', URL_IPCA, lerIpca12m).then((v) => v ?? ler(diagnostico, 'ipca-sidra', URL_IPCA_SIDRA, lerIpca12mSidra)),
  ]);
  const indicadores = itensIndicadores({ selic, ipca, ptax });
  const algum = indicadores.length > 0;

  const resposta = new Response(JSON.stringify({ atualizadoEm: new Date().toISOString(), itens: [], ptax, indicadores, diagnostico }), {
    status: algum ? 200 : 502,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${algum ? segundosDeCache() : 15}` },
  });
  waitUntil(cache.put(chave, resposta.clone()));
  return resposta;
}

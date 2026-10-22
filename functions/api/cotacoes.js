// Cloudflare Pages Function: PTAX da tarja de cotações do topo do site.
// Rota: GET /api/cotacoes
//
// Só o dólar PTAX (Olinda do Banco Central). O Ibovespa e as ações são lidos pelo navegador do leitor direto na B3
// (src/components/Tarja.astro): a B3 libera CORS, mas recusa consultas vindas da Cloudflare, onde esta função roda.
// A resposta fica guardada na borda da Cloudflare (60 s no pregão, 15 min fora dele). Não usa banco, chave nem segredo.
import { urlPtax, lerPtax, segundosDeCache } from '../_lib/cotacoes.js';

export async function onRequestGet({ request, waitUntil }) {
  const cache = caches.default;
  const chave = new Request(new URL('/api/cotacoes', request.url).href);
  const guardada = await cache.match(chave);
  if (guardada) return guardada;

  let ptax = null;
  let diagnostico = 'ok';
  try {
    const r = await fetch(urlPtax(), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    ptax = lerPtax(await r.json());
    if (!ptax) diagnostico = 'resposta sem PTAX';
  } catch (e) {
    diagnostico = e.name === 'TimeoutError' ? 'tempo esgotado' : e.message;
  }

  const resposta = new Response(JSON.stringify({ atualizadoEm: new Date().toISOString(), itens: [], ptax, diagnostico: { bancoCentral: diagnostico } }), {
    status: ptax ? 200 : 502,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ptax ? segundosDeCache() : 15}` },
  });
  waitUntil(cache.put(chave, resposta.clone()));
  return resposta;
}

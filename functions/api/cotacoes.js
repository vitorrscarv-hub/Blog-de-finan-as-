// Cloudflare Pages Function: cotações da tarja do topo do site.
// Rota: GET /api/cotacoes
//
// Lê a B3 (Ibovespa e ações da lista em src/data/tarja.json, com atraso de 15 minutos) e a PTAX do Banco Central.
// Não usa banco, chave nem segredo. A resposta fica guardada na borda da Cloudflare (60 s no pregão, 15 min fora dele),
// então o número de consultas às fontes não depende do número de leitores.
import lista from '../../src/data/tarja.json';
import { URL_B3, urlPtax, lerCotacaoB3, lerPtax, segundosDeCache } from '../_lib/cotacoes.js';

const TEMPO_LIMITE_MS = 5000;

const buscar = async (url) => {
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};
// Cada fonte falha sozinha: o que não respondeu sai da tarja, o resto continua.
const tentar = async (fn) => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

export async function onRequestGet({ request, waitUntil }) {
  const cache = caches.default;
  const chave = new Request(new URL('/api/cotacoes', request.url).href);
  const guardada = await cache.match(chave);
  if (guardada) return guardada;

  const [indice, acoes, ptax] = await Promise.all([
    tentar(async () => lerCotacaoB3(await buscar(URL_B3(lista.indice)))),
    Promise.all(lista.acoes.map((s) => tentar(async () => lerCotacaoB3(await buscar(URL_B3(s)))))),
    tentar(async () => lerPtax(await buscar(urlPtax()))),
  ]);

  const itens = [indice, ...acoes].filter(Boolean);
  const vazio = itens.length === 0 && !ptax;
  const ttl = vazio ? 15 : segundosDeCache();
  const resposta = new Response(JSON.stringify({ atualizadoEm: new Date().toISOString(), itens, ptax }), {
    status: vazio ? 502 : 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ttl}` },
  });
  waitUntil(cache.put(chave, resposta.clone()));
  return resposta;
}

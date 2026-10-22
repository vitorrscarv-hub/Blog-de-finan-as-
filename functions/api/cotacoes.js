// Cloudflare Pages Function: cotações da tarja do topo do site.
// Rota: GET /api/cotacoes
//
// Lê a B3 (Ibovespa e ações da lista em src/data/tarja.json, com atraso de 15 minutos) e a PTAX do Banco Central.
// Se a B3 recusar a consulta (já aconteceu com IPs de datacenter), cada papel cai numa fonte de reserva.
// Não usa banco, chave nem segredo. A resposta fica guardada na borda da Cloudflare (60 s no pregão, 15 min fora dele),
// então o número de consultas às fontes não depende do número de leitores.
// O campo "diagnostico" da resposta diz qual fonte respondeu e, se falhou, o código HTTP: abra /api/cotacoes para ver.
import lista from '../../src/data/tarja.json';
import { URL_B3, URL_RESERVA, urlPtax, lerCotacaoB3, lerCotacaoReserva, lerPtax, segundosDeCache } from '../_lib/cotacoes.js';

const TEMPO_LIMITE_MS = 5000;
// A B3 filtra clientes sem cara de navegador.
const CABECALHOS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Origin: 'https://www.b3.com.br',
  Referer: 'https://www.b3.com.br/',
};

// A fonte de reserva não precisa (nem deve receber) a origem da B3.
const CABECALHOS_RESERVA = { Accept: CABECALHOS.Accept, 'User-Agent': CABECALHOS['User-Agent'] };

const buscar = async (url, cabecalhos = CABECALHOS) => {
  const r = await fetch(url, { headers: cabecalhos, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const contagem = () => ({ ok: 0, falhas: new Set() });
const tentar = async (c, fn) => {
  try {
    const r = await fn();
    if (r) c.ok++;
    else c.falhas.add('resposta sem preço');
    return r;
  } catch (e) {
    c.falhas.add(e.name === 'TimeoutError' ? 'tempo esgotado' : e.message);
    return null;
  }
};
const resumo = (c, total) => (c.ok === total ? `ok ${c.ok}/${total}` : `${c.ok}/${total}${c.falhas.size ? ` (${[...c.falhas].join(', ')})` : ''}`);

export async function onRequestGet({ request, waitUntil }) {
  const cache = caches.default;
  const chave = new Request(new URL('/api/cotacoes', request.url).href);
  const guardada = await cache.match(chave);
  if (guardada) return guardada;

  const b3 = contagem();
  const reserva = contagem();
  const bc = contagem();
  const simbolos = [lista.indice, ...lista.acoes];

  const [papeis, ptax] = await Promise.all([
    Promise.all(
      simbolos.map(async (s) => {
        const da_b3 = await tentar(b3, async () => lerCotacaoB3(await buscar(URL_B3(s))));
        return da_b3 ?? (await tentar(reserva, async () => lerCotacaoReserva(await buscar(URL_RESERVA(s), CABECALHOS_RESERVA), s)));
      })
    ),
    tentar(bc, async () => lerPtax(await buscar(urlPtax()))),
  ]);

  const itens = papeis.filter(Boolean);
  const vazio = itens.length === 0 && !ptax;
  const ttl = vazio ? 15 : segundosDeCache();
  const diagnostico = { b3: resumo(b3, simbolos.length), reserva: reserva.ok + reserva.falhas.size === 0 ? 'não usada' : resumo(reserva, simbolos.length - b3.ok), bancoCentral: resumo(bc, 1) };
  const resposta = new Response(JSON.stringify({ atualizadoEm: new Date().toISOString(), itens, ptax, diagnostico }), {
    status: vazio ? 502 : 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ttl}` },
  });
  waitUntil(cache.put(chave, resposta.clone()));
  return resposta;
}

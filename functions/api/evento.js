// Cloudflare Pages Function: recebe os eventos de leitura do blog (medição de audiência).
// Rota: POST /api/evento   (corpo em JSON; o navegador envia como text/plain para evitar preflight)
//
// Não guarda IP nem user agent. Ignora robôs (pelo user agent e por redes de data center), prévias dos pull requests,
// "Não rastrear" (DNT) e Global Privacy Control.
// Variáveis e vínculos (os mesmos de /api/lead):
//   DB              vínculo D1 obrigatório (tabela "visitas" em db/schema.sql)
//   ALLOWED_ORIGIN  opcional; origens aceitas, separadas por vírgula

const resposta = (status = 204) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

const ROBO_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|facebookexternalhit|curl|wget|python|httpclient/i;
// Redes de data center (nuvem, hospedagem, CDN): leitores reais quase nunca saem delas, robôs que rodam a página sim.
// A rede é lida do Cloudflare (request.cf.asOrganization) só para decidir; nada disso é gravado.
const DATACENTER_RE = /amazon|aws|google cloud|google llc|microsoft|azure|digitalocean|linode|akamai|ovh|hetzner|oracle|alibaba|tencent|vultr|contabo|scaleway|leaseweb|choopa|m247|datacamp|cloudflare/i;
// Prévias dos pull requests (endereços *.pages.dev) usam o mesmo banco; só o site publicado é medido.
const ehPrevia = (url) => new URL(url).hostname.endsWith('.pages.dev');
const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const CAMINHO_RE = /^\/[A-Za-z0-9\-._~%/]*$/;
const PAINEL = '/painel-grafous/';
const LIMITE_CORPO = 2000;

const origemPermitida = (request, env) => {
  if (!env.ALLOWED_ORIGIN) return true;
  const aceitas = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''));
  return aceitas.includes(request.headers.get('Origin') ?? '');
};

export const dispositivoDe = (ua) =>
  /ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))
    ? 'tablet'
    : /mobi|iphone|ipod|android/i.test(ua)
      ? 'celular'
      : 'computador';

// Só o domínio de quem enviou o leitor, e só quando é outro site.
export const origemDe = (referencia, hostDoSite) => {
  if (!referencia) return null;
  try {
    const host = new URL(referencia).hostname.replace(/^www\./, '').slice(0, 100);
    return host && host !== String(hostDoSite).replace(/^www\./, '') ? host : null;
  } catch {
    return null;
  }
};

const inteiro = (v, max) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
};

export async function onRequestPost({ request, env }) {
  if (!origemPermitida(request, env)) return resposta(403);

  const ua = request.headers.get('User-Agent') ?? '';
  // Quem pediu para não ser medido, e robôs, recebem 204 sem que nada seja gravado.
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return resposta();
  if (!ua || ROBO_RE.test(ua)) return resposta();
  if (ehPrevia(request.url) || DATACENTER_RE.test(request.cf?.asOrganization ?? '')) return resposta();

  const texto = await request.text();
  if (texto.length > LIMITE_CORPO) return resposta(413);
  let c;
  try {
    c = JSON.parse(texto);
  } catch {
    return resposta(400);
  }
  if (!c || typeof c !== 'object' || Array.isArray(c)) return resposta(400);

  const caminho = String(c.p ?? '').split(/[?#]/)[0];
  if (!ID_RE.test(c.pv ?? '') || !ID_RE.test(c.vis ?? '') || !ID_RE.test(c.ses ?? '')) return resposta(400);
  if (caminho.length > 200 || !CAMINHO_RE.test(caminho)) return resposta(400);
  // O painel e as rotas internas não entram na medição.
  if (caminho.startsWith(PAINEL) || caminho.startsWith('/api/')) return resposta();

  try {
    if (c.t === 'v') {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO visitas (pv, ts, visitante, sessao, caminho, origem, dispositivo, pais, novo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          c.pv,
          Date.now(),
          c.vis,
          c.ses,
          caminho,
          origemDe(c.ref, new URL(request.url).hostname),
          dispositivoDe(ua),
          /^[A-Z]{2}$/.test(request.cf?.country ?? '') ? request.cf.country : null,
          c.novo ? 1 : 0
        )
        .run();
    } else if (c.t === 'l') {
      await env.DB.prepare(
        `UPDATE visitas SET rolagem = MAX(rolagem, ?), segundos = MAX(segundos, ?) WHERE pv = ? AND visitante = ?`
      )
        .bind(inteiro(c.rol, 100), inteiro(c.seg, 3600), c.pv, c.vis)
        .run();
    } else {
      return resposta(400);
    }
  } catch (e) {
    console.error('Falha ao gravar a medição', e);
    return resposta(500);
  }
  return resposta();
}

export const onRequest = ({ request }) =>
  request.method === 'OPTIONS' ? resposta() : new Response(null, { status: 405, headers: { Allow: 'POST' } });

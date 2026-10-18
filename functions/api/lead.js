// Cloudflare Pages Function: recebe o cadastro do pop-up e grava no banco D1.
// Rota: POST /api/lead
//
// Variáveis e vínculos (configure no painel do Cloudflare Pages ou no wrangler.toml):
//   DB                  vínculo D1 obrigatório (tabela em db/schema.sql)
//   LEAD_WEBHOOK_URL    opcional; se existir, o cadastro também é enviado por POST para essa URL
//                       (ferramenta de e-mail marketing, CRM, Zapier, Make etc.)
//   ALLOWED_ORIGIN      opcional; origens aceitas, separadas por vírgula,
//                       ex.: https://www.seudominio.com.br,https://seudominio.com.br

const json = (dados, status = 200, extra = {}) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// DDD (dois dígitos de 1 a 9) seguido de 8 ou 9 dígitos.
const WHATSAPP_RE = /^[1-9]{2}\d{8,9}$/;
const WEBHOOK_TIMEOUT_MS = 5000;

// Mesma regra do formulário: aceita "+55 (11) 91234-5678" ou "011 91234-5678".
export const normalizarWhatsapp = (valor) => {
  let d = String(valor ?? '').replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d.replace(/^0+/, '');
};

const origemPermitida = (request, env) => {
  if (!env.ALLOWED_ORIGIN) return true;
  const aceitas = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''));
  return aceitas.includes(request.headers.get('Origin') ?? '');
};

export async function onRequestPost({ request, env, waitUntil }) {
  if (!origemPermitida(request, env)) return json({ ok: false, erro: 'origem' }, 403);

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return json({ ok: false, erro: 'formato' }, 400);
  }
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return json({ ok: false, erro: 'formato' }, 400);
  }

  // Campo-armadilha: robôs costumam preencher. Respondemos ok sem gravar.
  if (corpo.site) return json({ ok: true });

  const nome = String(corpo.nome ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const email = String(corpo.email ?? '').trim().toLowerCase();
  const whatsapp = normalizarWhatsapp(corpo.whatsapp);
  const pagina = String(corpo.pagina ?? '').slice(0, 300);
  const origem = corpo.origem ? String(corpo.origem).slice(0, 300) : null;

  if (nome.length < 2) return json({ ok: false, erro: 'nome' }, 422);
  if (email.length > 160 || !EMAIL_RE.test(email)) return json({ ok: false, erro: 'email' }, 422);
  if (!WHATSAPP_RE.test(whatsapp)) return json({ ok: false, erro: 'whatsapp' }, 422);
  if (corpo.consentimento !== true) return json({ ok: false, erro: 'consentimento' }, 422);

  if (!env.DB) return json({ ok: false, erro: 'banco não configurado' }, 500);

  const agora = new Date().toISOString();
  const whatsappE164 = `+55${whatsapp}`;

  // Se o e-mail já existe, atualiza os dados em vez de duplicar; criado_em fica o original.
  try {
    await env.DB.prepare(
      `INSERT INTO leads (nome, email, whatsapp, pagina, origem, consentimento_em, criado_em, atualizado_em)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)
       ON CONFLICT(email) DO UPDATE SET
         nome = excluded.nome,
         whatsapp = excluded.whatsapp,
         pagina = excluded.pagina,
         origem = excluded.origem,
         consentimento_em = excluded.consentimento_em,
         atualizado_em = excluded.atualizado_em`
    )
      .bind(nome, email, whatsappE164, pagina, origem, agora)
      .run();
  } catch (e) {
    console.error('Falha ao gravar cadastro no D1', e);
    return json({ ok: false, erro: 'banco' }, 500);
  }

  if (env.LEAD_WEBHOOK_URL) {
    // Falha no webhook não impede a liberação da leitura; o dado já está no D1.
    // Com waitUntil, a resposta sai na hora e o envio termina em segundo plano.
    const envio = fetch(env.LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, whatsapp: whatsappE164, pagina, origem, criado_em: agora }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    }).catch((e) => console.error('Falha ao enviar cadastro para o webhook', e));
    if (typeof waitUntil === 'function') waitUntil(envio);
    else await envio;
  }

  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, erro: 'método não permitido' }, 405, { Allow: 'POST' });
}

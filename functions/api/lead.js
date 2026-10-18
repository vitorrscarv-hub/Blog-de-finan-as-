// Cloudflare Pages Function: recebe o cadastro do pop-up e grava no banco D1.
// Rota: POST /api/lead
//
// Variáveis e vínculos (configure no painel do Cloudflare Pages ou no wrangler.toml):
//   DB                  vínculo D1 obrigatório (tabela em db/schema.sql)
//   LEAD_WEBHOOK_URL    opcional; se existir, o cadastro também é enviado por POST para essa URL
//                       (ferramenta de e-mail marketing, CRM, Zapier, Make etc.)
//   ALLOWED_ORIGIN      opcional; domínio aceito, ex.: https://www.seudominio.com.br

const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  if (env.ALLOWED_ORIGIN) {
    const origem = request.headers.get('Origin');
    if (origem && origem !== env.ALLOWED_ORIGIN) return json({ ok: false, erro: 'origem' }, 403);
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return json({ ok: false, erro: 'formato' }, 400);
  }

  // Campo-armadilha: robôs costumam preencher. Respondemos ok sem gravar.
  if (corpo.site) return json({ ok: true });

  const nome = String(corpo.nome || '').trim().slice(0, 120);
  const email = String(corpo.email || '').trim().toLowerCase().slice(0, 160);
  const whatsapp = String(corpo.whatsapp || '').replace(/\D/g, '');
  const pagina = String(corpo.pagina || '').slice(0, 300);
  const origem = corpo.origem ? String(corpo.origem).slice(0, 300) : null;

  if (nome.length < 2) return json({ ok: false, erro: 'nome' }, 422);
  if (!EMAIL_RE.test(email)) return json({ ok: false, erro: 'email' }, 422);
  if (whatsapp.length < 10 || whatsapp.length > 11) return json({ ok: false, erro: 'whatsapp' }, 422);
  if (corpo.consentimento !== true) return json({ ok: false, erro: 'consentimento' }, 422);

  const agora = new Date().toISOString();
  const whatsappE164 = `+55${whatsapp}`;

  if (!env.DB) return json({ ok: false, erro: 'banco não configurado' }, 500);

  // Se o e-mail já existe, atualiza nome e WhatsApp em vez de duplicar.
  await env.DB.prepare(
    `INSERT INTO leads (nome, email, whatsapp, pagina, origem, consentimento_em, criado_em, atualizado_em)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)
     ON CONFLICT(email) DO UPDATE SET
       nome = excluded.nome,
       whatsapp = excluded.whatsapp,
       consentimento_em = excluded.consentimento_em,
       atualizado_em = excluded.atualizado_em`
  )
    .bind(nome, email, whatsappE164, pagina, origem, agora)
    .run();

  if (env.LEAD_WEBHOOK_URL) {
    // Falha no webhook não impede a liberação da leitura; o dado já está no D1.
    try {
      await fetch(env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, whatsapp: whatsappE164, pagina, origem, criado_em: agora }),
      });
    } catch {}
  }

  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, erro: 'método não permitido' }, 405);
}

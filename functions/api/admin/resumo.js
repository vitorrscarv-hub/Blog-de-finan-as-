// Cloudflare Pages Function: dados do painel de audiência.
// Rota: GET /api/admin/resumo?dias=7|30|90   com o cabeçalho  Authorization: Bearer <ADMIN_TOKEN>
//
// Variáveis e vínculos:
//   DB            vínculo D1 (tabela "visitas" em db/schema.sql)
//   ADMIN_TOKEN   segredo definido no painel do Cloudflare Pages (Variables and Secrets, tipo Secret).
//                 Use um valor longo e aleatório (32 caracteres ou mais). Sem ele, a rota responde 503.
// Para uma camada a mais, proteja /painel-grafous/* e /api/admin/* com o Cloudflare Access.

import { resumir, PERIODOS } from '../../_lib/metricas.js';

const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

// Compara os dois valores pelo hash, em tempo constante.
export async function tokenConfere(recebido, esperado) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all(
    [recebido, esperado].map(async (v) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(v)))))
  );
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a[i] ^ b[i];
  return dif === 0;
}

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_TOKEN || String(env.ADMIN_TOKEN).length < 16) return json({ ok: false, erro: 'nao-configurado' }, 503);
  const recebido = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!recebido || !(await tokenConfere(recebido, env.ADMIN_TOKEN))) return json({ ok: false, erro: 'nao-autorizado' }, 401);

  const pedido = Number(new URL(request.url).searchParams.get('dias'));
  const dias = PERIODOS.includes(pedido) ? pedido : 30;
  try {
    return json({ ok: true, ...(await resumir(env.DB, dias)) });
  } catch (e) {
    console.error('Falha ao montar o resumo', e);
    return json({ ok: false, erro: 'banco' }, 500);
  }
}

export const onRequest = () => new Response(null, { status: 405, headers: { Allow: 'GET' } });

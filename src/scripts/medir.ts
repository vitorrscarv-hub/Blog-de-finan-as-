// Medição de audiência do blog: uma visita por página e, nos textos, até onde o leitor foi e por quanto tempo.
// Sem cookies. O navegador guarda só um identificador aleatório (localStorage). Não coleta IP, nome nem
// e-mail, e não roda quando o leitor pede "Não rastrear" (DNT) ou envia o Global Privacy Control.
// Os dados vão para /api/evento (functions/api/evento.js) e aparecem no painel interno.
import { SITE } from '../site.config';

const CHAVE_VISITANTE = 'grafous_v';
const CHAVE_SESSAO = 'grafous_s';
// Quem entra no painel marca o próprio navegador para não contar as visitas do editor.
export const CHAVE_IGNORAR = 'grafous_ignorar';

const aleatorio = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

function guardado(armazem: () => Storage, chave: string): { id: string; novo: boolean } {
  try {
    const a = armazem();
    const atual = a.getItem(chave);
    if (atual && /^[A-Za-z0-9-]{8,64}$/.test(atual)) return { id: atual, novo: false };
    const id = aleatorio();
    a.setItem(chave, id);
    return { id, novo: true };
  } catch {
    // Armazenamento bloqueado: a visita ainda conta, mas sem reconhecer o retorno.
    return { id: aleatorio(), novo: true };
  }
}

function enviar(dados: Record<string, unknown>) {
  const corpo = JSON.stringify(dados);
  try {
    // text/plain evita a checagem prévia (preflight) e funciona ao fechar a página.
    if (navigator.sendBeacon?.(SITE.metricas.endpoint, new Blob([corpo], { type: 'text/plain' }))) return;
  } catch {}
  fetch(SITE.metricas.endpoint, { method: 'POST', body: corpo, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}

export function medir() {
  if (!SITE.metricas.ativo) return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return;
  // Navegador controlado por automação (robôs que rodam a página). Em localhost fica liberado para os testes.
  if (navigator.webdriver && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  if (location.pathname.startsWith(SITE.metricas.painel)) return;
  try {
    if (localStorage.getItem(CHAVE_IGNORAR) === '1') return;
  } catch {}

  const visitante = guardado(() => localStorage, CHAVE_VISITANTE);
  const sessao = guardado(() => sessionStorage, CHAVE_SESSAO);
  const pv = aleatorio();
  const base = { pv, vis: visitante.id, ses: sessao.id, p: location.pathname };

  enviar({ ...base, t: 'v', ref: document.referrer, novo: visitante.novo });

  // Nos textos: ponto máximo lido (mesma linha de leitura do pop-up e da barra de progresso) e tempo visível.
  const corpo = document.querySelector<HTMLElement>('.artigo-corpo');
  if (!corpo) return;
  let rolagem = 0;
  let segundos = 0;
  let enviado = { rol: -1, seg: -1 };
  const medirRolagem = () => {
    const r = corpo.getBoundingClientRect();
    const lido = (window.innerHeight * 0.6 - r.top) / r.height;
    rolagem = Math.max(rolagem, Math.round(Math.min(1, Math.max(0, lido)) * 100));
  };
  const relatar = () => {
    medirRolagem();
    if (rolagem === enviado.rol && segundos === enviado.seg) return;
    enviado = { rol: rolagem, seg: segundos };
    enviar({ ...base, t: 'l', rol: rolagem, seg: segundos });
  };
  medirRolagem();
  window.addEventListener('scroll', medirRolagem, { passive: true });
  setInterval(() => {
    if (document.visibilityState === 'visible') segundos += 1;
  }, 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') relatar();
  });
  window.addEventListener('pagehide', relatar);
}

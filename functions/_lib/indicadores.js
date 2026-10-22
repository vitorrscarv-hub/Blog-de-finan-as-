// Regras puras da faixa de indicadores (Selic, IPCA 12m, dólar PTAX), sem rede e sem Node:
// usadas pela função /api/cotacoes (valores ao vivo) e por scripts/indicadores.mjs (valor de reserva no build).

export const URL_SELIC = 'https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros';
export const URL_IPCA = 'https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/2265?localidades=N1[all]';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const virgula = (n, casas) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
// "2026-10-20" -> "20 out 2026"
export const diaCurto = (iso) => `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
export const mesAno = (mes, ano) => `${MESES[mes - 1]} ${ano}`;

export function lerSelic(json) {
  const a = json?.conteudo?.[0];
  if (!a || typeof a.MetaSelic !== 'number') return null;
  return { meta: a.MetaSelic, reuniao: a.NumeroReuniaoCopom, desde: String(a.DataInicioVigencia).slice(0, 10) };
}

export function lerIpca12m(json) {
  const serie = json?.[0]?.resultados?.[0]?.series?.[0]?.serie;
  const [periodo, valor] = Object.entries(serie ?? {}).pop() ?? [];
  const n = Number(valor);
  if (!/^\d{6}$/.test(periodo ?? '') || !Number.isFinite(n)) return null;
  return { valor: n, mes: Number(periodo.slice(4)), ano: Number(periodo.slice(0, 4)) };
}

// Itens no mesmo formato de src/data/indicadores.json: { nome, valor, data }. O que faltar fica de fora.
export function itensIndicadores({ selic, ipca, ptax }) {
  return [
    selic && { nome: 'Selic', valor: `${virgula(selic.meta, 2)}% a.a.`, data: `desde ${diaCurto(selic.desde)}` },
    ipca && { nome: 'IPCA 12m', valor: `${virgula(ipca.valor, 2)}%`, data: mesAno(ipca.mes, ipca.ano) },
    ptax && { nome: 'Dólar PTAX', valor: `R$ ${virgula(ptax.valor, 4)}`, data: ptax.parcial ? `${diaCurto(ptax.data)}, ${ptax.hora.replace(':', 'h')} (parcial)` : diaCurto(ptax.data) },
  ].filter(Boolean);
}

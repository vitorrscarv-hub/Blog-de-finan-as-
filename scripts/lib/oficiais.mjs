// Leitura das fontes oficiais usadas pelas rotinas automáticas (sem IA): Banco Central e IBGE.
// Só leitura (GET), com curl como os outros scripts (respeita o proxy do ambiente e aceita colchetes na URL).
import { execFileSync } from 'node:child_process';

export const baixarJson = (url) =>
  JSON.parse(
    execFileSync('curl', ['-g', '-sS', '-L', '--fail', '--max-time', '60', '-H', 'User-Agent: Mozilla/5.0', url], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
  );

export const URL_SELIC = 'https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros';
export const URL_IPCA = 'https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/2265?localidades=N1[all]';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const virgula = (n, casas) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
// "2026-10-20" -> "20 out 2026" (curto, para a faixa) ou "20 de outubro de 2026" (texto).
export const diaCurto = (iso) => `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
export const diaLongo = (iso) => `${Number(iso.slice(8, 10))} de ${MESES_LONGOS[Number(iso.slice(5, 7)) - 1]} de ${iso.slice(0, 4)}`;

// Hoje no fuso de Brasília, como AAAA-MM-DD.
export const hojeBrasilia = (agora = new Date()) => new Date(agora.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

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
export const mesAno = (mes, ano) => `${MESES[mes - 1]} ${ano}`;

// Fechamentos da PTAX de venda e compra, do mais antigo para o mais novo.
export const urlFechamentos = (de, ate) => {
  const mdY = (iso) => `${iso.slice(5, 7)}-${iso.slice(8, 10)}-${iso.slice(0, 4)}`;
  return (
    'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/' +
    `CotacaoMoedaPeriodoFechamento(codigoMoeda=@m,dataInicialCotacao=@di,dataFinalCotacao=@df)?@m='USD'&@di='${mdY(de)}'&@df='${mdY(ate)}'` +
    '&$orderby=dataHoraCotacao%20asc&$top=500&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao&$format=json'
  );
};
export const lerFechamentos = (json) =>
  (json?.value ?? [])
    .filter((v) => Number.isFinite(v.cotacaoVenda) && Number.isFinite(v.cotacaoCompra) && /^\d{4}-\d{2}-\d{2}/.test(v.dataHoraCotacao))
    .map((v) => ({ data: v.dataHoraCotacao.slice(0, 10), compra: v.cotacaoCompra, venda: v.cotacaoVenda }));

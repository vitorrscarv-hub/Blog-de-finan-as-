// Regras puras da tarja de cotações (sem rede), para a função /api/cotacoes e para os testes.
// Fontes: cotação da B3 (com atraso de 15 minutos, a mesma consulta que o site da B3 usa) e PTAX do Banco Central.

export const URL_B3 = (simbolo) => `https://cotacao.b3.com.br/mds/api/v1/instrumentQuotation/${encodeURIComponent(simbolo)}`;

// MM-DD-AAAA, formato que o Olinda exige.
const mdY = (d) => `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${d.getUTCFullYear()}`;

// Últimos fechamentos da PTAX de venda. Janela de 14 dias para atravessar fim de semana e feriado.
export const urlPtax = (hoje = new Date()) => {
  const ini = new Date(hoje.getTime() - 14 * 86400_000);
  return (
    'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/' +
    `CotacaoMoedaPeriodoFechamento(codigoMoeda=@m,dataInicialCotacao=@di,dataFinalCotacao=@df)?@m='USD'&@di='${mdY(ini)}'&@df='${mdY(hoje)}'` +
    '&$orderby=dataHoraCotacao%20desc&$top=2&$select=cotacaoVenda,dataHoraCotacao&$format=json'
  );
};

// Fonte de reserva, usada quando a B3 recusa a consulta. Mesmo atraso de 15 minutos nos papéis da B3.
export const URL_RESERVA = (simbolo) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo === 'IBOV' ? '^BVSP' : `${simbolo}.SA`)}?range=1d&interval=1d`;

const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// Resposta da B3 -> { simbolo, nome, preco, variacao }. Devolve null se faltar preço ou se não for do Ibovespa.
export function lerCotacaoB3(json, { exigirIndice = true } = {}) {
  const q = json?.Trad?.[0]?.scty;
  const preco = numero(q?.SctyQtn?.curPrc);
  if (!q?.symb || preco === null || preco <= 0) return null;
  if (exigirIndice && q.indxCmpnInd !== true && q.mkt?.nm !== 'Indices') return null;
  return {
    simbolo: q.symb,
    nome: String(q.desc ?? q.symb).replace(/\s+/g, ' ').trim(),
    preco,
    variacao: numero(q.SctyQtn.prcFlcn),
    hora: json?.Msg?.dtTm ?? null,
  };
}

// Resposta da fonte de reserva -> mesmo formato. A variação vem do fechamento anterior.
export function lerCotacaoReserva(json, simbolo) {
  const m = json?.chart?.result?.[0]?.meta;
  const preco = numero(m?.regularMarketPrice);
  if (preco === null || preco <= 0) return null;
  const anterior = numero(m.chartPreviousClose) ?? numero(m.previousClose);
  return {
    simbolo,
    nome: String(m.longName ?? m.shortName ?? simbolo).replace(/\s+/g, ' ').trim(),
    preco,
    variacao: anterior ? ((preco - anterior) / anterior) * 100 : null,
    hora: null,
  };
}

// Resposta do Olinda (ordenada do mais novo para o mais antigo) -> { valor, variacao, data }.
export function lerPtax(json) {
  const v = json?.value;
  if (!Array.isArray(v) || v.length === 0) return null;
  const valor = numero(v[0].cotacaoVenda);
  if (valor === null) return null;
  const anterior = v.length > 1 ? numero(v[1].cotacaoVenda) : null;
  return {
    valor,
    variacao: anterior ? ((valor - anterior) / anterior) * 100 : null,
    data: String(v[0].dataHoraCotacao ?? '').slice(0, 10) || null,
  };
}

// Pregão da B3 em dias úteis, 10h às 18h (horário de Brasília = UTC-3, sem horário de verão).
// Feriado não é conhecido aqui: só afeta quanto tempo a resposta fica guardada, nunca o valor.
export function pregaoAberto(agora = new Date()) {
  const br = new Date(agora.getTime() - 3 * 3600_000);
  const dia = br.getUTCDay();
  const minutos = br.getUTCHours() * 60 + br.getUTCMinutes();
  return dia >= 1 && dia <= 5 && minutos >= 10 * 60 && minutos < 18 * 60;
}

// Quanto tempo (segundos) a resposta pode ficar guardada na borda da Cloudflare.
export const segundosDeCache = (agora = new Date()) => (pregaoAberto(agora) ? 60 : 900);

// Regras puras da tarja de cotações (sem rede), para a função /api/cotacoes e para os testes.
// Fontes: cotação da B3 (com atraso de 15 minutos, a mesma consulta que o site da B3 usa) e PTAX do Banco Central.

export const URL_B3 = (simbolo) => `https://cotacao.b3.com.br/mds/api/v1/instrumentQuotation/${encodeURIComponent(simbolo)}`;

// MM-DD-AAAA, formato que o Olinda exige.
const mdY = (d) => `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${d.getUTCFullYear()}`;

// Boletins da PTAX de venda (abertura por volta das 10h, intermediários às 11h e 12h, fechamento às 13h), do mais novo
// para o mais antigo. Janela de 14 dias para atravessar fim de semana e feriado; 20 boletins cobrem ao menos 4 dias.
export const urlPtax = (hoje = new Date()) => {
  const ini = new Date(hoje.getTime() - 14 * 86400_000);
  return (
    'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/' +
    `CotacaoMoedaPeriodo(moeda=@m,dataInicial=@di,dataFinalCotacao=@df)?@m='USD'&@di='${mdY(ini)}'&@df='${mdY(hoje)}'` +
    '&$orderby=dataHoraCotacao%20desc&$top=20&$select=cotacaoVenda,dataHoraCotacao,tipoBoletim&$format=json'
  );
};

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

// Resposta do Olinda -> { valor, variacao, data, hora, parcial }. O valor é o boletim mais recente; antes do
// fechamento do dia, ele é parcial. A variação é sempre sobre o fechamento do dia útil anterior.
export function lerPtax(json) {
  const v = (json?.value ?? []).filter((b) => numero(b.cotacaoVenda) !== null && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(b.dataHoraCotacao ?? ''));
  if (v.length === 0) return null;
  const atual = v[0];
  const dia = atual.dataHoraCotacao.slice(0, 10);
  const anterior = v.find((b) => b.dataHoraCotacao.slice(0, 10) < dia && (b.tipoBoletim ?? 'Fechamento') === 'Fechamento');
  return {
    valor: atual.cotacaoVenda,
    variacao: anterior ? ((atual.cotacaoVenda - anterior.cotacaoVenda) / anterior.cotacaoVenda) * 100 : null,
    data: dia,
    hora: atual.dataHoraCotacao.slice(11, 16),
    parcial: (atual.tipoBoletim ?? 'Fechamento') !== 'Fechamento',
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

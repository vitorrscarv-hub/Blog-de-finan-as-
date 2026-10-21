// Agenda das divulgações que mexem com o blog. Regras puras, sem rede, para o script e os testes.
// O IBGE publica o calendário com horário em UTC ("12/11/2026 12:00:00" = 9h em Brasília).

// Divulgações acompanhadas, pelo título exato no calendário do IBGE.
export const ACOMPANHADAS = {
  ipca: 'Índice Nacional de Preços ao Consumidor Amplo',
  'ipca-15': 'Índice Nacional de Preços ao Consumidor Amplo 15',
  pib: 'Contas Nacionais Trimestrais',
  pnad: 'Pesquisa Nacional por Amostra de Domicílios Contínua Mensal',
  industria: 'Pesquisa Industrial Mensal: Produção Física - Brasil',
  varejo: 'Pesquisa Mensal de Comércio',
  servicos: 'Pesquisa Mensal de Serviços',
};
// Quais delas mudam um número da faixa de indicadores (as demais só viram pauta).
export const ATUALIZA_INDICADORES = new Set(['ipca']);

const UTC = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
export const paraIsoUtc = (s) => {
  const m = UTC.exec(s ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
};

export function eventosDoIbge(itens) {
  const porTitulo = new Map(Object.entries(ACOMPANHADAS).map(([chave, titulo]) => [titulo, chave]));
  return itens
    .map((i) => ({ chave: porTitulo.get(i.titulo), titulo: i.titulo, quandoUtc: paraIsoUtc(i.data_divulgacao) }))
    .filter((e) => e.chave && e.quandoUtc)
    .map((e) => ({ id: `${e.chave}-${e.quandoUtc.slice(0, 10)}`, ...e, fonte: 'IBGE', atualizaIndicadores: ATUALIZA_INDICADORES.has(e.chave) }))
    .sort((a, b) => a.quandoUtc.localeCompare(b.quandoUtc))
    .filter((e, i, v) => v.findIndex((x) => x.id === e.id) === i);
}

// Eventos "devidos" agora: já saíram (com margem para a fonte atualizar) e ainda estão na janela de espera.
export function devidos(eventos, agora = new Date(), { margemMin = 10, janelaMin = 180 } = {}) {
  return eventos.filter((e) => {
    const depois = (agora.getTime() - Date.parse(e.quandoUtc)) / 60000;
    return depois >= margemMin && depois <= janelaMin;
  });
}

export const proximos = (eventos, agora = new Date(), dias = 14) =>
  eventos.filter((e) => Date.parse(e.quandoUtc) >= agora.getTime() && Date.parse(e.quandoUtc) <= agora.getTime() + dias * 86400_000);

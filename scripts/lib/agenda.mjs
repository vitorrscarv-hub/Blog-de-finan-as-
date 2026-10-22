// O que a edição diária precisa saber sobre o dia: divulgações do IBGE e eventos do Copom. Regras puras, sem rede.
// O IBGE publica o calendário com horário em UTC ("12/11/2026 12:00:00" = 9h em Brasília).

// Divulgações do IBGE acompanhadas, pelo título exato no calendário. `evento: true` vira a matéria obrigatória da manhã.
export const ACOMPANHADAS = {
  ipca: { titulo: 'Índice Nacional de Preços ao Consumidor Amplo', nome: 'IPCA', evento: true },
  'ipca-15': { titulo: 'Índice Nacional de Preços ao Consumidor Amplo 15', nome: 'IPCA-15', evento: false },
  pib: { titulo: 'Contas Nacionais Trimestrais', nome: 'PIB trimestral', evento: false },
  pnad: { titulo: 'Pesquisa Nacional por Amostra de Domicílios Contínua Mensal', nome: 'desemprego (Pnad)', evento: false },
};

const UTC = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
export const paraIsoUtc = (s) => {
  const m = UTC.exec(s ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
};
export const horaBrasilia = (iso) => new Date(Date.parse(iso) - 3 * 3600_000).toISOString().slice(11, 16);
export const diaBrasilia = (iso) => new Date(Date.parse(iso) - 3 * 3600_000).toISOString().slice(0, 10);

export function eventosDoIbge(itens) {
  const porTitulo = new Map(Object.entries(ACOMPANHADAS).map(([chave, a]) => [a.titulo, chave]));
  return itens
    .map((i) => ({ chave: porTitulo.get(i.titulo), quandoUtc: paraIsoUtc(i.data_divulgacao) }))
    .filter((e) => e.chave && e.quandoUtc)
    .map((e) => ({ ...e, ...ACOMPANHADAS[e.chave], dia: diaBrasilia(e.quandoUtc), hora: horaBrasilia(e.quandoUtc) }))
    .sort((a, b) => a.quandoUtc.localeCompare(b.quandoUtc))
    .filter((e, i, v) => v.findIndex((x) => x.chave === e.chave && x.dia === e.dia) === i);
}

// Atas (sitebcb/copom/atas: dataPublicacao) e comunicados de decisão (sitebcb/copom/comunicados: dataReferencia).
export function eventosDoCopom({ atas = [], comunicados = [] }, dia) {
  return [
    ...atas.filter((a) => a.dataPublicacao === dia).map((a) => ({ chave: 'ata-copom', nome: `ata da ${a.nroReuniao}ª reunião do Copom`, turno: 'manha' })),
    ...comunicados.filter((c) => c.dataReferencia === dia).map((c) => ({ chave: 'decisao-copom', nome: `decisão do Copom (${c.nro_reuniao}ª reunião)`, turno: 'noite' })),
  ];
}

// Pauta obrigatória e sugestões do turno. Manhã: IPCA e ata do Copom tomam a vaga de Brasil/Mercado. Noite: a decisão
// do Copom é o fato do dia. As demais divulgações do IBGE do dia viram sugestão.
export function pautaDoTurno({ ibge, copom }, dia, turno) {
  const doDia = ibge.filter((e) => e.dia === dia);
  const obrigatoria = [
    ...(turno === 'manha' ? doDia.filter((e) => e.evento).map((e) => `${e.nome} (IBGE, ${e.hora})`) : []),
    ...copom.filter((e) => e.turno === turno).map((e) => e.nome),
  ];
  const sugestoes = doDia.filter((e) => !e.evento || turno !== 'manha').map((e) => `${e.nome} (IBGE, ${e.hora})`);
  return { obrigatoria, sugestoes };
}

export const proximos = (eventos, agora = new Date(), dias = 14) =>
  eventos.filter((e) => Date.parse(e.quandoUtc) >= agora.getTime() && Date.parse(e.quandoUtc) <= agora.getTime() + dias * 86400_000);

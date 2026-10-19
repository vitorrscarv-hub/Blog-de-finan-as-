// Nome da instituição a partir do endereço da fonte, para a linha "Fontes" abaixo do título.
// Endereço fora da lista aparece pelo domínio (ex.: "exemplo.com").
const INSTITUICOES: [dominio: string, nome: string, caminho?: string][] = [
  ['bcb.gov.br', 'Banco Central'],
  ['cvm.gov.br', 'CVM'],
  ['ibge.gov.br', 'IBGE'],
  ['tesourodireto.com.br', 'Tesouro Direto'],
  ['gov.br', 'Receita Federal', '/receitafederal'],
  ['gov.br', 'CVM', '/cvm'],
  ['gov.br', 'Tesouro Nacional', '/tesouronacional'],
  ['gov.br', 'Ministério da Fazenda', '/fazenda'],
  ['in.gov.br', 'Diário Oficial da União'],
  ['anbima.com.br', 'Anbima'],
  ['b3.com.br', 'B3'],
  ['camara.leg.br', 'Câmara dos Deputados'],
  ['senado.leg.br', 'Senado Federal'],
  ['federalreserve.gov', 'Federal Reserve'],
  ['bls.gov', 'BLS (EUA)'],
  ['bea.gov', 'BEA (EUA)'],
  ['treasury.gov', 'Tesouro dos EUA'],
  ['ecb.europa.eu', 'BCE'],
  ['ec.europa.eu', 'Eurostat', '/eurostat'],
  ['ec.europa.eu', 'Comissão Europeia'],
  ['bankofengland.co.uk', 'Banco da Inglaterra'],
  ['ons.gov.uk', 'ONS (Reino Unido)'],
  ['gov.uk', 'Governo do Reino Unido'],
  ['bundesbank.de', 'Bundesbank'],
  ['destatis.de', 'Destatis (Alemanha)'],
  ['banque-france.fr', 'Banco da França'],
  ['insee.fr', 'Insee (França)'],
  ['bancaditalia.it', 'Banca d\'Italia'],
  ['istat.it', 'Istat (Itália)'],
  ['cbr.ru', 'Banco Central da Rússia'],
  ['kremlin.ru', 'Kremlin'],
  ['whitehouse.gov', 'Casa Branca'],
  ['consilium.europa.eu', 'Conselho da União Europeia'],
  ['eur-lex.europa.eu', 'Jornal Oficial da União Europeia'],
  ['iaea.org', 'AIEA'],
  ['unocha.org', 'OCHA (ONU)'],
  ['boj.or.jp', 'Banco do Japão'],
  ['stats.gov.cn', 'Estatísticas da China (NBS)'],
  ['imf.org', 'FMI'],
  ['worldbank.org', 'Banco Mundial'],
  ['oecd.org', 'OCDE'],
  ['wto.org', 'OMC'],
  ['eia.gov', 'EIA (EUA)'],
  ['iea.org', 'Agência Internacional de Energia'],
  ['opec.org', 'OPEP'],
  ['un.org', 'ONU'],
  ['reuters.com', 'Reuters'],
  ['apnews.com', 'Associated Press'],
  ['afp.com', 'AFP'],
];

const casaDominio = (host: string, dominio: string) => host === dominio || host.endsWith(`.${dominio}`);

export function nomeDaFonte(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  const host = u.hostname.toLowerCase();
  for (const [dominio, nome, caminho] of INSTITUICOES) {
    if (!casaDominio(host, dominio)) continue;
    // gov.br só identifica o órgão pelo caminho; sem caminho conhecido, cai no domínio.
    if (caminho ? u.pathname.startsWith(caminho) : dominio !== 'gov.br') return nome;
  }
  return host.replace(/^www\./, '');
}

// Instituições citadas, na ordem em que aparecem, sem repetir; cada uma com a url da primeira página.
export function instituicoes(fontes: { url: string }[]) {
  const vistas = new Map<string, string>();
  for (const f of fontes) {
    const nome = nomeDaFonte(f.url);
    if (!vistas.has(nome)) vistas.set(nome, f.url);
  }
  return [...vistas].map(([nome, url]) => ({ nome, url }));
}

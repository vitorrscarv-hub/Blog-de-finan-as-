// Registro de pesquisas eleitorais do TSE (dados abertos, cdn.tse.jus.br). Regras puras, para o script e os testes.

// CSV com ";" e campos entre aspas que podem ter quebra de linha (o TSE usa isso nas descrições).
export function lerCsv(texto, sep = ';') {
  const linhas = [];
  let linha = [];
  let campo = '';
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const [cab, ...resto] = linhas;
  return resto.filter((l) => l.length === cab.length).map((l) => Object.fromEntries(cab.map((k, j) => [k, l[j]])));
}

// "BR059082026" -> "BR-05908/2026", o formato em que a divulgação costuma citar o registro.
export const registroFormatado = (p) => (/^([A-Z]{2})(\d{5})(\d{4})$/.exec(p ?? '') ?? []).slice(1).reduce((a, x, i) => (i === 0 ? x : i === 1 ? `${a}-${x}` : `${a}/${x}`), '') || p;

// Pesquisas nacionais para presidente divulgadas entre `de` e `ate` (AAAA-MM-DD), da mais recente para a mais antiga.
export function pesquisasPresidente(linhas, de, ate) {
  return linhas
    .filter((l) => l.SG_UE === 'BR' && /Presidente/.test(l.DS_CARGO ?? ''))
    .map((l) => ({
      registro: registroFormatado(l.NR_PROTOCOLO_REGISTRO),
      instituto: [l.NM_EMPRESA_FANTASIA, l.NM_EMPRESA].find((n) => n && n !== '#NULO#') ?? '',
      campo: `${l.DT_INICIO_PESQUISA.slice(0, 10)} a ${l.DT_FIM_PESQUISA.slice(0, 10)}`,
      divulgacao: l.DT_DIVULGACAO.slice(0, 10),
      entrevistas: Number(l.QT_ENTREVISTADO),
      margem: /margem de erro[^\d]{0,60}(\d+[,.]?\d*)\s*(%|p\.?\s?p|ponto)/i.exec(`${l.DS_PLANO_AMOSTRAL} ${l.DS_METODOLOGIA_PESQUISA}`)?.[1]?.replace('.', ',') ?? null,
    }))
    .filter((p) => p.divulgacao >= de && p.divulgacao <= ate)
    .sort((a, b) => b.divulgacao.localeCompare(a.divulgacao) || b.entrevistas - a.entrevistas);
}

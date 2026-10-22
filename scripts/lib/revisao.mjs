// Revisão automática de um texto (substitui o agente revisor): o que é regra objetiva do manual vira verificação.
// Erro barra a entrega; aviso é para o editor olhar. Regras puras, para o script e os testes.

// Expressões que o manual proíbe (recomendação, promessa, urgência, sensacionalismo, atribuição vaga).
const PROIBIDAS = [
  'vale a pena', 'é hora de', 'aproveite', 'o investidor deve', 'recomendamos', 'imperdível', 'oportunidade única',
  'corra', 'antes que acabe', 'retorno garantido', 'rentabilidade garantida', 'lucro garantido', 'renda certa',
  'sem risco', 'preço-alvo', 'ação barata', 'especialistas apontam', 'dispara', 'disparou', 'derrete', 'derreteu',
  'despenca', 'despencou', 'desaba', 'desabou',
];
// Institutos de pesquisa eleitoral: texto que cita um deles com números precisa trazer o registro no TSE.
const INSTITUTOS = /\b(Datafolha|Quaest|AtlasIntel|Ipec|Paraná Pesquisas|Futura|Ipespe|Real Time Big Data|Nexus|MDA|Vox Populi|Gerp)\b/;
const REGISTRO_TSE = /\bBR-\d{5}\/\d{4}\b/;

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function revisar(texto) {
  const erros = [];
  const avisos = [];
  const [, cabecalho = '', corpo = texto] = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(texto) ?? [];

  if (/[—–]/.test(texto)) erros.push('travessão (— ou –): use vírgula, ponto ou parênteses');
  if (/\p{Extended_Pictographic}/u.test(texto)) erros.push('emoji');
  for (const p of PROIBIDAS) {
    if (new RegExp(`(^|[^\\p{L}])${escapar(p)}([^\\p{L}]|$)`, 'iu').test(corpo)) erros.push(`expressão proibida: "${p}"`);
  }
  const teaser = /^teaser:\s*"(.*)"\s*$/m.exec(cabecalho)?.[1];
  if (teaser !== undefined && !teaser.trim().endsWith('[LINK]')) erros.push('teaser precisa terminar em [LINK]');
  if (!/^fontes:\s*\n\s+- titulo:/m.test(cabecalho)) erros.push('sem fontes: toda matéria precisa de pelo menos uma');
  if (INSTITUTOS.test(corpo) && /\d+\s?%/.test(corpo) && !REGISTRO_TSE.test(corpo)) {
    erros.push('pesquisa eleitoral sem número de registro no TSE (formato BR-00000/AAAA)');
  }

  const palavras = corpo.replace(/[#|*`>-]/g, ' ').split(/\s+/).filter(Boolean).length;
  if (palavras < 450 || palavras > 850) avisos.push(`${palavras} palavras (o manual pede 500 a 800)`);
  if (/^draft:\s*true/m.test(cabecalho)) avisos.push('draft: true (não vai ao ar até alguém conferir)');
  return { erros, avisos, palavras };
}

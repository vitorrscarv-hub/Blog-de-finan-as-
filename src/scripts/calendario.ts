// Calendário de proventos (src/data/calendario.json): validação e formatação.
// A validação roda no build da página /calendario/ e nos testes; dado incompleto derruba o build,
// porque cada linha precisa de data, valor e fonte aberta de verdade.

export interface Fonte {
  titulo: string;
  url: string;
}
export interface ProventoAcao {
  empresa: string;
  ticker: string;
  tipo: 'Dividendo' | 'JCP';
  valorPorAcao: number;
  dataCom: string;
  dataPagamento: string;
  fonte: Fonte;
}
export interface ProventoFii {
  fundo: string;
  ticker: string;
  valorPorCota: number;
  dataBase: string;
  dataPagamento: string;
  fonte: Fonte;
}
export interface Calendario {
  atualizado: string;
  acoes: ProventoAcao[];
  fiis: ProventoFii[];
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const dataValida = (s: unknown): s is string =>
  typeof s === 'string' && ISO.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

const texto = (v: unknown) => typeof v === 'string' && v.trim() !== '';
const numeroPositivo = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;

function fonteValida(f: any): boolean {
  if (!f || !texto(f.titulo) || !texto(f.url)) return false;
  try {
    return new URL(f.url).protocol === 'https:';
  } catch {
    return false;
  }
}

// Devolve a lista de problemas; vazia quando o calendário está certo.
export function validarCalendario(c: any): string[] {
  const erros: string[] = [];
  if (!c || typeof c !== 'object') return ['calendário não é um objeto'];
  if (!dataValida(c.atualizado)) erros.push('"atualizado" precisa ser uma data AAAA-MM-DD');
  for (const [lista, rotulo] of [['acoes', 'ações'], ['fiis', 'fundos imobiliários']] as const) {
    if (!Array.isArray(c[lista])) {
      erros.push(`"${lista}" (${rotulo}) precisa ser uma lista`);
      continue;
    }
    c[lista].forEach((p: any, i: number) => {
      const onde = `${lista}[${i}] ${p?.ticker ?? ''}`.trim();
      const problema = (m: string) => erros.push(`${onde}: ${m}`);
      const acao = lista === 'acoes';
      if (!texto(acao ? p?.empresa : p?.fundo)) problema(acao ? 'falta a empresa' : 'falta o fundo');
      if (!(acao ? /^[A-Z]{4}\d{1,2}$/ : /^[A-Z]{4}1\d$/).test(p?.ticker ?? '')) problema('ticker inválido');
      if (acao && !['Dividendo', 'JCP'].includes(p?.tipo)) problema('tipo deve ser "Dividendo" ou "JCP"');
      if (!numeroPositivo(acao ? p?.valorPorAcao : p?.valorPorCota)) problema('valor precisa ser um número maior que zero');
      const inicio = acao ? p?.dataCom : p?.dataBase;
      if (!dataValida(inicio)) problema(acao ? 'dataCom inválida' : 'dataBase inválida');
      if (!dataValida(p?.dataPagamento)) problema('dataPagamento inválida');
      else if (dataValida(inicio) && p.dataPagamento < inicio) problema('pagamento antes da data com/base');
      if (!fonteValida(p?.fonte)) problema('fonte precisa de título e url https');
    });
  }
  return erros;
}

export function lerCalendario(bruto: unknown): Calendario {
  const erros = validarCalendario(bruto);
  if (erros.length) throw new Error(`src/data/calendario.json inválido:\n- ${erros.join('\n- ')}`);
  return bruto as Calendario;
}

export const porPagamento = <T extends { dataPagamento: string; ticker: string }>(a: T, b: T) =>
  a.dataPagamento.localeCompare(b.dataPagamento) || a.ticker.localeCompare(b.ticker);

export const reais = (n: number) =>
  `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;

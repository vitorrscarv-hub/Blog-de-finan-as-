// Calculadora de PGBL: quanto o aporte reduz o imposto de renda da declaração anual (exercício 2027, ano-calendário 2026).
// Regras da Receita Federal, página "Tributação de 2026" (tabela anual, deduções e tabela de redução anual da
// Lei 15.270/2025): https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
// Limite do PGBL: até 12% dos rendimentos tributáveis, só na declaração completa e para quem contribui para a
// previdência oficial (INSS ou regime próprio). A conta é uma estimativa educativa: não considera 13º salário
// (tributado à parte), rendimentos isentos, livro-caixa, pensão alimentícia nem outras deduções.

export const REGRAS_2026 = {
  ano: 2026,
  // [limite superior da faixa, alíquota, parcela a deduzir], base anual em reais.
  tabela: [
    [29145.6, 0, 0],
    [33919.8, 0.075, 2185.92],
    [45012.6, 0.15, 4729.91],
    [55976.16, 0.225, 8105.85],
    [Infinity, 0.275, 10904.66],
  ] as [number, number, number][],
  dependente: 2275.08,
  instrucaoPorPessoa: 3561.5,
  descontoSimplificado: { taxa: 0.2, limite: 17640 },
  reducao: { isentoAte: 60000, maximaIsento: 2694.15, ate: 88200, a: 8429.73, b: 0.095575 },
  limitePgbl: 0.12,
};

export type Entrada = {
  rendimentos: number; // rendimentos tributáveis do ano, sem o 13º
  inss: number; // contribuição à previdência oficial no ano
  dependentes: number;
  saude: number; // despesas médicas dedutíveis
  educacao: number; // despesas com instrução (somadas)
  pgbl: number; // aporte em PGBL no ano
  retido?: number; // imposto retido na fonte no ano (opcional, para estimar a restituição)
};

const centavos = (v: number) => Math.round(v * 100) / 100;
const positivo = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

// Imposto pela tabela progressiva anual, sobre a base de cálculo.
export function impostoTabela(base: number, r = REGRAS_2026): number {
  const b = positivo(base);
  const [, aliquota, deducao] = r.tabela.find(([teto]) => b <= teto)!;
  return centavos(Math.max(0, b * aliquota - deducao));
}

// Redução anual da Lei 15.270/2025: depende dos rendimentos tributáveis (não da base) e nunca passa do imposto.
export function reducaoAnual(rendimentos: number, imposto: number, r = REGRAS_2026): number {
  const { isentoAte, maximaIsento, ate, a, b } = r.reducao;
  const renda = positivo(rendimentos);
  let reducao = 0;
  if (renda <= isentoAte) reducao = maximaIsento;
  else if (renda < ate) reducao = a - b * renda;
  return centavos(Math.min(Math.max(0, reducao), imposto));
}

export function limitePgbl(e: Entrada, r = REGRAS_2026): number {
  return e.inss > 0 ? centavos(positivo(e.rendimentos) * r.limitePgbl) : 0;
}

function devido(rendimentos: number, base: number, r: typeof REGRAS_2026) {
  const bruto = impostoTabela(base, r);
  return centavos(bruto - reducaoAnual(rendimentos, bruto, r));
}

// Declaração completa: deduz INSS, dependentes, saúde, instrução (com limite por pessoa) e PGBL (até 12%).
export function completa(e: Entrada, aporte = e.pgbl, r = REGRAS_2026) {
  const pessoas = 1 + Math.max(0, Math.floor(e.dependentes || 0));
  const pgbl = Math.min(positivo(aporte), limitePgbl(e, r));
  const deducoes =
    positivo(e.inss) +
    Math.max(0, Math.floor(e.dependentes || 0)) * r.dependente +
    positivo(e.saude) +
    Math.min(positivo(e.educacao), pessoas * r.instrucaoPorPessoa) +
    pgbl;
  const base = Math.max(0, positivo(e.rendimentos) - deducoes);
  return { modelo: 'completa' as const, deducoes: centavos(deducoes), pgblDeduzido: centavos(pgbl), base: centavos(base), imposto: devido(e.rendimentos, base, r) };
}

// Declaração simplificada: desconto de 20% dos rendimentos, com limite; o PGBL não entra.
export function simplificada(e: Entrada, r = REGRAS_2026) {
  const renda = positivo(e.rendimentos);
  const desconto = Math.min(renda * r.descontoSimplificado.taxa, r.descontoSimplificado.limite);
  const base = renda - desconto;
  return { modelo: 'simplificada' as const, deducoes: centavos(desconto), pgblDeduzido: 0, base: centavos(base), imposto: devido(renda, base, r) };
}

const melhor = <T extends { imposto: number }>(a: T, b: T) => (b.imposto < a.imposto ? b : a);

// Compara o imposto do ano com o aporte informado e com o aporte no limite de 12%.
export function calcularPgbl(e: Entrada, r = REGRAS_2026) {
  const limite = limitePgbl(e, r);
  const semPgbl = melhor(simplificada(e, r), completa(e, 0, r));
  const comAporte = melhor(simplificada(e, r), completa(e, e.pgbl, r));
  const noLimite = melhor(simplificada(e, r), completa(e, limite, r));
  const retido = e.retido === undefined || !Number.isFinite(e.retido) ? null : positivo(e.retido);
  return {
    limite,
    falta: centavos(Math.max(0, limite - positivo(e.pgbl))),
    semPgbl,
    comAporte,
    noLimite,
    economiaAporte: centavos(semPgbl.imposto - comAporte.imposto),
    economiaLimite: centavos(semPgbl.imposto - noLimite.imposto),
    // Positivo: restituição; negativo: imposto a pagar.
    saldoNoLimite: retido === null ? null : centavos(retido - noLimite.imposto),
    saldoSemPgbl: retido === null ? null : centavos(retido - semPgbl.imposto),
  };
}

// Valor digitado no formulário -> número. Aceita "120.000,50", "120.000", "120000.50" e "R$ 1.234"; vazio ou inválido -> null.
export function lerValor(texto: string): number | null {
  const s = String(texto ?? '').trim().replace(/\s|R\$/g, '');
  if (!s) return null;
  let normal = s;
  if (s.includes(',')) normal = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) normal = s.replace(/\./g, '');
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

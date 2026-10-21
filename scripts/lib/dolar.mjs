// Monta a nota diária do dólar PTAX a partir dos fechamentos do Banco Central. Sem IA: só números da fonte oficial.
// A nota não explica o movimento (o Banco Central não o explica); isso fica para o texto da pauta, se Vitor quiser.
import { virgula, diaLongo, urlFechamentos } from './oficiais.mjs';

const pct = (atual, base) => ((atual - base) / base) * 100;
const sinal = (p) => (Math.abs(p) < 0.005 ? 'estável' : p > 0 ? 'alta' : 'queda');
const percentual = (p) => `${virgula(Math.abs(p), 2)}%`;
const frase = (p) => (Math.abs(p) < 0.005 ? 'estável' : `${p > 0 ? 'alta' : 'queda'} de ${percentual(p)}`);

// Pontos de comparação que existirem na série. fechamentos vem do mais antigo para o mais novo e termina em `data`.
export function comparacoes(fechamentos, data) {
  const hoje = fechamentos.at(-1);
  if (!hoje || hoje.data !== data) return null;
  const antes = fechamentos.slice(0, -1);
  const ultimoAntesDe = (corte) => antes.filter((f) => f.data < corte).at(-1);
  const itens = [
    ['Fechamento anterior', antes.at(-1)],
    ['Cinco fechamentos antes', antes.length >= 5 ? antes.at(-5) : undefined],
    ['Último fechamento do mês anterior', ultimoAntesDe(`${data.slice(0, 7)}-01`)],
    ['Último fechamento do ano anterior', ultimoAntesDe(`${data.slice(0, 4)}-01-01`)],
  ]
    .filter(([, f]) => f)
    .map(([rotulo, f]) => ({ rotulo, data: f.data, venda: f.venda, variacao: pct(hoje.venda, f.venda) }));
  return { hoje, itens };
}

export function montarNota(fechamentos, data) {
  const c = comparacoes(fechamentos, data);
  if (!c) return null;
  const { hoje, itens } = c;
  const dia = itens[0];
  const valor = `R$ ${virgula(hoje.venda, 4)}`;
  const quando = diaLongo(data);

  const titulo = dia
    ? `Dólar PTAX fecha a ${valor}, ${frase(dia.variacao)} sobre o dia anterior`
    : `Dólar PTAX fecha a ${valor} em ${quando}`;
  const descricao = dia
    ? `A PTAX de venda do Banco Central fechou a ${valor} em ${quando}, ${frase(dia.variacao)} no dia.${itens.length > 1 ? ' Veja a variação na semana, no mês e no ano.' : ''}`
    : `A PTAX de venda do Banco Central fechou a ${valor} em ${quando}.`;

  const linhas = [
    '| Comparação | Fechamento | PTAX de venda | Variação até hoje |',
    '| --- | --- | --- | --- |',
    ...itens.map((i) => `| ${i.rotulo} | ${diaLongo(i.data)} | R$ ${virgula(i.venda, 4)} | ${i.variacao > 0 ? '+' : i.variacao < 0 ? '-' : ''}${percentual(i.variacao)} |`),
  ];

  const abertura = dia
    ? `A PTAX de venda do dólar, apurada pelo Banco Central, fechou em ${valor} em ${quando}. Em relação ao fechamento anterior, em ${diaLongo(dia.data)}, houve ${frase(dia.variacao)}. A taxa de compra ficou em R$ ${virgula(hoje.compra, 4)}.`
    : `A PTAX de venda do dólar, apurada pelo Banco Central, fechou em ${valor} em ${quando}. A taxa de compra ficou em R$ ${virgula(hoje.compra, 4)}.`;

  const corpo = [
    abertura,
    ...(itens.length ? ['## Os números em perspectiva', '', 'A tabela compara o fechamento de hoje com alguns pontos de referência da própria série do Banco Central.', '', ...linhas] : []),
    '',
    '## Como ler a PTAX',
    '',
    'A PTAX de fechamento é a média das quatro taxas que o Banco Central apura ao longo do dia, em janelas de consulta entre 10h e 13h, e é divulgada uma vez por dia útil. Ela serve de referência para contratos e para a contabilidade de operações em dólar. Por isso, não é a cotação do dólar no momento em que você lê: o câmbio segue negociado depois da divulgação e pode estar em outro patamar.',
    '',
    'O Banco Central não informa as causas do movimento do dia, e esta nota também não: ela registra os números publicados. Para a evolução da série completa, a consulta abaixo está aberta no site do próprio Banco Central.',
    '',
  ].join('\n');

  const aspas = (s) => `"${s.replace(/"/g, '\\"')}"`;
  const fonteUrl = urlFechamentos(fechamentos[0].data, data);
  const cabecalho = [
    '---',
    `title: ${aspas(titulo)}`,
    `description: ${aspas(descricao)}`,
    `date: ${data}`,
    'editoria: "Brasil"',
    'keywords: ["dólar", "PTAX", "câmbio", "Banco Central"]',
    `teaser: ${aspas(`${titulo}.${itens.length > 1 ? ' Veja a variação na semana, no mês e no ano.' : ''} [LINK]`)}`,
    'fontes:',
    `  - titulo: ${aspas(`Banco Central: PTAX, cotações de fechamento do dólar (${diaLongo(data)})`)}`,
    `    url: ${aspas(fonteUrl)}`,
    'draft: false',
    'gate: true',
    '---',
    '',
  ].join('\n');

  return { arquivo: `${data}-dolar-ptax-fechamento.md`, titulo, descricao, texto: cabecalho + corpo, sinal: sinal(dia?.variacao ?? 0) };
}

// Candidatos ao calendário de proventos, lidos na API pública da B3 (sistemaswebb3-listados.b3.com.br).
// Uso: node scripts/proventos-b3.mjs [--so=fiis|acoes] [--dias=45]
//   fiis  : fundos do IFIX com rendimento de pagamento de hoje em diante (valor por cota, data-base e data de pagamento).
//   --urls acrescenta a consulta (url https) de cada linha, para citar em `fonte`.
//   acoes : empresas do Ibovespa com dividendo ou JCP aprovado nos últimos --dias (valor, data com e aprovação).
//           A B3 não informa a data de pagamento das ações: ela sai do aviso aos acionistas (RAD).
// Só leitura (GET), pela biblioteca scripts/lib/b3.mjs; se uma consulta falhar, o item aparece como aviso.
// Para atualizar o calendário sem IA, use scripts/atualizar-calendario.mjs (o robô).
// O resultado aponta candidatos: a linha só entra em src/data/calendario.json depois de o valor e as datas
// serem conferidos no documento do administrador ou da companhia.
import { consulta, urlDe, dia, carteira, emLotes } from './lib/b3.mjs';

const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1] ?? p;
const so = arg('so', 'todos');
const dias = Number(arg('dias', 45));
const comUrls = process.argv.includes('--urls');
const hoje = new Date().toISOString().slice(0, 10);
const desde = new Date(Date.now() - dias * 86400_000).toISOString().slice(0, 10);

const valor = (v) => v.replace(/0+$/, '').replace(/,$/, '');

if (so === 'todos' || so === 'fiis') {
  console.log(`## Fundos imobiliários do IFIX: rendimentos com pagamento a partir de ${hoje}`);
  const codigos = new Map(carteira('IFIX').map((c) => [c.slice(0, 4), c]));
  const fundos = [...codigos.keys()];
  const linhas = (await emLotes(fundos, 5, async (f) => {
    const params = { identifierFund: f, typeFund: 7 };
    const d = consulta('fundsProxy/fundsCall/GetListedSupplementFunds', params);
    return (d.cashDividends ?? [])
      .filter((c) => dia(c.paymentDate) >= hoje)
      .map((c) => ({ ticker: codigos.get(f), fundo: d.fund.trim(), url: urlDe('fundsProxy/fundsCall/GetListedSupplementFunds', params), tipo: c.label, valor: c.rate, dataBase: c.lastDatePrior, pagamento: c.paymentDate, referente: c.relatedTo, isin: c.isinCode }));
  })).flat();
  for (const l of linhas.filter((x) => !x.aviso).sort((a, b) => dia(a.pagamento).localeCompare(dia(b.pagamento)))) {
    console.log(`- ${l.ticker} (${l.fundo}) ${l.tipo} R$ ${valor(l.valor)} por cota | data-base ${l.dataBase} | pagamento ${l.pagamento} | ${l.referente}${comUrls ? ` | ${l.url}` : ''}`);
  }
  for (const l of linhas.filter((x) => x.aviso)) console.log(`- AVISO ${l.aviso}`);
  console.log(`(${fundos.length} fundos consultados; o nome do fundo vem abreviado pela B3: o nome completo está no comunicado do administrador)\n`);
}

if (so === 'todos' || so === 'acoes') {
  console.log(`## Ibovespa: dividendos e JCP aprovados desde ${desde} (sem data de pagamento: veja o aviso no RAD)`);
  const emissoras = [...new Set(carteira('IBOV').map((c) => c.slice(0, 4)))];
  const linhas = (await emLotes(emissoras, 5, async (e) => {
    const emp = consulta('listedCompaniesProxy/CompanyCall/GetInitialCompanies', { language: 'pt-br', pageNumber: 1, pageSize: 3, company: e }).results?.[0];
    if (!emp) return [];
    const params = { language: 'pt-br', pageNumber: 1, pageSize: 20, tradingName: emp.tradingName };
    const d = consulta('listedCompaniesProxy/CompanyCall/GetListedCashDividends', params);
    return (d.results ?? [])
      .filter((r) => dia(r.dateApproval) >= desde)
      .map((r) => ({ emissora: e, nome: emp.companyName, classe: r.typeStock, tipo: r.corporateAction, valor: r.valueCash, url: urlDe('listedCompaniesProxy/CompanyCall/GetListedCashDividends', params), dataCom: r.lastDatePriorEx, aprovacao: r.dateApproval }));
  })).flat();
  for (const l of linhas.filter((x) => !x.aviso).sort((a, b) => dia(b.aprovacao).localeCompare(dia(a.aprovacao)))) {
    console.log(`- ${l.emissora} (${l.nome}) ${l.classe} ${l.tipo} R$ ${l.valor} | data com ${l.dataCom} | aprovado em ${l.aprovacao}${comUrls ? ` | ${l.url}` : ''}`);
  }
  for (const l of linhas.filter((x) => x.aviso)) console.log(`- AVISO ${l.aviso}`);
  console.log(`(${emissoras.length} emissoras do Ibovespa consultadas)\n`);
}

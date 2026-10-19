// Candidatos ao calendário de proventos, lidos na API pública da B3 (sistemaswebb3-listados.b3.com.br).
// Uso: node scripts/proventos-b3.mjs [--so=fiis|acoes] [--dias=45]
//   fiis  : fundos do IFIX com rendimento de pagamento de hoje em diante (valor por cota, data-base e data de pagamento).
//   --urls acrescenta a consulta (url https) de cada linha, para citar em `fonte`.
//   acoes : empresas do Ibovespa com dividendo ou JCP aprovado nos últimos --dias (valor, data com e aprovação).
//           A B3 não informa a data de pagamento das ações: ela sai do aviso aos acionistas (RAD).
// Só leitura (GET), com curl (respeita o proxy do ambiente). A B3 recusa o navegador na página inicial desse
// domínio, mas responde às consultas de dados; se uma consulta falhar, o item aparece como aviso.
// O resultado aponta candidatos: a linha só entra em src/data/calendario.json depois de o valor e as datas
// serem conferidos no documento do administrador ou da companhia.
import { execFileSync } from 'node:child_process';

const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1] ?? p;
const so = arg('so', 'todos');
const dias = Number(arg('dias', 45));
const comUrls = process.argv.includes('--urls');
const BASE = 'https://sistemaswebb3-listados.b3.com.br';

const urlDe = (rota, params) => `${BASE}/${rota}/${Buffer.from(JSON.stringify(params)).toString('base64')}`;
const consulta = (rota, params) => {
  const url = urlDe(rota, params);
  const saida = execFileSync('curl', ['-g', '-sS', '-L', '--fail', '--max-time', '30', '-H', 'User-Agent: Mozilla/5.0', '-H', 'Accept: application/json', url], { maxBuffer: 64 * 1024 * 1024 });
  const texto = saida.toString('utf8');
  const json = JSON.parse(texto);
  // A rota de detalhe de fundo devolve o JSON como texto dentro de um texto.
  return typeof json === 'string' ? JSON.parse(json) : json;
};
const dia = (s) => (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(s ?? '') ? `${s.slice(6)}-${s.slice(3, 5)}-${s.slice(0, 2)}` : null);
const hoje = new Date().toISOString().slice(0, 10);
const desde = new Date(Date.now() - dias * 86400_000).toISOString().slice(0, 10);

// Executa em lotes pequenos, para não martelar o servidor.
async function emLotes(itens, n, fn) {
  const saida = [];
  for (let i = 0; i < itens.length; i += n) saida.push(...(await Promise.all(itens.slice(i, i + n).map(async (x) => { try { return await fn(x); } catch (e) { return { aviso: `${x}: ${e.message.split('\n')[0]}` }; } }))));
  return saida;
}
const carteira = (indice) =>
  consulta('indexProxy/indexCall/GetPortfolioDay', { language: 'pt-br', pageNumber: 1, pageSize: 200, index: indice, segment: '1' }).results.map((r) => r.cod);
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

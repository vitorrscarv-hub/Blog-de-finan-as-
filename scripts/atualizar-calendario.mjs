// Robô do calendário de proventos (sem IA): atualiza src/data/calendario.json com os dados da B3.
// Uso: node scripts/atualizar-calendario.mjs [--dias=60] [--seco]
//   --dias : janela de pagamentos, de hoje até hoje + N dias (padrão 60).
//   --seco : mostra o que mudaria, sem gravar o arquivo.
//
// O que faz:
//   1. Tira as linhas com pagamento anterior a hoje (data de Brasília).
//   2. Ações do Ibovespa: dividendos e JCP declarados à B3 (valor bruto por ação, data com e data de pagamento),
//      lidos no cadastro de proventos da companhia na B3. Só entram tickers que estão na carteira do Ibovespa.
//   3. Fundos do IFIX: rendimentos por cota, data-base e data de pagamento, lidos no cadastro do fundo na B3.
//      Fica de fora o pagamento que parece prazo-limite ("até 31/12"); veja prazoLimite.
//   4. Linha que já está no arquivo (por exemplo, conferida no aviso aos acionistas) fica como está; a da B3 só entra
//      se não houver outra com o mesmo ticker, tipo, data de pagamento e valor.
//   5. Valida o resultado com a mesma regra do build (src/scripts/calendario.ts) e grava, com "atualizado" de hoje.
// Linha sem valor, sem uma das datas ou com pagamento fora da janela fica de fora. Se a B3 não responder para um
// emissor, ele aparece como aviso e as linhas que já estavam no arquivo continuam.
import { readFileSync, writeFileSync } from 'node:fs';
import { consulta, urlDe, dia, numero, carteira, emLotes, tickerDoIsin } from './lib/b3.mjs';
import { hojeBrasilia } from './lib/oficiais.mjs';
import { validarCalendario } from '../src/scripts/calendario.ts';

const ARQUIVO = new URL('../src/data/calendario.json', import.meta.url);
const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1] ?? p;
const dias = Number(arg('dias', 60));
const seco = process.argv.includes('--seco');

const hoje = hojeBrasilia();
const limite = new Date(Date.parse(`${hoje}T00:00:00Z`) + dias * 86400_000).toISOString().slice(0, 10);
const dataBR = hoje.split('-').reverse().join('/');
const naJanela = (d) => d && d >= hoje && d <= limite;
const TIPOS = { DIVIDENDO: 'Dividendo', 'JRS CAP PROPRIO': 'JCP' };

// Nome das empresas do Ibovespa (o nome de pregão da B3 vem abreviado e em maiúsculas, como "ITAUUNIBANCO").
const EMPRESAS = {
  ALOS: 'Allos', ABEV: 'Ambev', ASAI: 'Assaí', AURE: 'Auren', AXIA: 'Axia Energia', AZZA: 'Azzas 2154', B3SA: 'B3',
  BBSE: 'BB Seguridade', BBDC: 'Bradesco', BRAP: 'Bradespar', BBAS: 'Banco do Brasil', BRAV: 'Brava Energia',
  BPAC: 'BTG Pactual', CXSE: 'Caixa Seguridade', CEAB: 'C&A', CMIG: 'Cemig', COGN: 'Cogna', CSMG: 'Copasa', CPLE: 'Copel',
  CSAN: 'Cosan', CPFE: 'CPFL Energia', CMIN: 'CSN Mineração', CURY: 'Cury', CYRE: 'Cyrela', DIRR: 'Direcional',
  EMBJ: 'Embraer', ENGI: 'Energisa', ENEV: 'Eneva', EGIE: 'Engie Brasil', EQTL: 'Equatorial', FLRY: 'Fleury',
  GGBR: 'Gerdau', GOAU: 'Metalúrgica Gerdau', HAPV: 'Hapvida', HYPE: 'Hypera', IGTI: 'Iguatemi', ISAE: 'ISA Energia',
  ITSA: 'Itaúsa', ITUB: 'Itaú Unibanco', KLBN: 'Klabin', RENT: 'Localiza', LREN: 'Lojas Renner', MGLU: 'Magazine Luiza',
  POMO: 'Marcopolo', MBRF: 'MBRF', BEEF: 'Minerva', MOTV: 'Motiva', MRVE: 'MRV', MULT: 'Multiplan', NATU: 'Natura',
  PETR: 'Petrobras', PSSA: 'Porto Seguro', PRIO: 'Prio', RADL: 'Raia Drogasil', RDOR: "Rede D'Or", RAIL: 'Rumo',
  SBSP: 'Sabesp', SANB: 'Santander Brasil', CSNA: 'CSN', SMFT: 'Smart Fit', SUZB: 'Suzano', TAEE: 'Taesa',
  VIVT: 'Telefônica Brasil', TEND: 'Tenda', TIMS: 'TIM', TOTS: 'Totvs', UGPA: 'Ultrapar', USIM: 'Usiminas', VALE: 'Vale',
  VAMO: 'Vamos', VBBR: 'Vibra', VIVA: 'Vivara', WEGE: 'WEG', YDUQ: 'Yduqs',
};
// Sem nome na lista: o nome de pregão com só a primeira letra de cada palavra em maiúscula.
const nomeLegivel = (s) => s.trim().toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

// Muitas companhias declaram "pagamento até 31/12" e a B3 registra esse prazo-limite como data. O manual deixa de
// fora o "até [data]": a linha não entra quando o pagamento cai em 30 ou 31 de dezembro ou mais de 8 meses depois
// da data com. Ela aparece no resumo, para ser conferida no aviso aos acionistas.
const prazoLimite = (dataCom, pagamento) =>
  /-12-3[01]$/.test(pagamento) || Date.parse(pagamento) - Date.parse(dataCom) > 240 * 86400_000;
const foraPorPrazo = [];

const atual = JSON.parse(readFileSync(ARQUIVO, 'utf8'));
const nomes = new Map([...atual.acoes.map((p) => [p.ticker, p.empresa]), ...atual.fiis.map((p) => [p.ticker, p.fundo])]);
const avisos = [];

// 2. Ações
const ibov = new Set(carteira('IBOV'));
const emissoras = [...new Set([...ibov].map((c) => c.slice(0, 4)))];
const acoesB3 = (
  await emLotes(emissoras, 3, async (e) => {
    const params = { issuingCompany: e, language: 'pt-br' };
    const d = consulta('listedCompaniesProxy/CompanyCall/GetListedSupplementCompany', params);
    const emp = Array.isArray(d) ? d[0] : d;
    const url = urlDe('listedCompaniesProxy/CompanyCall/GetListedSupplementCompany', params);
    return (emp?.cashDividends ?? []).flatMap((c) => {
      const ticker = tickerDoIsin(c.isinCode);
      const tipo = TIPOS[c.label];
      const pagamento = dia(c.paymentDate);
      const dataCom = dia(c.lastDatePrior);
      const valor = numero(c.rate);
      if (!ticker || !ibov.has(ticker) || !tipo || !naJanela(pagamento) || !dataCom || !(valor > 0)) return [];
      if (prazoLimite(dataCom, pagamento)) {
        foraPorPrazo.push(`${ticker} ${tipo} R$ ${valor} (data com ${dataCom}, pagamento ${pagamento})`);
        return [];
      }
      return [{
        empresa: nomes.get(ticker) ?? EMPRESAS[e] ?? nomeLegivel(emp.tradingName),
        ticker,
        tipo,
        valorPorAcao: valor,
        dataCom,
        dataPagamento: pagamento,
        fonte: { titulo: `B3: proventos em dinheiro de ${emp.tradingName.trim()} (${e}), consulta ao cadastro da companhia em ${dataBR}`, url },
      }];
    });
  })
).flat();

// 3. Fundos imobiliários
const ifix = new Map(carteira('IFIX').map((c) => [c.slice(0, 4), c]));
const fiisB3 = (
  await emLotes([...ifix.keys()], 3, async (f) => {
    const params = { identifierFund: f, typeFund: 7 };
    const d = consulta('fundsProxy/fundsCall/GetListedSupplementFunds', params);
    const url = urlDe('fundsProxy/fundsCall/GetListedSupplementFunds', params);
    const ticker = ifix.get(f);
    return (d.cashDividends ?? []).flatMap((c) => {
      const pagamento = dia(c.paymentDate);
      const dataBase = dia(c.lastDatePrior);
      const valor = numero(c.rate);
      if (c.label !== 'RENDIMENTO' || !naJanela(pagamento) || !dataBase || !(valor > 0)) return [];
      return [{
        fundo: nomes.get(ticker) ?? d.fund.trim(),
        ticker,
        valorPorCota: valor,
        dataBase,
        dataPagamento: pagamento,
        fonte: { titulo: `B3: rendimentos do fundo ${f}, consulta ao cadastro do fundo em ${dataBR}`, url },
      }];
    });
  })
).flat();

for (const l of [...acoesB3, ...fiisB3]) if (l.aviso) avisos.push(l.aviso);

// 1 e 4. Junta: mantém o que já estava (e ainda vai ser pago), acrescenta o que é novo.
const chave = (p) => [p.ticker, p.tipo ?? 'Rendimento', p.dataPagamento, (p.valorPorAcao ?? p.valorPorCota).toFixed(8)].join('|');
const ordem = (a, b) => a.dataPagamento.localeCompare(b.dataPagamento) || a.ticker.localeCompare(b.ticker);
function juntar(antigas, novas) {
  const ficam = antigas.filter((p) => p.dataPagamento >= hoje);
  const vistas = new Set(ficam.map(chave));
  const entram = novas.filter((p) => !p.aviso && !vistas.has(chave(p)) && vistas.add(chave(p)));
  return { lista: [...ficam, ...entram].sort(ordem), saem: antigas.length - ficam.length, entram: entram.length };
}
const acoes = juntar(atual.acoes, acoesB3);
const fiis = juntar(atual.fiis, fiisB3);
const novo = { atualizado: hoje, acoes: acoes.lista, fiis: fiis.lista };

// 5. Valida e grava.
const erros = validarCalendario(novo);
if (erros.length) {
  console.error(`Calendário inválido, nada foi gravado:\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
console.log(`Calendário de ${hoje} (pagamentos até ${limite})`);
console.log(`- ações: ${acoes.entram} novas, ${acoes.saem} pagas e retiradas, ${acoes.lista.length} no total`);
console.log(`- fundos: ${fiis.entram} novos, ${fiis.saem} pagos e retirados, ${fiis.lista.length} no total`);
for (const f of foraPorPrazo) console.log(`- FORA (possível prazo-limite "até", conferir no aviso) ${f}`);
for (const a of avisos) console.log(`- AVISO ${a}`);
if (seco) console.log('(--seco: arquivo não gravado)');
else writeFileSync(ARQUIVO, `${JSON.stringify(novo, null, 2)}\n`);

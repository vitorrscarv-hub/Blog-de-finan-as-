// Agenda de divulgações: diz o que rodar e quando, sem gastar IA.
//   node scripts/agenda.mjs --atualizar     busca o calendário do IBGE (60 dias) e grava src/data/agenda.json
//   node scripts/agenda.mjs --agora         lista as divulgações que saíram há pouco (devidas); grava devido=true|false em $GITHUB_OUTPUT
//   node scripts/agenda.mjs --proximos[=14] lista o que vem nos próximos dias, com horário de Brasília
// O Copom não tem API de calendário: a decisão é detectada por mudança (scripts/indicadores.mjs --so=selic), nas quartas à noite.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { baixarJson } from './lib/oficiais.mjs';
import { eventosDoIbge, devidos, proximos } from './lib/agenda.mjs';

const ARQUIVO = new URL('../src/data/agenda.json', import.meta.url);
const modo = process.argv.find((a) => ['--atualizar', '--agora'].includes(a) || a.startsWith('--proximos'));
const brasilia = (iso) => new Date(Date.parse(iso) - 3 * 3600_000).toISOString().replace('T', ' ').slice(0, 16);
const ler = () => JSON.parse(readFileSync(ARQUIVO, 'utf8'));

if (modo === '--atualizar') {
  const mdY = (d) => `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`;
  const hoje = new Date();
  const url = `https://servicodados.ibge.gov.br/api/v3/calendario/?de=${mdY(hoje)}&ate=${mdY(new Date(hoje.getTime() + 62 * 86400_000))}&qtd=500`;
  const itens = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const r = baixarJson(`${url}&page=${pagina}`);
    itens.push(...r.items);
    if (pagina >= r.totalPages) break;
  }
  const eventos = eventosDoIbge(itens).filter((e) => Date.parse(e.quandoUtc) >= hoje.getTime() - 86400_000);
  const novo = { _comentario: 'Gerado por scripts/agenda.mjs --atualizar a partir do calendário do IBGE. Horários em UTC. Não edite à mão.', eventos };
  const igual = JSON.stringify(ler().eventos) === JSON.stringify(eventos);
  if (!igual) writeFileSync(ARQUIVO, JSON.stringify(novo, null, 2) + '\n');
  console.log(igual ? `agenda sem mudança (${eventos.length} eventos)` : `agenda atualizada: ${eventos.length} eventos`);
} else if (modo === '--agora') {
  const lista = devidos(ler().eventos);
  const saida = process.env.GITHUB_OUTPUT;
  if (saida) appendFileSync(saida, `devido=${lista.length > 0}\nresumo=${lista.map((e) => e.titulo).join('; ')}\n`);
  console.log(lista.length ? lista.map((e) => `${brasilia(e.quandoUtc)} ${e.titulo}`).join('\n') : 'nada devido agora');
} else if (modo?.startsWith('--proximos')) {
  const dias = Number(modo.split('=')[1]) || 14;
  for (const e of proximos(ler().eventos, new Date(), dias)) console.log(`${brasilia(e.quandoUtc)} (Brasília) ${e.titulo}`);
} else {
  console.error('use --atualizar, --agora ou --proximos[=dias]');
  process.exit(1);
}

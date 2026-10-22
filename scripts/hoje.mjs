// O que a edição diária tem de cobrir hoje, sem IA: IPCA e outras divulgações do IBGE, ata e decisão do Copom.
// Uso: node scripts/hoje.mjs [--turno=manha|noite] [--data=AAAA-MM-DD]
//      node scripts/hoje.mjs --proximos[=14]   divulgações do IBGE dos próximos dias (horário de Brasília)
// O Copom não tem calendário em API: a ata e a decisão são reconhecidas no dia em que o Banco Central as publica.
import { baixarJson, hojeBrasilia } from './lib/oficiais.mjs';
import { eventosDoIbge, eventosDoCopom, pautaDoTurno, proximos } from './lib/agenda.mjs';

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}`)) ?? '').split('=')[1];
const dia = arg('data') ?? hojeBrasilia();
const horaBr = new Date(Date.now() - 3 * 3600_000).getUTCHours();
const turno = arg('turno') ?? (horaBr < 15 ? 'manha' : 'noite');
const avisos = [];
const tentar = (nome, fn, padrao) => {
  try {
    return fn();
  } catch (e) {
    avisos.push(`${nome} não abriu (${e.message.split('\n')[0]})`);
    return padrao;
  }
};

const mes = (iso) => `${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
const fim = new Date(Date.parse(dia) + 31 * 86400_000).toISOString().slice(0, 10);
const ibge = tentar('calendário do IBGE', () => eventosDoIbge(baixarJson(`https://servicodados.ibge.gov.br/api/v3/calendario/?de=${mes(dia)}&ate=${mes(fim)}&qtd=500`).items), []);

if (process.argv.some((a) => a.startsWith('--proximos'))) {
  for (const e of proximos(ibge, new Date(), Number(arg('proximos')) || 14)) console.log(`${e.dia} ${e.hora} ${e.nome}${e.evento ? ' (matéria obrigatória)' : ''}`);
} else {
  const copom = eventosDoCopom(
    {
      atas: tentar('atas do Copom', () => baixarJson('https://www.bcb.gov.br/api/servico/sitebcb/copom/atas?quantidade=2').conteudo, []),
      comunicados: tentar('comunicados do Copom', () => baixarJson('https://www.bcb.gov.br/api/servico/sitebcb/copom/comunicados?quantidade=2').conteudo, []),
    },
    dia
  );
  const { obrigatoria, sugestoes } = pautaDoTurno({ ibge, copom }, dia, turno);
  console.log(`${dia}, turno ${turno}`);
  console.log(obrigatoria.length ? `obrigatória: ${obrigatoria.join('; ')}` : 'obrigatória: nenhuma');
  if (sugestoes.length) console.log(`sugestão: ${sugestoes.join('; ')}`);
}
for (const a of avisos) console.log(`aviso: ${a}`);

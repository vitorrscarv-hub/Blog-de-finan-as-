// Radar da edição diária: lista, numa página só, o que os jornais e as fontes oficiais publicaram nas últimas horas.
// Uso: node scripts/radar.mjs [--horas=14] [--so=jornais|oficiais] [--max=12]
// Só leitura (GET). Cada fonte que falha aparece como aviso, sem derrubar as outras.
// O radar só aponta: o editor escolhe; fato de jornal entra atribuído, e número de economia é lido na fonte primária.
// Substitui o antigo agente pauteiro: escolher manchete numa lista custa uma fração dos tokens de pesquisar na web.
import { execFileSync } from 'node:child_process';
import { decodificar, lerRss } from './lib/rss.mjs';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1];
const horas = Number(arg('horas')) || 14;
const so = arg('so');
const max = Number(arg('max')) || 12;
const corte = Date.now() - horas * 3600_000;

// curl respeita o proxy do ambiente (o fetch do Node não).
const baixar = async (url, tipo = 'text') => {
  const saida = execFileSync('curl', ['-g', '-sS', '-L', '--fail', '--max-time', '60', '-H', 'User-Agent: Mozilla/5.0', url], {
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return tipo === 'buffer' ? saida : tipo === 'json' ? JSON.parse(saida.toString('utf8')) : saida.toString('utf8');
};

// "19/10/2026 09:00:00" (horário de Brasília) para milissegundos.
const dataBR = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(s ?? '');
  return m ? Date.parse(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}-03:00`) : NaN;
};

// Jornais de grande circulação (pauta e fatos políticos atribuídos). Os três últimos dependem de liberar o domínio
// na rede do ambiente; até lá aparecem como aviso.
const JORNAIS = [
  ['Valor Econômico', 'https://valor.globo.com/rss/valor'],
  ['Folha: Mercado', 'https://feeds.folha.uol.com.br/mercado/rss091.xml'],
  ['Folha: Poder', 'https://feeds.folha.uol.com.br/poder/rss091.xml'],
  ['Estadão: Economia', 'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/economia/'],
  ['Estadão: Política', 'https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/politica/'],
  ['G1: Economia', 'https://g1.globo.com/rss/g1/economia/'],
  ['G1: Política', 'https://g1.globo.com/rss/g1/politica/'],
  ['Money Times', 'https://www.moneytimes.com.br/feed/'],
  ['InfoMoney', 'https://www.infomoney.com.br/feed/'],
  ['Poder360', 'https://www.poder360.com.br/feed/'],
];
const hhmm = (ms) => new Date(ms - 3 * 3600_000).toISOString().slice(11, 16);
const jornais = JORNAIS.map(([nome, url]) => [`Jornal: ${nome}`, async () =>
  lerRss(decodificar(await baixar(url, 'buffer')))
    .filter((i) => i.data >= corte)
    .map((i) => `${hhmm(i.data)} ${i.titulo} ${i.link}`),
]);

const oficiais = [
  ['Banco Central: Copom (última ata e último comunicado)', async () => {
    const ata = (await baixar('https://www.bcb.gov.br/api/servico/sitebcb/copom/atas?quantidade=1', 'json')).conteudo[0];
    const com = (await baixar('https://www.bcb.gov.br/api/servico/sitebcb/copom/comunicados?quantidade=1', 'json')).conteudo[0];
    return [`ata da ${ata.nroReuniao}ª reunião publicada em ${ata.dataPublicacao}`, `comunicado de ${com.dataReferencia}: ${com.titulo}`];
  }],
  ['Banco Central: Selic', async () => {
    const j = await baixar('https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros', 'json');
    const a = j.conteudo[0];
    return [`Meta Selic vigente ${a.MetaSelic}% desde ${String(a.DataInicioVigencia).slice(0, 10)} (reunião ${a.NumeroReuniaoCopom} do Copom)`];
  }],
  ['IBGE: notícias', async () => {
    const j = await baixar('https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=30', 'json');
    return j.items
      .filter((i) => dataBR(i.data_publicacao) >= corte)
      .map((i) => `${i.data_publicacao} ${i.titulo} ${i.link}`);
  }],
  ['Federal Reserve: comunicados', async () => {
    const x = await baixar('https://www.federalreserve.gov/feeds/press_all.xml');
    return [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((m) => ({
        titulo: /<title>([\s\S]*?)<\/title>/.exec(m[1])?.[1].trim(),
        link: /<link><!\[CDATA\[(.*?)\]\]><\/link>/.exec(m[1])?.[1],
        data: Date.parse(/<pubDate>(.*?)<\/pubDate>/.exec(m[1])?.[1] ?? ''),
      }))
      .filter((i) => i.data >= corte)
      .map((i) => `${new Date(i.data).toISOString().slice(0, 16)}Z ${i.titulo} ${i.link}`);
  }],
  ['CVM: fatos relevantes e comunicados', async () => {
    const ano = new Date().getUTCFullYear();
    const dir = mkdtempSync(join(tmpdir(), 'radar-'));
    try {
      const zip = join(dir, 'ipe.zip');
      writeFileSync(zip, await baixar(`https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_${ano}.zip`, 'buffer'));
      const csv = new TextDecoder('latin1').decode(execFileSync('unzip', ['-p', zip], { maxBuffer: 256 * 1024 * 1024 }));
      const desde = new Date(corte).toISOString().slice(0, 10);
      return csv.split('\n').slice(1)
        .map((l) => l.split(';'))
        .filter((c) => c[4] === 'Fato Relevante' && c[8] >= desde)
        .map((c) => `${c[8]} ${c[1]} | ${c[7]} ${c[12]?.trim()}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }],
];

const fontes = [...(so === 'oficiais' ? [] : jornais), ...(so === 'jornais' ? [] : oficiais)];

console.log(`Radar das últimas ${horas} horas (${new Date().toISOString().slice(0, 16)}Z)\n`);
for (const [nome, ler] of fontes) {
  try {
    const itens = await ler();
    console.log(`## ${nome} (${itens.length})`);
    for (const i of itens.slice(0, max)) console.log(`- ${i}`);
  } catch (e) {
    console.log(`## ${nome}\n- AVISO: não abriu (${(e.stderr?.toString().trim() || e.message).split('\n').pop()})`);
  }
  console.log();
}

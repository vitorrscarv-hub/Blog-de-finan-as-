// Pesquisas para presidente registradas no TSE e divulgadas nos últimos dias (dados abertos oficiais, sem IA).
// Uso: node scripts/pesquisas-tse.mjs [--dias=7] [--ano=2026] [--max=40]
// Serve para conferir registro, instituto, período de campo, data de divulgação e entrevistas. O resultado (os
// percentuais) e o contratante vêm do relatório do instituto ou da matéria do veículo que contratou; a margem de erro,
// quando o registro não a traz, também. O site do TSE (tse.jus.br, PesqEle) recusa robôs; os dados abertos não.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lerCsv, pesquisasPresidente } from './lib/tse.mjs';
import { hojeBrasilia } from './lib/oficiais.mjs';

const arg = (n, p) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1] ?? p;
const ano = arg('ano', hojeBrasilia().slice(0, 4));
const dias = Number(arg('dias', 7));
const max = Number(arg('max', 40));
const ate = hojeBrasilia();
const de = new Date(Date.parse(ate) - dias * 86400_000).toISOString().slice(0, 10);
const url = `https://cdn.tse.jus.br/estatistica/sead/odsele/pesquisa_eleitoral/pesquisa_eleitoral_${ano}.zip`;

const dir = mkdtempSync(join(tmpdir(), 'tse-'));
let csv;
try {
  const zip = join(dir, 'pesquisas.zip');
  execFileSync('curl', ['-sS', '-L', '--fail', '--max-time', '180', '-H', 'User-Agent: Mozilla/5.0', '-o', zip, url]);
  csv = execFileSync('unzip', ['-p', zip, `pesquisa_eleitoral_${ano}_BRASIL.csv`], { maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const lista = pesquisasPresidente(lerCsv(csv), de, ate);

console.log(`Pesquisas para presidente registradas no TSE, divulgadas de ${de} a ${ate}: ${lista.length}`);
console.log(`Fonte: ${url}\n`);
console.log('registro | instituto | campo | divulgação | entrevistas | margem (se no registro)');
for (const p of lista.slice(0, max)) console.log(`${p.registro} | ${p.instituto} | ${p.campo} | ${p.divulgacao} | ${p.entrevistas} | ${p.margem ? `${p.margem} p.p.` : '-'}`);

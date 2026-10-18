// Exporta os cadastros do banco D1 publicado para um CSV que abre direto no Excel.
// Uso: npm run cf:exportar            (gera leads-AAAA-MM-DD.csv na pasta do projeto)
//      npm run cf:exportar -- --local (lê o banco local, para testar)
// Requer "npx wrangler login" feito antes. O CSV tem dados pessoais: não envie para o repositório.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const local = process.argv.includes('--local');
const sql =
  'SELECT nome, email, whatsapp, pagina, origem, consentimento_em, criado_em, atualizado_em FROM leads ORDER BY criado_em DESC';
const args = ['wrangler', 'd1', 'execute', 'blog-leads', local ? '--local' : '--remote', '--json', '--command', sql];
if (local) args.push('--env', 'local');

const saida = execFileSync('npx', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const linhas = JSON.parse(saida)[0]?.results ?? [];

const colunas = ['nome', 'email', 'whatsapp', 'pagina', 'origem', 'consentimento_em', 'criado_em', 'atualizado_em'];
const celula = (v) => {
  const texto = String(v ?? '');
  // Evita que o Excel interprete o conteúdo como fórmula.
  const seguro = /^[=+\-@]/.test(texto) && !/^\+\d+$/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
};
const csv = [colunas.join(';'), ...linhas.map((l) => colunas.map((c) => celula(l[c])).join(';'))].join('\r\n');

const arquivo = `leads-${new Date().toISOString().slice(0, 10)}${local ? '-local' : ''}.csv`;
writeFileSync(arquivo, '﻿' + csv + '\r\n');
console.log(`${linhas.length} cadastro(s) exportado(s) para ${arquivo}`);

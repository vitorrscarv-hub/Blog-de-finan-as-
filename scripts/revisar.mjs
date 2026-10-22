// Revisão automática dos textos novos ou alterados em relação ao main (ou dos arquivos passados como argumento).
// Uso: node scripts/revisar.mjs [arquivo.md ...]
// Sai com código 1 se houver erro. Não muda nada: quem corrige é o editor.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { revisar } from './lib/revisao.mjs';

const pedidos = process.argv.slice(2);
const arquivos = pedidos.length
  ? pedidos
  : execFileSync('git', ['diff', '--name-only', 'origin/main', '--', 'src/content'], { encoding: 'utf8' })
      .split('\n')
      .filter((f) => f.endsWith('.md') && existsSync(f));

let falhou = false;
for (const f of arquivos) {
  const { erros, avisos, palavras } = revisar(readFileSync(f, 'utf8'));
  console.log(`${erros.length ? 'ERRO' : 'ok'}  ${f} (${palavras} palavras)`);
  for (const e of erros) console.log(`  erro: ${e}`);
  for (const a of avisos) console.log(`  aviso: ${a}`);
  falhou ||= erros.length > 0;
}
if (!arquivos.length) console.log('nenhum texto novo ou alterado');
process.exit(falhou ? 1 : 0);

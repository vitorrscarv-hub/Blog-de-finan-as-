// Nota diária do dólar PTAX, gerada logo depois da divulgação do fechamento (por volta das 13h10, horário de Brasília).
// Uso: node scripts/dolar-diario.mjs [--data=AAAA-MM-DD] [--dry]
// Sem PTAX de fechamento na data (fim de semana, feriado ou ainda não divulgada), não faz nada e sai com código 0.
// Se a nota do dia já existe, também não faz nada: pode rodar mais de uma vez no dia sem duplicar.
import { existsSync, writeFileSync } from 'node:fs';
import { baixarJson, hojeBrasilia, lerFechamentos, urlFechamentos } from './lib/oficiais.mjs';
import { montarNota } from './lib/dolar.mjs';

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1];
const data = arg('data') ?? hojeBrasilia();
if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('use --data=AAAA-MM-DD');

// Do último dia útil do ano anterior (margem de 12 dias) até a data pedida.
const inicio = `${Number(data.slice(0, 4)) - 1}-12-18`;
const fechamentos = lerFechamentos(baixarJson(urlFechamentos(inicio, data)));
const nota = montarNota(fechamentos, data);

if (!nota) {
  console.log(`sem PTAX de fechamento em ${data}: nada a publicar`);
  process.exit(0);
}
const caminho = new URL(`../src/content/noticias/${nota.arquivo}`, import.meta.url);
if (existsSync(caminho)) {
  console.log(`já existe: ${nota.arquivo}`);
  process.exit(0);
}
if (process.argv.includes('--dry')) {
  console.log(nota.texto);
  process.exit(0);
}
writeFileSync(caminho, nota.texto);
console.log(`criado: src/content/noticias/${nota.arquivo}\n${nota.titulo}`);

// Lê páginas públicas com um navegador de verdade (Chromium) e imprime o texto.
// Existe porque a redação roda em um ambiente em que o WebFetch não resolve endereços e
// porque várias fontes oficiais (como o site do Banco Central) só montam o conteúdo com JavaScript.
//
// Uso: node scripts/ler-pagina.mjs <url> [<url> ...] [--max=12000] [--espera=3000]
//   --max     máximo de caracteres impressos por página (padrão 12000)
//   --espera  milissegundos extras para o JavaScript terminar de montar a página (padrão 3000)
//
// Respeita os bloqueios dos sites: se a resposta for 401 ou 403 (acesso negado a robôs), o script
// avisa e não tenta contornar. Para esses casos, use a API oficial da fonte (veja o manual de redação).
// Para dados em JSON (APIs), prefira "curl" com um cabeçalho User-Agent; este script serve para páginas.
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => Number((args.find((a) => a.startsWith(`--${nome}=`)) ?? '').split('=')[1]) || padrao;
const max = opcao('max', 12000);
const espera = opcao('espera', 3000);
const urls = args.filter((a) => /^https?:\/\//.test(a));
if (urls.length === 0) {
  console.error('Uso: node scripts/ler-pagina.mjs <url> [<url> ...] [--max=12000] [--espera=3000]');
  process.exit(2);
}

const local = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const navegador = await chromium.launch({
  executablePath: existsSync(local) ? local : undefined,
  proxy: proxy ? { server: proxy } : undefined,
});
const contexto = await navegador.newContext({ locale: 'pt-BR' });
let falhas = 0;

for (const url of urls) {
  const pagina = await contexto.newPage();
  try {
    const resposta = await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await pagina.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await pagina.waitForTimeout(espera);
    const status = resposta?.status() ?? 0;
    const texto = (await pagina.innerText('body').catch(() => '')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    console.log(`=== ${url}\n=== HTTP ${status} | título: ${await pagina.title()} | ${texto.length} caracteres`);
    if (status === 401 || status === 403) {
      console.log('=== ACESSO NEGADO PELO SITE. Não tente contornar: use a API oficial ou marque o dado como sem conferência.');
      falhas++;
    } else {
      console.log(texto.slice(0, max) + (texto.length > max ? `\n[... cortado em ${max} caracteres; use --max=N para ver mais]` : ''));
    }
  } catch (erro) {
    console.log(`=== ${url}\n=== ERRO: ${String(erro).split('\n')[0]}`);
    falhas++;
  }
  await pagina.close();
  console.log();
}
await navegador.close();
process.exit(falhas === urls.length ? 1 : 0);

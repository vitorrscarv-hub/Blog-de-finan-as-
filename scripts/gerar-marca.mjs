// Gera os arquivos de marca a partir do símbolo em src/scripts/marca.ts:
// public/favicon.svg, public/apple-touch-icon.png e public/og-padrao.png.
// Uso: node scripts/gerar-marca.mjs   (precisa do Chromium do Playwright: npx playwright install chromium)
import { writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { simboloSvg, geometria } from '../src/scripts/marca.ts';

const MARINHO = '#131c2b';
const DOURADO = '#d4b46a';
const { proporcao } = geometria();

// Favicon: símbolo centralizado num quadrado marinho, com traços mais grossos para ler em 16 a 32 px.
const ladoIcone = 64;
const largSimbolo = 54;
const altSimbolo = largSimbolo / proporcao;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ladoIcone} ${ladoIcone}"><rect width="${ladoIcone}" height="${ladoIcone}" rx="12" fill="${MARINHO}"/>${simboloSvg({ cor: DOURADO, peso: 2 }).replace(
  '<svg ',
  `<svg x="${(ladoIcone - largSimbolo) / 2}" y="${((ladoIcone - altSimbolo) / 2).toFixed(1)}" width="${largSimbolo}" height="${altSimbolo.toFixed(1)}" `
)}</svg>\n`;
writeFileSync('public/favicon.svg', favicon);

const archivo = new URL('../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2', import.meta.url);
const executablePath = !process.env.CI && existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const navegador = await chromium.launch({ executablePath });
const pagina = await navegador.newPage();

// Ícone da tela inicial do iPhone (o iOS arredonda os cantos sozinho).
await pagina.setViewportSize({ width: 180, height: 180 });
await pagina.setContent(`<body style="margin:0">${favicon.replace('rx="12"', 'rx="0"').replace('<svg ', '<svg width="180" height="180" ')}</body>`);
await pagina.screenshot({ path: 'public/apple-touch-icon.png' });

// Imagem de compartilhamento (1200x630), no formato do cartão da marca.
await pagina.setViewportSize({ width: 1200, height: 630 });
// A página vai para um arquivo temporário: só assim o navegador aceita carregar a fonte local.
const html = join(mkdtempSync(join(tmpdir(), 'grafous-')), 'og.html');
writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(${archivo.href}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
body{margin:0;width:1200px;height:630px;background:${MARINHO};color:#fff;font-family:A;display:flex;flex-direction:column;align-items:center;justify-content:center}
.marca{display:flex;align-items:center;gap:48px}
.nome{font-size:128px;font-weight:800;letter-spacing:.03em}
hr{width:1000px;border:0;border-top:2px solid #4a5568;margin:52px 0 42px}
.slogan{font-size:52px;font-weight:600}
.ed{margin-top:22px;font-size:34px;letter-spacing:.06em;color:${DOURADO}}
</style></head><body>
<div class="marca">${simboloSvg({ cor: DOURADO, largura: 290, peso: 1.5 })}<span class="nome">GRAFOUS</span></div>
<hr><div class="slogan">A informação que conecta os fatos.</div><div class="ed">ECONOMIA · POLÍTICA · MUNDO</div>
</body></html>`);
await pagina.goto(pathToFileURL(html).href);
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: 'public/og-padrao.png' });
await navegador.close();
console.log('Gerados: public/favicon.svg, public/apple-touch-icon.png, public/og-padrao.png');

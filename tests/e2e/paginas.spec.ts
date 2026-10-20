import { test, expect } from '@playwright/test';
import { linksDe } from './artigos';

// Data esperada a partir do atributo datetime, sempre em UTC, como o site faz.
const dataEsperada = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso)
  );

test('home lista notícias e guias com a data em pt-BR', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Grafous');
  await expect(page.locator('header.topo .marca')).toHaveText('Grafous');
  await expect(page.getByRole('heading', { name: 'Notícias da semana' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guias', exact: true })).toBeVisible();
  // Capa: manchete + coluna "Mais notícias" + fileira, no máximo 6 notícias; guias, no máximo 3.
  const capa = page.locator('.capa');
  const noticiasNaCapa = await capa.locator('.manchete, .mais li, .fileira .card').count();
  expect(noticiasNaCapa).toBeGreaterThan(0);
  expect(noticiasNaCapa).toBeLessThanOrEqual(6);
  await expect(capa.locator('.manchete')).toHaveCount(1);
  expect(await page.locator('section[aria-labelledby="titulo-guias"] .card').count()).toBeLessThanOrEqual(3);
  const data = capa.locator('time').first();
  await expect(data).toHaveText(dataEsperada((await data.getAttribute('datetime'))!));
  // Home não tem pop-up.
  await expect(page.locator('#lead-fundo')).toHaveCount(0);
});

test('rodapé traz as credenciais do autor e o aviso legal', async ({ page }) => {
  await page.goto('/');
  const rodape = page.locator('footer.rodape');
  await expect(rodape).toContainText('Vitor RC');
  await expect(rodape).toContainText('CEA (Anbima)');
  await expect(rodape).toContainText('PUC-RS');
  await expect(rodape).toContainText('Gestão Financeira');
  await expect(rodape).toContainText('Rentabilidade passada não garante rentabilidade futura');
  await expect(page.locator('body')).not.toContainText(/economista|assessor de investimentos/i);
});

test('página de notícia tem seção, autor, data, leitura, fontes, aviso e SEO', async ({ page }) => {
  const [href] = await linksDe(page, '/noticias/');
  await page.goto(href);
  await expect(page.locator('.artigo .etiqueta')).toHaveText(/^Notícias da semana · (Brasil|Mercado|Internacional)$/);
  await expect(page.locator('.linha-fina')).toBeVisible();
  const meta = page.locator('.artigo-cabecalho .assinatura');
  // Abaixo do título vai a fonte, não o nome do autor.
  await expect(meta).not.toContainText(/Vitor (RC|Reis de Carvalho)/);
  if (await page.locator('.fontes li').count()) await expect(meta.locator('.fontes-linha')).toContainText(/^Fontes?/);
  await expect(meta).toContainText('min de leitura');
  const data = meta.locator('time').first();
  await expect(data).toHaveText(dataEsperada((await data.getAttribute('datetime'))!));
  await expect(page.locator('.aviso')).toContainText('não é recomendação de investimento');
  await expect(page.locator('.aviso')).toContainText('Rentabilidade passada não garante rentabilidade futura');
  await expect(page.locator('.aviso')).toContainText('perfil');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${href}$`));
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-padrao\.png$/);

  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('NewsArticle');
  expect(ld.author.name).toBe('Vitor RC');
  if (await page.locator('.artigo-corpo[data-gate="true"]').count()) {
    expect(ld.isAccessibleForFree).toBe(false);
    expect(ld.hasPart).toMatchObject({ isAccessibleForFree: false, cssSelector: '.artigo-corpo' });
  }
});

test('guia usa JSON-LD Article e mostra o tema', async ({ page }) => {
  const [href] = await linksDe(page, '/guias/');
  await page.goto(href);
  await expect(page.locator('.artigo .etiqueta')).toContainText('Guias ·');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('Article');
});

test('/guias/ agrupa por tema e /noticias/ lista as notícias', async ({ page }) => {
  await page.goto('/guias/');
  const temas = ['Previdência', 'Renda fixa', 'Proteção e reserva', 'Fundos', 'Investimento no exterior', 'Fundamentos'];
  const titulos = await page.locator('main h2').allTextContents();
  expect(titulos.length).toBeGreaterThan(0);
  for (const t of titulos) expect(temas).toContain(t);
  await page.goto('/noticias/');
  await expect(page.locator('.card')).not.toHaveCount(0);
});

test('filtro de editorias em /noticias/', async ({ page }) => {
  await page.goto('/noticias/');
  const filtro = page.getByRole('navigation', { name: 'Editorias' });
  await expect(filtro.getByRole('link', { name: 'Todas' })).toHaveAttribute('aria-current', 'page');
  const total = await page.locator('.card').count();

  let somadas = 0;
  for (const [rotulo, caminho] of [['Brasil', '/noticias/brasil/'], ['Mercado', '/noticias/mercado/'], ['Internacional', '/noticias/internacional/']]) {
    await filtro.getByRole('link', { name: rotulo }).click();
    await expect(page).toHaveURL(new RegExp(`${caminho}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Notícias da semana: ${rotulo}`);
    await expect(page.getByRole('navigation', { name: 'Editorias' }).getByRole('link', { name: rotulo })).toHaveAttribute('aria-current', 'page');
    const etiquetas = await page.locator('.card .etiqueta').allTextContents();
    for (const e of etiquetas) expect(e).toBe(rotulo);
    if (etiquetas.length === 0) await expect(page.locator('main')).toContainText('Nenhuma notícia publicada nesta editoria ainda.');
    somadas += etiquetas.length;
    await page.goto('/noticias/');
  }
  // Toda notícia está em exatamente uma editoria.
  expect(somadas).toBe(total);
});

test('calendário de proventos tem as duas seções, o aviso e menu', async ({ page }) => {
  await page.goto('/calendario/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Calendário de proventos');
  await expect(page.getByRole('heading', { name: /^Ações: dividendos e JCP/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Fundos imobiliários: rendimentos/ })).toBeVisible();
  await expect(page.locator('.nota-calendario')).toContainText('não indica compra ou venda');
  await expect(page.locator('nav.nav').getByRole('link', { name: 'Calendário' })).toHaveAttribute('aria-current', 'page');
  // Toda linha tem fonte https; sem linha, a página mostra a mensagem de vazio.
  for (const link of await page.locator('.tabela-proventos tbody a').all()) {
    await expect(link).toHaveAttribute('href', /^https:\/\//);
  }
  // A página não pode estourar a largura da tela (a tabela rola dentro do próprio quadro).
  const largura = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(largura).toBeLessThanOrEqual(0);
});

test('privacidade tem os campos para preencher', async ({ page }) => {
  await page.goto('/privacidade/');
  // O responsável pelo tratamento é identificado pelo nome completo; no resto do site o nome é "Vitor RC".
  await expect(page.locator('main')).toContainText('Vitor Reis de Carvalho');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidade');
  await expect(page.locator('main')).toContainText('13.709/2018');
});

test('404, RSS e sitemap', async ({ page, request }) => {
  const resp = await page.goto('/nao-existe/');
  expect(resp?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect(await rss.text()).toContain('<language>pt-br</language>');

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.ok()).toBe(true);
});

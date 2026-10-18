import { test, expect } from '@playwright/test';

test('home lista notícias e guias com a data em pt-BR', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Vitor Reis de Carvalho');
  await expect(page.getByRole('heading', { name: 'Notícias da semana' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guias', exact: true })).toBeVisible();
  // "2026-10-12" no cabeçalho do texto precisa aparecer como 12 de outubro, sem recuar um dia pelo fuso.
  await expect(page.locator('.card time').first()).toHaveText('12 de outubro de 2026');
  // Home não tem pop-up.
  await expect(page.locator('#lead-fundo')).toHaveCount(0);
});

test('rodapé traz as credenciais do autor e o aviso legal', async ({ page }) => {
  await page.goto('/');
  const rodape = page.locator('footer.rodape');
  await expect(rodape).toContainText('CEA (Anbima)');
  await expect(rodape).toContainText('PUC-RS');
  await expect(rodape).toContainText('Gestão Financeira');
  await expect(rodape).toContainText('Rentabilidade passada não garante rentabilidade futura');
  await expect(rodape).not.toContainText(/economista|assessor/i);
});

test('página de notícia tem seção, autor, data, leitura, fontes, aviso e SEO', async ({ page }) => {
  await page.goto('/noticias/2026-10-12-exemplo-noticia/');
  await expect(page.locator('.artigo .etiqueta')).toHaveText('Notícias da semana');
  await expect(page.locator('.linha-fina')).toBeVisible();
  await expect(page.locator('.artigo-cabecalho .meta')).toContainText('Vitor Reis de Carvalho');
  await expect(page.locator('.artigo-cabecalho .meta')).toContainText('12 de outubro de 2026');
  await expect(page.locator('.artigo-cabecalho .meta')).toContainText('min de leitura');
  await expect(page.getByRole('heading', { name: 'Fontes' })).toBeVisible();
  await expect(page.locator('.aviso')).toContainText('não é recomendação de investimento');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/noticias\/2026-10-12-exemplo-noticia\/$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[name="keywords"]')).toHaveAttribute('content', /exemplo/);

  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('NewsArticle');
  expect(ld.isAccessibleForFree).toBe(false);
  expect(ld.hasPart).toMatchObject({ isAccessibleForFree: false, cssSelector: '.artigo-corpo' });
  expect(ld.datePublished).toBe('2026-10-12T00:00:00.000Z');
});

test('guia usa JSON-LD Article e mostra o tema', async ({ page }) => {
  await page.goto('/guias/tesouro-ipca-marcacao-a-mercado/');
  await expect(page.locator('.artigo .etiqueta')).toContainText('Renda fixa');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('Article');
});

test('/guias/ agrupa por tema e /noticias/ lista as notícias', async ({ page }) => {
  await page.goto('/guias/');
  await expect(page.getByRole('heading', { level: 2, name: 'Renda fixa' })).toBeVisible();
  await page.goto('/noticias/');
  await expect(page.locator('.card')).not.toHaveCount(0);
});

test('privacidade tem os campos para preencher', async ({ page }) => {
  await page.goto('/privacidade/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidade');
  await expect(page.locator('main')).toContainText('[e-mail de contato]');
});

test('404, RSS e sitemap', async ({ page, request }) => {
  const resp = await page.goto('/nao-existe/');
  expect(resp?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada');

  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect(await rss.text()).toContain('<language>pt-br</language>');

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.ok()).toBe(true);
});

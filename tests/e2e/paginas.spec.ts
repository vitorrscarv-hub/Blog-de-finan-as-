import { test, expect } from '@playwright/test';
import { linksDe } from './artigos';

// Data esperada a partir do atributo datetime, sempre em UTC, como o site faz.
const dataEsperada = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso)
  );

test('home lista notícias e guias com a data em pt-BR', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Vitor Reis de Carvalho');
  await expect(page.getByRole('heading', { name: 'Notícias da semana' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guias', exact: true })).toBeVisible();
  expect(await page.locator('.secao').nth(0).locator('.card').count()).toBeLessThanOrEqual(6);
  expect(await page.locator('.secao').nth(1).locator('.card').count()).toBeLessThanOrEqual(3);
  const data = page.locator('.card time').first();
  await expect(data).toHaveText(dataEsperada((await data.getAttribute('datetime'))!));
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
  await expect(page.locator('body')).not.toContainText(/economista|assessor de investimentos/i);
});

test('página de notícia tem seção, autor, data, leitura, fontes, aviso e SEO', async ({ page }) => {
  const [href] = await linksDe(page, '/noticias/');
  await page.goto(href);
  await expect(page.locator('.artigo .etiqueta')).toHaveText('Notícias da semana');
  await expect(page.locator('.linha-fina')).toBeVisible();
  const meta = page.locator('.artigo-cabecalho .meta');
  await expect(meta).toContainText('Vitor Reis de Carvalho');
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
  expect(ld.author.name).toBe('Vitor Reis de Carvalho');
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

test('privacidade tem os campos para preencher', async ({ page }) => {
  await page.goto('/privacidade/');
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

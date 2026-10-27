import { test, expect } from '@playwright/test';
import { SITE } from '../../src/site.config';

test('manchete em carrossel com as matérias pontuais: troca sozinha, setas e pontos', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const destaques = page.locator('.destaques');
  const slides = destaques.locator('.manchete');
  const total = await slides.count();
  test.skip(total < 2, 'menos de duas matérias pontuais publicadas');
  expect(total).toBeLessThanOrEqual(SITE.capa.carrossel.maximo);
  await expect(destaques).toHaveAttribute('aria-roledescription', 'carrossel');
  await expect(slides.nth(0)).toBeVisible();

  // Troca sozinha depois do intervalo configurado.
  await page.clock.runFor(SITE.capa.carrossel.segundos * 1000 + 100);
  await expect(slides.nth(1)).toBeVisible();
  await expect(slides.nth(0)).toBeHidden();

  // Pontos e setas.
  await destaques.locator('.carrossel-ponto').nth(0).click();
  await expect(slides.nth(0)).toBeVisible();
  await destaques.getByRole('button', { name: 'Destaque anterior' }).click();
  await expect(slides.nth(total - 1)).toBeVisible();

  // Sem botão de pausa; com o mouse em cima, não troca sozinho.
  await expect(destaques.locator('.carrossel-pausa')).toHaveCount(0);
  await slides.nth(total - 1).hover();
  await page.clock.runFor(SITE.capa.carrossel.segundos * 3000);
  await expect(slides.nth(total - 1)).toBeVisible();

  // As matérias do carrossel não se repetem em "Mais notícias".
  const hrefsDestaque = await slides.locator('h2 a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  const hrefsMais = await page.locator('.mais li h3 a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const h of hrefsMais) expect(hrefsDestaque).not.toContain(h);
});

test('com "reduzir movimento", o carrossel não troca sozinho', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  const slides = page.locator('.destaques .manchete');
  test.skip((await slides.count()) < 2, 'menos de duas matérias pontuais publicadas');
  await page.clock.runFor(SITE.capa.carrossel.segundos * 3000);
  await expect(slides.nth(0)).toBeVisible();
});

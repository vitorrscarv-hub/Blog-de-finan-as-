import type { Page } from '@playwright/test';

// Os testes não dependem dos textos de exemplo: pegam os artigos publicados nas listas do site.
export async function linksDe(page: Page, lista: '/noticias/' | '/guias/') {
  await page.goto(lista);
  return page.locator('.card h3 a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
}

// Primeiros artigos com gate: true (o pop-up precisa de dois para o teste de "não volta").
export async function artigosComCadastro(page: Page) {
  const candidatos = [...(await linksDe(page, '/noticias/')), ...(await linksDe(page, '/guias/'))];
  const achados: string[] = [];
  for (const href of candidatos) {
    await page.goto(href);
    if (await page.locator('.artigo-corpo[data-gate="true"]').count()) achados.push(href);
    if (achados.length === 2) break;
  }
  if (achados.length < 2) throw new Error('Os testes precisam de pelo menos dois textos publicados com gate: true.');
  return achados as [string, string];
}

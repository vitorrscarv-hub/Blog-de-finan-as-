import { test, expect } from '@playwright/test';

const resposta = {
  atualizadoEm: '2026-10-21T13:45:00.000Z',
  itens: [
    { simbolo: 'IBOV', nome: 'IBOVESPA', preco: 208272.07, variacao: -0.01 },
    { simbolo: 'PETR4', nome: 'PETROBRAS PN N2', preco: 58.09, variacao: 0.35 },
  ],
  ptax: { valor: 5.014, variacao: -0.2, data: '2026-10-20' },
};

test('tarja mostra índice, ações e PTAX com aviso de atraso', async ({ page }) => {
  await page.route('**/api/cotacoes', (r) => r.fulfill({ json: resposta }));
  await page.goto('/');
  const tarja = page.locator('.tarja.pronta');
  await expect(tarja).toBeVisible();
  await expect(tarja.getByText('atraso de 15 min')).toBeVisible();
  const primeira = tarja.locator('.tarja-copia').first();
  await expect(primeira).toContainText('Ibovespa');
  await expect(primeira).toContainText('208.272 pts');
  await expect(primeira).toContainText('PETR4');
  await expect(primeira).toContainText('58,09');
  await expect(primeira).toContainText('+0,35%');
  await expect(primeira).toContainText('R$ 5,0140');
  await expect(tarja.locator('.tarja-copia[aria-hidden="true"]')).toHaveCount(1);
});

test('tarja fica escondida quando a API falha', async ({ page }) => {
  await page.route('**/api/cotacoes', (r) => r.fulfill({ status: 502, json: { itens: [], ptax: null } }));
  await page.goto('/');
  await expect(page.locator('.tarja.pronta')).toHaveCount(0);
  await expect(page.locator('.tarja')).toBeHidden();
});

test('com movimento reduzido a tarja não anima e a cópia some', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/cotacoes', (r) => r.fulfill({ json: resposta }));
  await page.goto('/');
  const trilho = page.locator('.tarja-trilho');
  await expect(trilho).toBeVisible();
  expect(await trilho.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.locator('.tarja-copia[aria-hidden="true"]')).toBeHidden();
});

import { test, expect } from '@playwright/test';

// A B3 é lida pelo navegador; a função só entrega a PTAX.
const b3 = (simbolo: string, preco: number, variacao: number) => ({
  Trad: [{ scty: { SctyQtn: { curPrc: preco, prcFlcn: variacao }, mkt: { nm: simbolo === 'IBOV' ? 'Indices' : 'Vista' }, symb: simbolo, desc: simbolo, indxCmpnInd: simbolo !== 'IBOV' } }],
});
const cotacoes: Record<string, [number, number]> = { IBOV: [208272.07, -0.01], PETR4: [58.09, 0.35] };
const simularB3 = (page: import('@playwright/test').Page) =>
  page.route('https://cotacao.b3.com.br/**', (r) => {
    const s = r.request().url().split('/').pop()!;
    return cotacoes[s] ? r.fulfill({ json: b3(s, ...cotacoes[s]) }) : r.fulfill({ status: 404, body: '' });
  });

const resposta = {
  atualizadoEm: '2026-10-21T13:45:00.000Z',
  itens: [],
  ptax: { valor: 5.014, variacao: -0.2, data: '2026-10-20' },
};

test('tarja mostra índice, ações e PTAX, e o rodapé avisa do atraso', async ({ page }) => {
  await simularB3(page);
  await page.route('**/api/cotacoes', (r) => r.fulfill({ json: resposta }));
  await page.goto('/');
  const tarja = page.locator('.tarja.pronta');
  await expect(tarja).toBeVisible();
  await expect(page.locator('footer')).toContainText('atraso de até 15 minutos');
  const primeira = tarja.locator('.tarja-copia').first();
  await expect(primeira).toContainText('Ibovespa');
  await expect(primeira).toContainText('208.272 pts');
  await expect(primeira).toContainText('PETR4');
  await expect(primeira).toContainText('58,09');
  await expect(primeira).toContainText('+0,35%');
  await expect(primeira).toContainText('R$ 5,0140');
  await expect(tarja.locator('.tarja-copia[aria-hidden="true"]')).toHaveCount(1);
});

test('tarja fica escondida quando todas as fontes falham', async ({ page }) => {
  await page.route('https://cotacao.b3.com.br/**', (r) => r.fulfill({ status: 403, body: '' }));
  await page.route('**/api/cotacoes', (r) => r.fulfill({ status: 502, json: { itens: [], ptax: null } }));
  await page.goto('/');
  await expect(page.locator('.tarja.pronta')).toHaveCount(0);
  await expect(page.locator('.tarja')).toBeHidden();
});

test('com movimento reduzido a tarja não anima e a cópia some', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await simularB3(page);
  await page.route('**/api/cotacoes', (r) => r.fulfill({ json: resposta }));
  await page.goto('/');
  const trilho = page.locator('.tarja-trilho');
  await expect(trilho).toBeVisible();
  expect(await trilho.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.locator('.tarja-copia[aria-hidden="true"]')).toBeHidden();
});

test('sem a PTAX, a tarja mostra só as ações da B3', async ({ page }) => {
  await simularB3(page);
  await page.route('**/api/cotacoes', (r) => r.fulfill({ status: 502, json: { itens: [], ptax: null } }));
  await page.goto('/');
  const primeira = page.locator('.tarja.pronta .tarja-copia').first();
  await expect(primeira).toContainText('PETR4');
  await expect(primeira).not.toContainText('PTAX');
});

test('clique para a rolagem e outro clique retoma', async ({ page }) => {
  await simularB3(page);
  await page.route('**/api/cotacoes', (r) => r.fulfill({ json: resposta }));
  await page.goto('/');
  const janela = page.locator('.tarja-janela');
  const estado = () => page.locator('.tarja-trilho').evaluate((e) => getComputedStyle(e).animationPlayState);
  await expect(page.locator('.tarja.pronta')).toBeVisible();
  expect(await estado()).toBe('running');
  await janela.click({ position: { x: 5, y: 5 } });
  expect(await estado()).toBe('paused');
  await expect(janela).toHaveAttribute('aria-pressed', 'true');
  await janela.click({ position: { x: 5, y: 5 } });
  expect(await estado()).toBe('running');
  await expect(janela).toHaveAttribute('aria-pressed', 'false');
});

import { test, expect, type Page } from '@playwright/test';
import { artigosComCadastro } from './artigos';

// Mesma definição usada no LeadGate: fração do corpo do texto que já passou
// por uma linha imaginária a 60% da altura da tela.
const progressoDoCorpo = (page: Page) =>
  page.evaluate(() => {
    const r = document.querySelector('.artigo-corpo')!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
  });

const popupAberto = (page: Page) =>
  page.evaluate(() => {
    const fundo = document.getElementById('lead-fundo');
    return !!fundo && !fundo.hidden;
  });

// Rola em passos pequenos, como um leitor, esperando dois quadros entre cada passo.
const rolarAte = async (page: Page, parar: () => Promise<boolean>, passo = 20, limite = 1000) => {
  for (let i = 0; i < limite; i++) {
    if (await parar()) return true;
    const fim = await page.evaluate(async (dy) => {
      const antes = window.scrollY;
      window.scrollBy(0, dy);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return window.scrollY === antes;
    }, passo);
    if (fim) return parar();
  }
  return parar();
};

test('pop-up de cadastro: abre no ponto certo, valida, libera a leitura e não volta', async ({ page }) => {
  const [NOTICIA, OUTRO] = await artigosComCadastro(page);
  const envios: Record<string, unknown>[] = [];
  await page.route('**/api/lead', async (route) => {
    envios.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await test.step('não aparece no carregamento', async () => {
    await page.goto(NOTICIA);
    await expect(page.locator('.artigo-corpo')).toBeVisible();
    await page.waitForTimeout(800);
    expect(await popupAberto(page)).toBe(false);
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  await test.step('abre entre 30% e 40% do corpo do texto', async () => {
    const abriu = await rolarAte(page, () => popupAberto(page));
    expect(abriu).toBe(true);
    const progresso = await progressoDoCorpo(page);
    const gatilho = Number(await page.locator('#lead-fundo').getAttribute('data-gatilho'));
    expect(gatilho).toBeGreaterThanOrEqual(0.3);
    expect(gatilho).toBeLessThanOrEqual(0.4);
    expect(progresso).toBeGreaterThanOrEqual(0.3);
    expect(progresso).toBeLessThanOrEqual(0.4 + 0.015); // folga de um passo de rolagem
    expect(progresso - gatilho).toBeLessThan(0.015);

    const dialogo = page.getByRole('dialog', { name: 'Para continuar lendo' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#lead-nome')).toBeFocused();
  });

  await test.step('modo obrigatório: texto desfocado e rolagem travada', async () => {
    await expect(page.locator('body')).toHaveClass(/travado/);
    const desfocados = page.locator('.artigo-corpo .depois-do-corte');
    expect(await desfocados.count()).toBeGreaterThan(0);
    const filtro = await desfocados.first().evaluate((el) => getComputedStyle(el).filter);
    expect(filtro).toContain('blur');
    const antes = await page.evaluate(() => document.body.getBoundingClientRect().top);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    const depois = await page.evaluate(() => document.body.getBoundingClientRect().top);
    expect(depois).toBe(antes);
    // O texto inteiro continua no HTML, para indexação: o último parágrafo está lá, só desfocado.
    await expect(page.locator('.artigo-corpo > :last-child')).toHaveClass(/depois-do-corte/);
    // Inputs com 16px evitam o zoom automático do iPhone.
    const fonte = await page.locator('#lead-email').evaluate((el) => getComputedStyle(el).fontSize);
    expect(fonte).toBe('16px');
  });

  await test.step('envio vazio mostra erro', async () => {
    await page.getByRole('button', { name: 'Continuar lendo' }).click();
    await expect(page.getByRole('alert')).toHaveText('Informe seu nome.');
    await expect(page.locator('#lead-nome')).toHaveAttribute('aria-invalid', 'true');
    expect(envios).toHaveLength(0);
  });

  await test.step('valida e-mail, WhatsApp e consentimento', async () => {
    await page.locator('#lead-nome').fill('Maria Teste');
    await page.locator('#lead-email').fill('maria@exemplo');
    await page.getByRole('button', { name: 'Continuar lendo' }).click();
    await expect(page.getByRole('alert')).toContainText('Confira o e-mail');

    await page.locator('#lead-email').fill('Maria.Teste@Exemplo.com.br');
    await page.locator('#lead-whatsapp').pressSequentially('1191234');
    await expect(page.locator('#lead-whatsapp')).toHaveValue('(11) 9123-4');
    await page.getByRole('button', { name: 'Continuar lendo' }).click();
    await expect(page.getByRole('alert')).toContainText('WhatsApp com DDD');

    await page.locator('#lead-whatsapp').fill('');
    await page.locator('#lead-whatsapp').pressSequentially('11912345678');
    await expect(page.locator('#lead-whatsapp')).toHaveValue('(11) 91234-5678');
    await page.getByRole('button', { name: 'Continuar lendo' }).click();
    await expect(page.getByRole('alert')).toContainText('autorização');
    expect(envios).toHaveLength(0);
  });

  await test.step('envio válido libera a leitura', async () => {
    await page.getByLabel('Autorizo o uso').check();
    await page.getByRole('button', { name: 'Continuar lendo' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/travado/);
    await expect(page.locator('.artigo-corpo .depois-do-corte')).toHaveCount(0);

    expect(envios).toHaveLength(1);
    expect(envios[0]).toMatchObject({
      nome: 'Maria Teste',
      email: 'Maria.Teste@Exemplo.com.br',
      whatsapp: '11912345678',
      consentimento: true,
      site: '',
      pagina: NOTICIA,
    });

    const marcado = await page.evaluate(() => ({
      local: localStorage.getItem('vrc_lead_ok'),
      cookie: document.cookie.includes('vrc_lead_ok=1'),
    }));
    expect(marcado).toEqual({ local: '1', cookie: true });

    // A rolagem volta a funcionar.
    const y = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 300));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y);
  });

  await test.step('em outro artigo o pop-up não volta', async () => {
    await page.goto(OUTRO);
    await rolarAte(page, async () => false, 60, 300);
    expect(await popupAberto(page)).toBe(false);
    await expect(page.locator('.artigo-corpo .depois-do-corte')).toHaveCount(0);
  });

  await test.step('nem quando só o cookie sobrevive', async () => {
    await page.evaluate(() => localStorage.clear());
    await page.goto(NOTICIA);
    await rolarAte(page, async () => false, 60, 300);
    expect(await popupAberto(page)).toBe(false);
  });
});

test('mostra aviso de erro se o envio falhar e mantém o pop-up aberto', async ({ page }) => {
  const [NOTICIA] = await artigosComCadastro(page);
  await page.route('**/api/lead', (route) => route.fulfill({ status: 500, body: '{"ok":false}' }));
  await page.goto(NOTICIA);
  expect(await rolarAte(page, () => popupAberto(page))).toBe(true);
  await page.locator('#lead-nome').fill('Maria Teste');
  await page.locator('#lead-email').fill('maria@exemplo.com');
  await page.locator('#lead-whatsapp').fill('1133334444');
  await page.getByLabel('Autorizo o uso').check();
  await page.getByRole('button', { name: 'Continuar lendo' }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível enviar');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('vrc_lead_ok'))).toBeNull();
});

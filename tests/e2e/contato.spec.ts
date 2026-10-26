import { test, expect } from '@playwright/test';
import { SITE } from '../../src/site.config';

const [PAGINA] = SITE.contatoEspecialista.paginas;

test('formulário de especialista valida os campos e envia com a origem própria', async ({ page }) => {
  const enviados: Record<string, unknown>[] = [];
  await page.route('**/api/lead', async (route) => {
    enviados.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto(PAGINA);
  const secao = page.locator('.contato-especialista');
  await expect(secao).toContainText(SITE.contatoEspecialista.chamada);
  await expect(secao).toContainText(SITE.contatoEspecialista.parceiro);

  await secao.getByLabel('Nome', { exact: true }).fill('Maria Teste');
  await secao.getByLabel('WhatsApp com DDD', { exact: true }).fill('1191234');
  await secao.getByRole('button', { name: 'Quero ser contatado' }).click();
  await expect(secao.getByRole('alert')).toContainText('WhatsApp');

  await secao.getByLabel('WhatsApp com DDD', { exact: true }).fill('11912345678');
  await expect(secao.getByLabel('WhatsApp com DDD', { exact: true })).toHaveValue('(11) 91234-5678');
  await secao.getByLabel('E-mail', { exact: true }).fill('maria@exemplo.com');
  await secao.getByRole('button', { name: 'Quero ser contatado' }).click();
  await expect(secao.getByRole('alert')).toContainText('autorização');
  expect(enviados).toHaveLength(0);

  await secao.locator('#ce-consentimento').check();
  await secao.getByRole('button', { name: 'Quero ser contatado' }).click();
  await expect(secao.getByRole('status')).toBeVisible();
  expect(enviados).toEqual([
    {
      nome: 'Maria Teste',
      email: 'maria@exemplo.com',
      whatsapp: '11912345678',
      consentimento: true,
      site: '',
      pagina: PAGINA,
      origem: SITE.contatoEspecialista.origem,
    },
  ]);
});

test('o formulário só aparece nas matérias listadas', async ({ page }) => {
  await page.goto('/noticias/2026-10-26-reeleicao-lula-mercado-queda/');
  await expect(page.locator('.contato-especialista')).toHaveCount(0);
});

import { test, expect, type Page } from '@playwright/test';
import { linksDe } from './artigos';
import { SITE } from '../../src/site.config';

const PAINEL = SITE.metricas.painel;

// Eventos que a página manda para /api/evento (sendBeacon com corpo text/plain).
async function capturarEventos(page: Page) {
  const eventos: Record<string, any>[] = [];
  await page.route('**/api/evento', async (route) => {
    eventos.push(JSON.parse(route.request().postData() ?? '{}'));
    await route.fulfill({ status: 204 });
  });
  return eventos;
}

const esconderPagina = (page: Page) =>
  page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

test('o pop-up de cadastro está desligado e nenhum texto fica restrito', async ({ page }) => {
  test.skip(SITE.lead.ativo, 'pop-up ligado: os testes de popup.spec cobrem');
  const [href] = await linksDe(page, '/noticias/');
  await page.goto(href);
  await expect(page.locator('#lead-fundo')).toHaveCount(0);
  await expect(page.locator('.artigo-corpo')).toHaveAttribute('data-gate', 'false');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld.isAccessibleForFree).toBeUndefined();
  expect(ld.hasPart).toBeUndefined();
});

test('medição: visita ao abrir e leitura (rolagem e tempo) ao sair, sem cookies', async ({ page, context }) => {
  const eventos = await capturarEventos(page);
  const [href] = await linksDe(page, '/noticias/');
  // A lista de notícias foi a primeira página: ali o navegador ainda não era conhecido.
  expect(eventos[0]).toMatchObject({ t: 'v', p: '/noticias/', novo: true });
  eventos.length = 0;
  await page.goto(href);
  await expect.poll(() => eventos.length).toBeGreaterThan(0);
  const visita = eventos[0];
  expect(visita).toMatchObject({ t: 'v', p: href, novo: false });
  expect(visita.pv).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  expect(visita.vis).toMatch(/^[A-Za-z0-9-]{8,64}$/);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await esconderPagina(page);
  await expect.poll(() => eventos.some((e) => e.t === 'l')).toBe(true);
  const leitura = eventos.find((e) => e.t === 'l')!;
  expect(leitura).toMatchObject({ pv: visita.pv, vis: visita.vis });
  expect(leitura.rol).toBeGreaterThan(50);
  expect(leitura.seg).toBeGreaterThanOrEqual(1);
  expect(await context.cookies()).toEqual([]);
  expect(Object.keys(visita).sort()).toEqual(['novo', 'p', 'pv', 'ref', 'ses', 't', 'vis']);

  // O navegador é reconhecido nas visitas seguintes: mesmo visitante, mesma aba, páginas diferentes.
  eventos.length = 0;
  await page.goto('/');
  await expect.poll(() => eventos.length).toBeGreaterThan(0);
  expect(eventos[0]).toMatchObject({ t: 'v', p: '/', vis: visita.vis, ses: visita.ses, novo: false });
  expect(eventos[0].pv).not.toBe(visita.pv);
});

test('medição: respeita "Não rastrear", o Global Privacy Control e o navegador do editor', async ({ browser }) => {
  for (const preparar of [
    () => Object.defineProperty(navigator, 'doNotTrack', { value: '1' }),
    () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }),
    () => localStorage.setItem('grafous_ignorar', '1'),
  ]) {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();
    const eventos = await capturarEventos(page);
    await page.addInitScript(preparar);
    await page.goto('/');
    await page.waitForTimeout(600);
    expect(eventos).toEqual([]);
    await contexto.close();
  }
});

const RESUMO = {
  ok: true,
  periodo: { dias: 30, de: '2026-09-21', ate: '2026-10-20' },
  totais: { visitas: 120, visitantes: 48, sessoes: 70, voltaram: 12, taxaRetorno: 25, leituras: 80, segundosMedios: 95, rolagemMedia: 61, concluiram: 30, taxaConclusao: 37.5 },
  porDia: Array.from({ length: 30 }, (_, i) => ({ dia: new Date(Date.UTC(2026, 8, 21 + i)).toISOString().slice(0, 10), visitas: (i * 7) % 11 + 1, visitantes: (i * 3) % 5 + 1 })),
  materias: [
    { caminho: '/noticias/2026-10-19-focus-ipca-2026-sobe-selic-fim-de-ano/', visitas: 40, leitores: 31, segundosMedios: 130, rolagemMedia: 70, taxaConclusao: 52.5 },
    { caminho: '/guias/outro-guia-que-nao-existe/', visitas: 8, leitores: 8, segundosMedios: null, rolagemMedia: null, taxaConclusao: 0 },
  ],
  origens: [{ origem: 'Acesso direto ou sem origem', visitas: 70 }, { origem: 'google.com', visitas: 30 }],
  dispositivos: [{ dispositivo: 'celular', visitas: 80 }, { dispositivo: 'computador', visitas: 40 }],
  paises: [{ pais: 'BR', visitas: 110 }],
  entradas: [{ caminho: '/', sessoes: 30 }],
  contatos: [
    { nome: 'Maria Teste', email: 'maria@exemplo.com', whatsapp: '+5511912345678', origem: 'especialista-exterior', pagina: '/noticias/2026-10-26-saida-de-dolares-patrimonio-no-exterior/', criado_em: '2026-10-26T15:00:00.000Z' },
  ],
  retorno: {
    distribuicao: [{ faixa: '1', visitantes: 36 }, { faixa: '2', visitantes: 8 }, { faixa: '3 a 4', visitantes: 3 }, { faixa: '5 ou mais', visitantes: 1 }],
    recorrentes: [{ visitante: 'a1b2c3d4', visitas: 9, dias: 5, primeira: '2026-10-01 08:10', ultima: '2026-10-20 07:30', jaTinhaVisitado: true, materias: ['/noticias/2026-10-19-focus-ipca-2026-sobe-selic-fim-de-ano/'] }],
  },
};

test('painel: oculto, com noindex, exige a chave e mostra as métricas', async ({ page, request }) => {
  const eventos = await capturarEventos(page);
  const pedidos: { dias: string | null; auth: string | undefined }[] = [];
  await page.route('**/api/admin/resumo*', async (route) => {
    const u = new URL(route.request().url());
    const auth = route.request().headers()['authorization'];
    pedidos.push({ dias: u.searchParams.get('dias'), auth });
    if (auth !== 'Bearer chave-certa') return route.fulfill({ status: 401, contentType: 'application/json', body: '{"ok":false}' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...RESUMO, periodo: { ...RESUMO.periodo, dias: Number(u.searchParams.get('dias')) } }) });
  });

  await page.goto(PAINEL);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Painel de audiência');
  await expect(page.locator('#conteudo')).toBeHidden();

  await page.getByLabel('Chave de acesso').fill('errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Chave incorreta.');
  await expect(page.locator('#conteudo')).toBeHidden();

  await page.getByLabel('Chave de acesso').fill('chave-certa');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.locator('#conteudo')).toBeVisible();
  await expect(page.locator('#kpis')).toContainText('120');
  await expect(page.locator('#kpis')).toContainText('25%');
  await expect(page.locator('#kpis')).toContainText('1 min 35 s');
  await expect(page.locator('#g-dias svg path.linha')).toHaveCount(2);
  const tabela = page.locator('#materias table');
  await expect(tabela).toContainText('Focus eleva o IPCA de 2026');
  await expect(tabela).toContainText('52,5%');
  await expect(tabela).toContainText('/guias/outro-guia-que-nao-existe/'); // matéria desconhecida aparece pelo endereço
  await expect(page.locator('#recorrentes')).toContainText('a1b2c3d4');
  await expect(page.locator('#origens')).toContainText('google.com');
  await expect(page.locator('#distribuicao .colunas > div')).toHaveCount(4);
  const contatos = page.locator('#contatos table');
  await expect(contatos).toContainText('Especialista');
  await expect(contatos).toContainText('Maria Teste');
  await expect(contatos).toContainText('(11) 91234-5678');
  await expect(contatos.locator('a[href="https://wa.me/5511912345678"]')).toHaveCount(1);

  // Dica ao passar o mouse no gráfico.
  const svg = page.locator('#g-dias svg');
  await svg.scrollIntoViewIfNeeded();
  const caixa = (await svg.boundingBox())!;
  await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  await expect(page.locator('#dica')).toBeVisible();
  await expect(page.locator('#dica')).toContainText('visitantes únicos');

  // Troca de período refaz o pedido com a chave.
  await page.getByRole('button', { name: '7 dias' }).click();
  await expect.poll(() => pedidos.at(-1)?.dias).toBe('7');
  expect(pedidos.at(-1)?.auth).toBe('Bearer chave-certa');

  // Quem entra no painel deixa de ser contado, e o próprio painel nunca é medido.
  expect(await page.evaluate(() => localStorage.getItem('grafous_ignorar'))).toBe('1');
  expect(eventos).toEqual([]);

  // Sem rolagem lateral na página.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // Não há link para o painel em lugar nenhum e ele fica fora do sitemap.
  await page.goto('/');
  expect(await page.locator(`a[href*="painel-grafous"]`).count()).toBe(0);
  const indice = await (await request.get('/sitemap-index.xml')).text();
  const mapas = [...indice.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const mapa of mapas) expect(await (await request.get(mapa)).text()).not.toContain('painel-grafous');
});

test('painel: avisa quando o servidor não tem a chave configurada', async ({ page }) => {
  await page.route('**/api/admin/resumo*', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto(PAINEL);
  await page.getByLabel('Chave de acesso').fill('qualquer');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('ADMIN_TOKEN');
});

test('painel: diz o que corrigir quando o banco não está ligado ou falta a tabela', async ({ page }) => {
  let corpo = '{"ok":false,"erro":"sem-banco"}';
  await page.route('**/api/admin/resumo*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: corpo }));
  await page.goto(PAINEL);
  await page.getByLabel('Chave de acesso').fill('qualquer');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('Settings > Bindings');
  corpo = '{"ok":false,"erro":"sem-tabela"}';
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('db/schema.sql');
});

test('painel: botão Atualizar busca os dados de novo e mostra a hora', async ({ page }) => {
  let pedidos = 0;
  await page.route('**/api/admin/resumo*', (route) => {
    pedidos++;
    const corpo = { ...RESUMO, totais: { ...RESUMO.totais, visitas: pedidos === 1 ? 120 : 121 } };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo) });
  });
  await page.goto(PAINEL);
  await page.getByLabel('Chave de acesso').fill('qualquer');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.locator('#kpis')).toContainText('120');
  await expect(page.locator('#periodo')).toContainText('Atualizado às');
  await page.getByRole('button', { name: 'Atualizar' }).click();
  await expect(page.locator('#kpis')).toContainText('121');
  expect(pedidos).toBe(2);
  await expect(page.getByRole('button', { name: 'Atualizar' })).toBeEnabled();
});

import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '../site.config';

// Sitemap de notícias do Google: as notícias dos últimos 2 dias (regra do Google News), regerado a cada publicação.
// Sem notícia nesse período, vai a mais recente: o Google acusa erro em sitemap sem nenhum <url>.
const DIAS = 2;
const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(context: APIContext) {
  const corte = Date.now() - DIAS * 86400_000;
  const todas = (await getCollection('noticias', (e) => !e.data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const recentes = todas.filter((e) => e.data.date.getTime() >= corte - 86400_000);
  const noticias = recentes.length ? recentes : todas.slice(0, 1);

  const urls = noticias.map(
    (e) => `<url><loc>${new URL(`/noticias/${e.id}/`, context.site).href}</loc><news:news><news:publication><news:name>${escapar(SITE.nome)}</news:name><news:language>pt</news:language></news:publication><news:publication_date>${e.data.date.toISOString().slice(0, 10)}</news:publication_date><news:title>${escapar(e.data.title)}</news:title></news:news></url>`
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '../site.config';

export async function GET(context: APIContext) {
  const noticias = await getCollection('noticias', (e) => !e.data.draft);
  const guias = await getCollection('guias', (e) => !e.data.draft);
  const itens = [
    ...noticias.map((e) => ({ ...e.data, link: `/noticias/${e.id}/` })),
    ...guias.map((e) => ({ ...e.data, link: `/guias/${e.id}/` })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return rss({
    title: SITE.nome,
    description: SITE.descricao,
    site: context.site!,
    items: itens.map((i) => ({ title: i.title, description: i.description, pubDate: i.date, link: i.link })),
    customData: '<language>pt-br</language>',
  });
}

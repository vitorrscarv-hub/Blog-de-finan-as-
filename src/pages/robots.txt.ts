import type { APIContext } from 'astro';

// Libera o site inteiro para os buscadores e aponta os mapas. As rotas internas (/api/) ficam de fora;
// o painel tem noindex na própria página.
export function GET(context: APIContext) {
  const site = context.site!;
  const texto = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
    `Sitemap: ${new URL('/news-sitemap.xml', site).href}`,
    '',
  ].join('\n');
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

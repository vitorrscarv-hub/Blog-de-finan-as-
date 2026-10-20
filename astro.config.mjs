import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domínio definitivo (endereço principal, sem www). O www redireciona para ele no Cloudflare.
export default defineConfig({
  site: 'https://grafous.com.br',
  trailingSlash: 'always',
  // O painel interno fica fora do sitemap (e tem noindex).
  integrations: [sitemap({ filter: (pagina) => !pagina.includes('/painel-grafous/') })],
});

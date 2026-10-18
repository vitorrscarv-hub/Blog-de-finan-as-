import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Troque pelo domínio definitivo antes do primeiro deploy.
export default defineConfig({
  site: 'https://www.seudominio.com.br',
  trailingSlash: 'always',
  integrations: [sitemap()],
});

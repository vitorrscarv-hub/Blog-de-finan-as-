import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { lerDatas, lastmodDe } from './scripts/lib/datas-conteudo.mjs';

const datas = lerDatas();

// Domínio definitivo (endereço principal, sem www). O www redireciona para ele no Cloudflare.
export default defineConfig({
  site: 'https://grafous.com.br',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // O painel interno fica fora do sitemap (e tem noindex).
      filter: (pagina) => !pagina.includes('/painel-grafous/'),
      // lastmod: quando cada página mudou, para o Google voltar só ao que é novo.
      serialize(item) {
        const data = lastmodDe(new URL(item.url).pathname, datas);
        return data ? { ...item, lastmod: data } : item;
      },
    }),
  ],
});

# Blog Vitor Reis de Carvalho

Site estático feito em [Astro](https://astro.build), com os textos em Markdown, hospedagem no Cloudflare Pages e cadastro de leitores gravado em um banco Cloudflare D1.

## Estrutura

```
src/
  content/noticias/    um arquivo .md por notícia da semana
  content/guias/       um arquivo .md por guia atemporal (campo "tema" obrigatório)
  content.config.ts    campos aceitos no cabeçalho de cada texto e lista de temas
  site.config.ts       nome, credenciais do autor e regras do pop-up de cadastro
  components/          cabeçalho, rodapé, card e pop-up de cadastro (LeadGate)
  layouts/             página base e página de artigo
  pages/               home, listas, artigos, privacidade, RSS e 404
functions/api/lead.js  recebe o cadastro (POST /api/lead) e grava no D1
db/schema.sql          tabela de cadastros
wrangler.toml          configuração do Cloudflare (nome do projeto e banco)
```

## Rodar no computador

Requer Node.js 22 ou mais novo.

```bash
npm install
npm run dev        # abre em http://localhost:4321
npm run build      # gera o site em dist/
```

No `npm run dev` o pop-up aparece, mas o envio do cadastro só funciona com a função do Cloudflare. Para testar tudo junto:

```bash
npm run build
npx wrangler pages dev dist --d1 DB=blog-leads
```

## Publicar um texto

Crie um arquivo em `src/content/noticias/` ou `src/content/guias/`. O nome do arquivo vira o endereço (`2026-10-19-ipca-setembro.md` vira `/noticias/2026-10-19-ipca-setembro/`).

```markdown
---
title: "IPCA sobe 0,82% em setembro e inflação em 12 meses passa do teto da meta"
description: "Até 155 caracteres. O build falha se passar disso."
date: 2026-10-19
keywords: ["IPCA setembro 2026", "inflação acima da meta", "Selic e inflação"]
teaser: "Texto do WhatsApp. [LINK]"
fontes:
  - titulo: "IBGE: IPCA fica em 0,82% em setembro"
    url: "https://agenciadenoticias.ibge.gov.br/..."
draft: false     # true esconde o texto do site publicado
gate: true       # false libera o texto sem pedir cadastro
---

Texto em Markdown. Intertítulos com ##, tabelas e links funcionam normalmente.
```

Guias levam também `tema:`, com um dos valores listados em `src/content.config.ts`.

Os dois arquivos de exemplo (`2026-10-12-exemplo-noticia.md` e `tesouro-ipca-marcacao-a-mercado.md`) servem só para mostrar o formato. Apague-os antes do lançamento.

## Pop-up de cadastro

- Aparece quando o leitor passa de um ponto sorteado entre 30% e 40% do texto, e só depois que ele começa a rolar a página.
- Pede nome, e-mail e WhatsApp, com autorização de uso dos dados (LGPD) obrigatória.
- Depois do cadastro, o navegador guarda uma marcação e o pop-up não aparece mais em nenhuma página.
- Modo `obrigatorio` (padrão): o restante do texto fica desfocado e a página trava até o cadastro. Modo `opcional`: aparece o botão "Agora não". Para trocar, edite `lead.modo` em `src/site.config.ts`.
- O texto completo continua no HTML, para o Google indexar. A página informa isso ao Google com a marcação `isAccessibleForFree`, recomendada para conteúdo com cadastro.
- Há um campo invisível que pega robôs: cadastros que o preencherem são descartados.

## Publicar no Cloudflare Pages

1. Crie uma conta no Cloudflare e instale o Wrangler: `npm install -g wrangler`, depois `wrangler login`.
2. Crie o banco: `wrangler d1 create blog-leads`. Copie o `database_id` exibido para o `wrangler.toml`.
3. Crie a tabela: `wrangler d1 execute blog-leads --remote --file=db/schema.sql`.
4. Suba o código para um repositório no GitHub e, no painel do Cloudflare, vá em Workers & Pages, Create, Pages, Connect to Git.
5. Configure o build: comando `npm run build`, pasta de saída `dist`.
6. Em Settings, Bindings, adicione um D1 database com o nome de variável `DB`, apontando para `blog-leads`.
7. Opcional, em Settings, Variables:
   - `ALLOWED_ORIGIN` = `https://www.seudominio.com.br` (aceita cadastros só do seu domínio)
   - `LEAD_WEBHOOK_URL` = endereço de uma automação (RD Station, Mailchimp, Zapier, Make etc.) que deve receber cada cadastro
8. Em Custom domains, ligue o domínio do blog e atualize `site` em `astro.config.mjs`.

A cada `git push`, o Cloudflare publica a nova versão sozinho.

## Exportar os cadastros

```bash
wrangler d1 execute blog-leads --remote --command "SELECT nome, email, whatsapp, criado_em FROM leads ORDER BY criado_em DESC" --json > leads.json
```

## Antes do lançamento

- Trocar `https://www.seudominio.com.br` em `astro.config.mjs`.
- Preencher os campos entre colchetes em `src/pages/privacidade.astro` e revisar a política com um advogado.
- Apagar os textos de exemplo.
- Conferir se a ferramenta que vai disparar mensagens por WhatsApp segue as regras da Meta para contato com quem se cadastrou.

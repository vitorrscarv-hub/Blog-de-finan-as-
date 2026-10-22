# Grafous

Blog Grafous, de Vitor Reis de Carvalho. Site estático feito em [Astro](https://astro.build), com os textos em Markdown, hospedagem no Cloudflare Pages e cadastro de leitores gravado num banco Cloudflare D1.

## Estrutura de pastas

```
src/
  content/noticias/      um arquivo .md por notícia da semana
  content/guias/         um arquivo .md por guia atemporal (campo "tema" obrigatório)
  content.config.ts      campos aceitos no cabeçalho de cada texto e lista de temas
  site.config.ts         nome, credenciais do autor, imagem de compartilhamento e regras do pop-up
  components/            cabeçalho, rodapé, card e pop-up de cadastro (LeadGate.astro)
  layouts/               página base (SEO) e página de artigo
  pages/                 home, listas (com filtro por editoria), artigos, calendário de proventos, privacidade, RSS e 404
  scripts/formatos.ts    datas em pt-BR, ordenação, rascunhos e tempo de leitura
  styles/global.css      todo o CSS do site, com modo escuro
  data/indicadores.json  valores de reserva da faixa de indicadores (Selic, IPCA, dólar), com fonte e data
public/                  favicon e imagem padrão de compartilhamento (og-padrao.png)
functions/api/lead.js    recebe o cadastro (POST /api/lead) e grava no D1
db/schema.sql            tabela de cadastros
scripts/                 exportação dos cadastros para CSV
tests/e2e/               testes do site com Playwright (celular e computador)
tests/unit/              testes da função de cadastro com um D1 falso
wrangler.toml            configuração do wrangler para uso no seu computador
.github/workflows/ci.yml build e testes em cada pull request
```

## Visual

O nome do blog (Grafous) e o slogan ficam em `SITE.nome` e `SITE.slogan`, em `src/site.config.ts`. O símbolo da logo liga as capitais de grandes economias nos cinco continentes (Washington, Brasília, Londres, Pretória, Nova Délhi, Pequim, Tóquio e Canberra), cada uma na sua posição geográfica real, com Brasília em destaque e a linha do Equador tracejada. As coordenadas e as ligações ficam em `src/scripts/marca.ts`, a única fonte do desenho: a logo do site (`src/components/Logo.astro`) usa esse arquivo, e `npm run marca` regera a partir dele o favicon, o ícone do iPhone e a imagem de compartilhamento (`public/og-padrao.png`). As matérias não têm assinatura: abaixo do título aparece a linha "Fonte" com as instituições citadas em `fontes:` (Banco Central, IBGE, Fed etc.), cada uma com link para a página original. Para uma instituição nova aparecer pelo nome, e não pelo endereço, inclua o domínio em `src/scripts/fontes.ts`.

Layout editorial próprio: barra superior escura, grade com filetes finos em vez de caixas, títulos na fonte Archivo (condensada) e texto corrido na Source Serif 4. As fontes vêm dos pacotes `@fontsource-variable` e são servidas pelo próprio site, sem Google Fonts. Cores e tamanhos ficam nas variáveis do topo de `src/styles/global.css`, com versão para o modo escuro.

A faixa de indicadores abaixo do menu (Selic, IPCA em 12 meses, dólar PTAX) mostra os valores ao vivo: assim que a página abre, ela troca o que veio no build pelo que a função `/api/cotacoes` leu no Banco Central e no IBGE (sem IA e sem pull request). O valor gravado no build, em `src/data/indicadores.json`, é a reserva para página sem JavaScript ou fonte fora do ar; `npm run indicadores` o atualiza, e a edição diária roda esse comando antes de cada commit. Cada item precisa de `nome`, `valor`, `data`, `fonte` e `url` (https); item incompleto não aparece.

### Tarja de cotações

Abaixo da faixa de indicadores há uma tarja em movimento com o Ibovespa, 12 ações do índice e o dólar PTAX. O navegador do leitor lê o Ibovespa e as ações direto da B3 (`cotacao.b3.com.br`, a mesma consulta pública do site da B3, com 15 minutos de atraso, sem chave e com CORS liberado) a cada 60 segundos, só com a aba aberta. A B3 recusa consultas vindas da Cloudflare, por isso a função `/api/cotacoes` (`functions/api/cotacoes.js`) cuida só da PTAX, lida no Olinda do Banco Central e guardada na borda por 60 segundos no pregão e 15 minutos fora dele. Para conferir a PTAX, abra `/api/cotacoes` e veja o campo `diagnostico`. Não usa banco, chave nem segredo.

- A lista de papéis fica em `src/data/tarja.json`; a função descarta o que não for componente do Ibovespa. É informativa: sem ranking, sem destaque de alta ou baixa e sem recomendação (o aviso de atraso de até 15 minutos fica no rodapé).
- `SITE.tarja.ativo` (em `src/site.config.ts`) liga e desliga a tarja. Se a fonte falhar, a tarja some em vez de mostrar valor velho como se fosse atual.
- A tarja anima em qualquer aparelho, inclusive com "reduzir movimento" ligado no sistema. Um clique ou toque (ou Enter/Espaço) para a rolagem e outro retoma.
- Aviso de risco: a API da B3 usada aqui é pública, mas não documentada nem contratada. Se a B3 mudar ou bloquear, só a tarja é afetada. A alternativa paga e licenciada é o feed de dados da própria B3 (UP2DATA) ou um provedor como a brapi.

## Como rodar

Requer Node.js 22.22 ou mais novo (a versão usada no Cloudflare e no CI está em `.node-version`).

```bash
npm install
npm run dev        # abre em http://localhost:4321, mostrando também os rascunhos
npm run build      # gera o site em dist/
npm test           # build, testes da função e testes do site
```

Na primeira vez que rodar os testes do site no seu computador, instale o navegador do Playwright com `npx playwright install chromium`.

No `npm run dev` o pop-up aparece, mas o envio do cadastro só funciona com a função do Cloudflare. Para testar tudo junto, com um banco local:

```bash
npm run cf:db:local   # cria a tabela no banco local (uma vez só)
npm run cf:dev        # build + servidor do Cloudflare em http://localhost:8788
```

Os cadastros de teste ficam em `.wrangler/`, que não vai para o repositório.

## Como publicar um texto

Toda mudança entra por um branch e um pull request, nunca direto no `main`. O Cloudflare gera uma prévia de cada pull request, com link no próprio PR, e publica o site quando o PR é aprovado e mesclado.

1. Crie um branch, por exemplo `texto/ipca-setembro`.
2. Crie o arquivo em `src/content/noticias/` ou `src/content/guias/`. O nome do arquivo vira o endereço: `2026-10-19-ipca-setembro.md` vira `/noticias/2026-10-19-ipca-setembro/`. Use só letras minúsculas sem acento, números e hífens.
3. Abra o pull request, confira a prévia e faça o merge.

Cabeçalho de uma notícia:

```markdown
---
title: "IPCA de setembro fica acima do esperado"
description: "Até 155 caracteres. O build falha se passar disso."
date: 2026-10-19
editoria: "Brasil"         # ou "Mercado" ou "Internacional"; só em notícias, padrão Brasil
pais: "Ucrânia"            # opcional; país ou região de que a notícia trata (internacionais)
updated: 2026-10-20        # opcional
keywords: ["IPCA setembro 2026", "inflação", "Selic"]   # até 5
teaser: "Texto curto para o canal de WhatsApp. [LINK]"  # opcional
fontes:
  - titulo: "IBGE: IPCA de setembro de 2026"
    url: "https://agenciadenoticias.ibge.gov.br/..."
draft: false     # true esconde o texto do site publicado (continua visível no npm run dev)
gate: true       # false libera o texto sem pedir cadastro
---

Texto em Markdown. Intertítulos com ##, listas, tabelas e links funcionam normalmente.
```

As notícias aparecem em `/noticias/` e também em `/noticias/brasil/`, `/noticias/mercado/` ou `/noticias/internacional/`, conforme a `editoria`, com etiqueta no card. Guias levam também `tema:`, com um destes valores: `Previdência`, `Renda fixa`, `Proteção e reserva`, `Fundos`, `Investimento no exterior` ou `Fundamentos`. A lista fica em `src/content.config.ts`, e a página `/guias/` segue essa ordem.

O build falha, com a mensagem de erro em português, se faltar título ou description, se a description passar de 155 caracteres, se houver mais de 5 palavras-chave, se uma fonte não tiver url completa ou se o tema não estiver na lista. As datas aparecem exatamente como no cabeçalho: `2026-10-12` sai como "12 de outubro de 2026".

Os dois arquivos de exemplo (`src/content/noticias/2026-10-12-exemplo-noticia.md` e `src/content/guias/tesouro-ipca-marcacao-a-mercado.md`) servem só para mostrar o formato. Apague os dois antes do lançamento, de preferência no mesmo pull request em que entrarem os primeiros textos reais. Os testes não dependem deles: acham os artigos pelas listas do site e só precisam de pelo menos dois textos publicados com `gate: true`.

## Edição diária automática

De segunda a sábado, duas tarefas agendadas do Claude Code fazem a edição do dia num só pull request, "Edição de AAAA-MM-DD":

- **10h30:** 1 matéria de Política Brasil (em período eleitoral, as pesquisas para presidente registradas no TSE) e 1 de Brasil ou Mercado. Em dia de IPCA ou de ata do Copom, essa segunda matéria é o evento. Na segunda, também o calendário de proventos.
- **18h45:** 1 matéria com o fato do dia (o fechamento do mercado; no sábado, o fato mais relevante). Em dia de decisão do Copom, é a decisão.

Guias e assuntos escolhidos por você vêm como **Matéria indicada pontual**, com pull request próprio.

Para gastar o mínimo de IA, o que é dado vira script e a IA só escreve:

| Etapa | Como |
| --- | --- |
| O que o dia pede | `node scripts/hoje.mjs`: IPCA pelo calendário do IBGE; ata e decisão do Copom pelas APIs do Banco Central |
| Pauta | `node scripts/radar.mjs`: manchetes dos jornais (Valor, Folha, Estadão, G1, Money Times, InfoMoney, Poder360) e das fontes oficiais |
| Pesquisas eleitorais | `node scripts/pesquisas-tse.mjs`: registro das pesquisas para presidente nos dados abertos do TSE |
| Texto | o editor-chefe (a própria sessão), uma matéria por vez |
| Checagem | um agente `checador` por matéria (`.claude/agents/checador.md`) |
| Revisão | `node scripts/revisar.mjs`: travessão, emoji, expressões proibidas, teaser, fontes e registro de pesquisa eleitoral |
| Calendário (segunda) | agente `calendarista`, a partir de `node scripts/proventos-b3.mjs` |
| Taxas e dólar do topo | função `/api/cotacoes`, ao vivo, sem IA e sem pull request |

O fluxo está em `.claude/skills/pauta-diaria/SKILL.md` e as regras de conteúdo em `.claude/skills/pauta-diaria/manual-de-redacao.md`. As tarefas agendadas só chamam a skill: para mudar vagas, tom ou fontes, edite o manual por pull request.

### Calendário de proventos

A página `/calendario/` lê `src/data/calendario.json`, que a edição de segunda de manhã atualiza: dividendos e JCP de ações e rendimentos de fundos imobiliários, cada linha com valor, datas e a fonte aberta. O build falha se uma linha estiver incompleta (`src/scripts/calendario.ts`). É informativo: sem ranking de pagadores, sem projeção, sem indicação de compra ou venda. Para editar à mão, siga o formato do arquivo (`acoes`: empresa, ticker, tipo `Dividendo` ou `JCP`, `valorPorAcao`, `dataCom`, `dataPagamento`, `fonte`; `fiis`: fundo, ticker, `valorPorCota`, `dataBase`, `dataPagamento`, `fonte`).

Para o checador conseguir abrir as fontes oficiais, o ambiente do Claude Code precisa de acesso a elas: nível **Limitado** (Custom, na documentação), com a caixa de gerenciadores de pacotes marcada, e a lista abaixo em **Domínios permitidos** (menu do ambiente na barra de título da sessão, Edit). A regra vale pelo nome exato do endereço, então use o curinga `*.` para cobrir o "www" e os outros subdomínios. Cada domínio vale também sem o curinga, e a lista funciona com os dois.

- Brasil: `*.bcb.gov.br`, `*.ibge.gov.br`, `*.tesourodireto.com.br`, `*.gov.br`, `*.in.gov.br`, `*.anbima.com.br`, `*.b3.com.br` (a CVM, com os dados abertos e o RAD, entra em `*.gov.br`). Para Mercado e calendário, páginas de relações com investidores das empresas (ex.: `ri.empresa.com.br`) precisam ser liberadas quando a pauta pedir.
- Fundos imobiliários: os rendimentos vêm da API de proventos da B3 (`sistemaswebb3-listados.b3.com.br`, em `*.b3.com.br`), pelo script `node scripts/proventos-b3.mjs`.
- Potências (ampliação internacional): `*.gov.uk`, `*.bankofengland.co.uk`, `*.ons.gov.uk`, `*.bundesbank.de`, `*.destatis.de`, `*.banque-france.fr`, `*.insee.fr`, `*.bancaditalia.it`, `*.istat.it`, `*.cbr.ru`, `*.kremlin.ru`, `*.whitehouse.gov`, `*.iaea.org`, `*.unocha.org`
- Exterior: `*.federalreserve.gov`, `*.bls.gov`, `*.bea.gov`, `*.treasury.gov`, `*.europa.eu`, `*.imf.org`, `*.worldbank.org`, `*.oecd.org`, `*.eia.gov`, `*.iea.org`, `*.opec.org`, `*.un.org`
- Opcional, para ouvir os dois lados dos conflitos e outras fontes oficiais (hoje recusados pelo proxy do ambiente): `*.mid.ru`, `*.government.ru`, `*.minfin.gov.ru`, `*.rosstat.gov.ru`, `*.president.gov.ua`, `*.mfa.gov.ua`, `*.bank.gov.ua`, `*.president.ir`, `*.mfa.ir`, `*.cbi.ir`, `*.nato.int`, `*.state.gov`, `*.defense.gov`, `*.economie.gouv.fr`, `*.gouvernement.fr`, `*.bundesregierung.de`
- Jornais (radar da pauta e fatos políticos atribuídos): `*.moneytimes.com.br`, `*.infomoney.com.br`, `*.poder360.com.br`, `*.globo.com`, `*.folha.uol.com.br`, `*.estadao.com.br`
- Pesquisas eleitorais (registro no TSE): `*.tse.jus.br`
- Agências (fatos políticos e de guerra): `*.reuters.com`, `*.apnews.com`, `*.afp.com`

Neste ambiente o WebFetch não resolve endereços, então a redação lê as fontes pelo terminal: `node scripts/ler-pagina.mjs <url>` (Chromium de verdade, para páginas com JavaScript) e `curl` para APIs. O guia `.claude/skills/pauta-diaria/acesso-as-fontes.md` lista os endereços de dados que funcionam (Selic, dólar PTAX, Focus, IPCA, BCE, OCDE, Banco Mundial) e os sites que bloqueiam robôs (BLS, páginas do IBGE, Reuters, AP), nos quais o dado fica sem conferência em vez de se tentar contornar o bloqueio.

Todos seguem o manual de redação em `.claude/skills/pauta-diaria/manual-de-redacao.md`. Para mudar critérios de pauta, tamanho ou tom, edite o manual por pull request. Você é o publisher: só o seu merge publica.

O que você faz:

1. Abra o pull request (chega notificação no celular e no e-mail do GitHub).
2. Leia os textos no link de prévia do Cloudflare. No corpo do PR há uma tabela com cada número usado e a fonte, para conferir rápido.
3. Se quiser mudar algo, edite o arquivo no próprio PR ou escreva um comentário pedindo a alteração.
4. Aperte Merge. O site é publicado em um ou dois minutos.

Textos com algum dado que a redação não conseguiu conferir na fonte oficial vêm com `draft: true`. Eles não aparecem na prévia nem no site, mesmo depois do merge, até alguém conferir o dado e trocar para `draft: false`.

## Como funciona o pop-up de cadastro

**Desligado por enquanto.** `lead.ativo` em `src/site.config.ts` está em `false`: o pop-up não aparece, todos os textos abrem sem cadastro e o JSON-LD deixa de marcar conteúdo restrito. Para religar, troque para `true` (os testes de `popup.spec.ts` voltam a rodar sozinhos). A função `/api/lead` e a tabela `leads` continuam no lugar.

- Só aparece em textos com `gate: true` e só depois que o leitor começa a rolar a página. Na abertura da página ele nunca aparece.
- O ponto de abertura é sorteado a cada visita entre 30% e 40% do corpo do texto. A leitura é medida por uma linha imaginária a 60% da altura da tela: quando a parte do texto acima dessa linha passa do ponto sorteado, o pop-up abre. Os limites ficam em `lead.gatilhoMin` e `lead.gatilhoMax` em `src/site.config.ts`.
- Pede nome, e-mail e WhatsApp com DDD (máscara `(11) 91234-5678`, 10 ou 11 números) e a autorização de uso dos dados, com link para `/privacidade/`. Há um campo invisível que pega robôs: cadastros que o preencherem recebem resposta de sucesso, mas não são gravados.
- O cadastro é pedido uma única vez. Depois do envio, o navegador guarda uma marcação no `localStorage` e num cookie de 2 anos, e o pop-up não aparece mais em nenhuma página.
- Dois modos, em `lead.modo` em `src/site.config.ts`:
  - `obrigatorio` (padrão): o resto do texto fica desfocado e a rolagem trava até o cadastro.
  - `opcional`: aparece o botão "Agora não" (e a tecla Esc fecha). O pop-up não volta enquanto a aba estiver aberta.
- O texto completo continua no HTML, para o Google indexar. A página avisa isso ao Google com `isAccessibleForFree: false` e `hasPart` apontando para `.artigo-corpo` no JSON-LD, que é a marcação recomendada para conteúdo com cadastro.
- Acessibilidade: a caixa tem `role="dialog"` e `aria-modal`, o foco vai para o campo Nome e fica preso dentro do pop-up, o resto da página fica inerte e os erros são lidos por leitores de tela (`role="alert"`). Os campos têm 16px, o que evita o zoom automático do iPhone.
- Se o envio falhar (sem internet, por exemplo), o leitor vê um aviso e pode tentar de novo. Uma falha no webhook não bloqueia a liberação da leitura.

Para ver o pop-up de novo no seu navegador, apague os dados do site (ou abra uma janela anônima).

## Painel de audiência (oculto)

O painel mostra quais matérias são mais lidas, de onde vêm os leitores e quem volta, com gráficos. Fica em `/painel-grafous/` (sem link em nenhuma página, fora do sitemap, com `noindex`). Para trocar o endereço, renomeie a pasta `src/pages/painel-grafous/` e ajuste `metricas.painel` em `src/site.config.ts` (e as duas linhas de `public/_headers`).

**Como mede.** Cada página aberta manda um aviso para `/api/evento` (`src/scripts/medir.ts`); nos textos, ao sair da página, vai também até onde a pessoa leu e por quanto tempo a página ficou visível. Cada leitor é um código aleatório guardado no navegador (sem cookie), por isso o retorno vale por navegador: quem limpa os dados ou troca de aparelho aparece como outra pessoa. Não guarda IP, user agent, nome nem e-mail, ignora robôs e respeita "Não rastrear" (DNT) e o Global Privacy Control. Para desligar tudo, `metricas.ativo: false`.

**O que mostra (7, 30 ou 90 dias, horário de Brasília):** visitas e visitantes únicos por dia; matérias mais lidas, com leitores únicos, tempo médio e % que leu até o fim (passou de 75% do texto); novos e que voltaram, e quantos dias diferentes cada visitante apareceu; os visitantes que voltaram, com as matérias que leram; origem, páginas de entrada, dispositivo e país.

**Para ligar em produção:**

1. Crie a tabela nova no banco que já existe (o arquivo é seguro de rodar de novo): `npx wrangler d1 execute blog-leads --remote --file=db/schema.sql`.
2. No Cloudflare Pages, Settings, Variables and Secrets, crie o segredo **`ADMIN_TOKEN`** com um valor longo e aleatório (32 caracteres ou mais; por exemplo, o resultado de `openssl rand -base64 32`). Sem ele, a rota de dados responde 503. Faça o novo deploy para valer.
3. Abra `/painel-grafous/`, digite a chave e entre. O navegador em que você entrar deixa de ser contado como leitor.
4. (Recomendado) Coloque o Cloudflare Access na frente de `/painel-grafous/*` e `/api/admin/*` (Zero Trust, Access, Applications) para exigir seu e-mail antes mesmo de a chave ser pedida.

Para testar no computador, crie `.dev.vars` (não vai para o repositório) com `ADMIN_TOKEN=uma-chave-de-teste-com-16-ou-mais-caracteres` e rode `npm run cf:db:local` e `npm run cf:dev`.

A política de privacidade (`/privacidade/`) tem a seção de medição de audiência para o advogado revisar: confirmar a base legal e se o aviso de cookies/armazenamento é suficiente.

## Função /api/lead

Só aceita POST. Valida tudo de novo no servidor, normaliza o e-mail em minúsculas e o WhatsApp para `+55` seguido do número, e grava no D1 com upsert por e-mail: se a pessoa se cadastrar de novo, nome, WhatsApp, página, origem e data do consentimento são atualizados, e `criado_em` fica o original.

Variáveis opcionais:

- `ALLOWED_ORIGIN`: origens aceitas, separadas por vírgula (para o Grafous: `https://grafous.com.br,https://www.grafous.com.br`). Pedidos de outras origens recebem 403. Configure só no ambiente de produção, senão as prévias dos pull requests não conseguem cadastrar.
- `LEAD_WEBHOOK_URL`: endereço que recebe cada cadastro por POST em JSON (RD Station, Mailchimp, Brevo, Zapier, Make etc.). O envio acontece em segundo plano, com limite de 5 segundos.

## Publicar no Cloudflare Pages

Você precisa de uma conta no Cloudflare. Os comandos abaixo rodam no seu computador, dentro da pasta do projeto.

1. Entre na sua conta pelo terminal: `npx wrangler login`.
2. Crie o banco de produção: `npx wrangler d1 create blog-leads`. Anote o id exibido, mas não o coloque no repositório.
3. Crie a tabela: `npx wrangler d1 execute blog-leads --remote --file=db/schema.sql`.
4. (Recomendado) Crie um banco separado para as prévias, para que cadastros de teste não se misturem com os reais: `npx wrangler d1 create blog-leads-previa` e `npx wrangler d1 execute blog-leads-previa --remote --file=db/schema.sql`.
5. No painel do Cloudflare, vá em Workers & Pages, Create, aba Pages, Connect to Git, e escolha este repositório.
6. Configure o build:
   - Production branch: `main`
   - Framework preset: Astro (ou None)
   - Build command: `npm run build`
   - Build output directory: `dist`
   A versão do Node vem do arquivo `.node-version`.
7. Depois do primeiro deploy, em Settings, Bindings, adicione um D1 database com o nome de variável `DB`:
   - em Production, apontando para `blog-leads`;
   - em Preview, apontando para `blog-leads-previa` (ou `blog-leads`, se não criou o banco de prévias).
8. Em Settings, Variables and Secrets, no ambiente Production:
   - `ALLOWED_ORIGIN` = `https://grafous.com.br,https://www.grafous.com.br`
   - `LEAD_WEBHOOK_URL` = endereço da sua automação, se houver (marque como Secret, porque a url costuma conter uma chave).
9. Faça um novo deploy (Deployments, Retry deployment) para os vínculos valerem.
10. Em Custom domains, ligue o domínio do blog. O domínio definitivo (`https://grafous.com.br`) já está em `astro.config.mjs`, pois esse endereço entra no canonical, no sitemap, no RSS e no Open Graph.
11. Faça um cadastro de teste no site publicado e confira com o comando de exportação abaixo.

O `wrangler.toml` não tem `pages_build_output_dir` de propósito: assim o Cloudflare usa os vínculos e as variáveis do painel, e o id do banco não precisa ficar no repositório.

Com o repositório ligado, cada pull request ganha uma prévia automática e cada merge no `main` publica o site.

## Exportar os cadastros

```bash
npx wrangler login         # se ainda não estiver logado
npm run cf:exportar        # gera leads-AAAA-MM-DD.csv, que abre direto no Excel
```

Também dá para consultar pelo painel do Cloudflare, em Storage & Databases, D1, `blog-leads`, Console, com:

```sql
SELECT nome, email, whatsapp, criado_em FROM leads ORDER BY criado_em DESC;
```

Para atender um pedido de exclusão (LGPD): `npx wrangler d1 execute blog-leads --remote --command "DELETE FROM leads WHERE email = 'pessoa@exemplo.com'"`. Se usar webhook, apague também na ferramenta de e-mail.

Os arquivos `leads-*.csv` estão no `.gitignore`. Guarde-os em local seguro e apague quando não precisar mais.

## Testes e CI

`npm test` roda, nesta ordem:

1. o build;
2. os testes de unidade (`tests/unit/`): datas sem erro de fuso e a função de cadastro com um D1 falso, cobrindo cadastro válido, upsert, sem consentimento, WhatsApp curto ou inválido, e-mail inválido, robô, origem recusada, falha no banco e falha no webhook;
3. os testes do site (`tests/e2e/`), em 390x780 e 1280x800: o pop-up não aparece no carregamento, abre entre 30% e 40% do corpo, recusa o envio vazio, aplica a máscara do WhatsApp, libera a leitura depois do envio (com a rota `/api/lead` simulada) e não volta em outro artigo. Também conferem home, listas, datas, SEO, privacidade, 404, RSS e sitemap.

O GitHub Actions (`.github/workflows/ci.yml`) roda o build e todos os testes em cada pull request. O build falha no CI se gerar qualquer aviso.

## Checklist de lançamento

- [x] Domínio `grafous.com.br` registrado no Registro.br, com o DNS no Cloudflare e o endereço em `astro.config.mjs`.
- [ ] Criar a conta no Cloudflare, o banco D1 e ligar o repositório ao Pages (passo a passo acima).
- [ ] Configurar o vínculo `DB` em Production e Preview, e `ALLOWED_ORIGIN` em Production.
- [ ] Fazer um cadastro de teste no site publicado e exportar para conferir.
- [ ] Preencher os campos entre colchetes em `src/pages/privacidade.astro` e revisar a política com um advogado.
- [ ] Apagar os dois textos de exemplo (com pelo menos dois textos reais com `gate: true` já publicados, que os testes usam).
- [ ] Publicar os primeiros textos reais (pelo menos uma notícia e um guia).
- [ ] Se usar envio por WhatsApp, conferir se a ferramenta segue as regras da Meta para contato com quem se cadastrou.
- [ ] Cadastrar o site no Google Search Console e enviar `https://SEU-DOMINIO/sitemap-index.xml`.
- [ ] Conferir a imagem de compartilhamento colando um link do blog no WhatsApp.

## Edições de outros países

O Grafous está pronto para ganhar edições em outros países. Os modelos de redação ficam em `.claude/skills/pauta-diaria/edicoes/`, todos desligados: Portugal, Estados Unidos, Reino Unido, África do Sul, Índia, China, Japão e Austrália. Cada modelo traz leitor e idioma, pauta e editorias locais, fontes oficiais, regras locais sobre conteúdo financeiro e dados pessoais, aviso legal no idioma do país (para revisão de advogado local), domínios a liberar na rede e as pendências antes de ativar.

O registro com código, idioma, fuso, horário da pauta e a chave de ativação está em `edicoes/edicoes.json`. O passo a passo para ligar uma edição, do parecer jurídico à tarefa agendada, está em `edicoes/COMO-ATIVAR.md`. Para incluir um país novo, copie um dos modelos, mantenha as mesmas seções e acrescente a linha no registro; `tests/unit/edicoes.test.js` confere se nada ficou faltando.

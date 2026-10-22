# Regras do projeto

Grafous, blog educacional de finanças de Vitor Reis de Carvalho. Astro estático, Cloudflare Pages, cadastro em Pages Function com D1. Detalhes de uso no README.

## Autor e conteúdo

- O nome do blog é Grafous (`SITE.nome`), com o slogan "A informação que conecta os fatos." (`SITE.slogan`) e a logo em `src/components/Logo.astro`, cujo símbolo (capitais ligadas, com Brasília em destaque) vem de `src/scripts/marca.ts`; depois de mudar o símbolo, rodar `npm run marca` (azul-marinho #131c2b e dourado #d4b46a; o dourado não serve para texto pequeno sobre fundo claro, use `--destaque`). Aparece no cabeçalho, nos títulos das páginas, no RSS e no Open Graph. As matérias não têm assinatura visível: abaixo do título vai a linha "Fonte(s)", montada a partir de `fontes:` (`src/scripts/fontes.ts`). O nome de Vitor aparece só na política de privacidade (`SITE.autor.nomeCompleto`), onde a LGPD pede a identificação do responsável pelos dados. Rodapé e metadados mostram só a marca: o JSON-LD usa o Grafous (Organization) como `author` e `publisher`, e o rodapé fala do blog e do que ele faz. O rodapé e o aviso do artigo informam que os textos são produzidos com apoio de inteligência artificial e revisados pela equipe técnica da redação antes da publicação; esse aviso não sai.

- Credenciais de Vitor (hoje não exibidas no site), sempre nestes termos se voltarem a aparecer: CEA (Anbima), pós-graduado em Finanças, Investimentos e Banking pela PUC-RS, formado em Gestão Financeira. A fonte única é `SITE.autor` em `src/site.config.ts`.
- Nunca apresentar Vitor como economista nem como assessor de investimentos, em nenhum texto, metadado ou JSON-LD.
- Nunca citar instituição financeira à qual Vitor seja vinculado.
- Público: investidores pessoa física com patrimônio relevante. Todo texto da interface em português do Brasil.
- Tom natural, de pessoa experiente falando com outra. Sem linguagem promocional, sem emojis, sem travessão, sem urgência artificial.
- Nenhum texto do site pode prometer retorno nem indicar compra ou venda de ativo. Isso vale para Mercado (sem preço-alvo, sem opinar sobre negócio de M&A ou recuperação judicial) e para o calendário de proventos (informativo: sem ranking de pagadores, sem projeção). O aviso de conteúdo educacional do artigo (`src/layouts/Artigo.astro`) e o do rodapé (`src/components/Rodape.astro`) não saem.
- Não inventar dados, fontes ou links. Os textos são escritos fora do site e revisados por Vitor antes de publicar.

## Schema de conteúdo

Manter o schema de `src/content.config.ts` como está. Campos: `title`, `description` (até 155 caracteres, o build falha se passar), `date`, `updated`, `keywords` (até 5), `teaser`, `fontes` ({titulo, url}), `draft` (padrão false), `gate` (padrão true). Notícias têm `editoria` (`Brasil`, `Mercado` ou `Internacional`, padrão `Brasil`), que define a etiqueta e as páginas `/noticias/brasil/`, `/noticias/mercado/` e `/noticias/internacional/`, e `pais` (opcional, texto livre). Guias têm `tema`, com um destes valores: Previdência, Renda fixa, Proteção e reserva, Fundos, Investimento no exterior, Fundamentos. Mudar campo ou tema só com pedido explícito.

As datas são exibidas em UTC (`src/scripts/formatos.ts`) para que "2026-10-12" apareça como 12 de outubro. Não remover o `timeZone: 'UTC'`.

## Pop-up de cadastro

- Está desligado: `SITE.lead.ativo` é `false` (nenhum texto fica restrito). Só religar a pedido de Vitor.
- Configuração em `SITE.lead` (`src/site.config.ts`): gatilho entre 30% e 40% do corpo, modo `obrigatorio` (padrão) ou `opcional`.
- O texto completo fica sempre no HTML. Não esconder conteúdo no servidor; o JSON-LD marca `isAccessibleForFree: false` com `hasPart` em `.artigo-corpo`.
- A validação do formulário e a de `functions/api/lead.js` precisam continuar iguais (nome, e-mail, WhatsApp com DDD de 10 ou 11 dígitos, consentimento, campo-armadilha `site`).

## Painel de audiência

- Painel oculto em `/painel-grafous/` (`src/pages/painel-grafous/`), dados em `functions/api/admin/resumo.js` (exige `ADMIN_TOKEN`, segredo do Cloudflare; nunca versionar) e medição em `src/scripts/medir.ts` + `functions/api/evento.js` (tabela `visitas` em `db/schema.sql`). Sem link no site, fora do sitemap, com `noindex`.
- A medição não pode guardar IP, user agent, nome, e-mail nem cookie, e tem de respeitar DNT e Global Privacy Control. Não ligar o identificador de leitor ao cadastro (lead) sem pedido explícito e revisão da política de privacidade.

## Edição diária

Três matérias por dia, de segunda a sábado, em dois turnos (10h30: Política Brasil e Brasil ou Mercado; 18h45: fato do dia), num só pull request por dia; IPCA, ata e decisão do Copom viram matéria no dia, apontados por `scripts/hoje.mjs`. A **Matéria indicada pontual** (assunto e guias escolhidos por Vitor) tem pull request próprio. O fluxo está só em `.claude/skills/pauta-diaria/SKILL.md` e as regras de conteúdo só no manual `.claude/skills/pauta-diaria/manual-de-redacao.md` (jornais como radar e fonte atribuída de fato político, nunca de dado econômico; pesquisa eleitoral só com registro no TSE; neutralidade total). Não repetir essas regras em outro lugar, nem nos prompts das tarefas agendadas: eles só chamam a skill. Taxas e dólar do topo do site vêm de API, sem IA e sem pull request.

Edições de outros países (Portugal, Estados Unidos, Reino Unido, África do Sul, Índia, China, Japão e Austrália) têm modelo de redação pronto em `.claude/skills/pauta-diaria/edicoes/`, todas inativas. Só a edição Brasil está ativa; ativar outra segue `edicoes/COMO-ATIVAR.md`, começando pelo parecer jurídico do país, e nunca por iniciativa própria.

## Segredos

Nunca versionar ids reais de banco, tokens, senhas ou `.dev.vars`. O `wrangler.toml` mantém o placeholder `COLE-O-ID-DO-BANCO-AQUI` e não tem `pages_build_output_dir`; os vínculos de produção ficam no painel do Cloudflare. Arquivos `leads-*.csv` têm dados pessoais e não vão para o repositório.

## Fluxo de trabalho

- Trabalhar sempre em branch e entregar por pull request para o `main`. Nunca fazer commit ou push direto no `main`, force push, apagar branches ou deploy manual no Cloudflare.
- Merge de pull request só com autorização explícita de Vitor, dada naquela conversa para aquele PR ("faça o merge"). Antes, conferir que o CI passou e que o PR não tem conflito, e mergear com `expectedHeadSha` para garantir que é o commit revisado. Autorização de um PR não vale para os outros. A edição diária e a Matéria indicada pontual terminam sem merge.
- Commits curtos, em português, um por etapa.
- Antes de concluir qualquer tarefa, rodar `npm run build` (sem erros nem avisos) e `npm test`. Se algo falhar, corrigir ou dizer claramente o que falhou.
- Para conferir o visual, tirar capturas em 390x780 e 1280x800, nos modos claro e escuro, e não versionar as capturas (`capturas/` está no `.gitignore`).

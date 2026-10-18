# Regras do projeto

Blog educacional de finanças de Vitor Reis de Carvalho. Astro estático, Cloudflare Pages, cadastro em Pages Function com D1. Detalhes de uso no README.

## Autor e conteúdo

- Credenciais de Vitor, sempre nestes termos: CEA (Anbima), pós-graduado em Finanças, Investimentos e Banking pela PUC-RS, formado em Gestão Financeira. A fonte única é `SITE.autor` em `src/site.config.ts`.
- Nunca apresentar Vitor como economista nem como assessor de investimentos, em nenhum texto, metadado ou JSON-LD.
- Nunca citar instituição financeira à qual Vitor seja vinculado.
- Público: investidores pessoa física com patrimônio relevante. Todo texto da interface em português do Brasil.
- Tom natural, de pessoa experiente falando com outra. Sem linguagem promocional, sem emojis, sem travessão, sem urgência artificial.
- Nenhum texto do site pode prometer retorno nem indicar compra ou venda de ativo. O aviso de conteúdo educacional do artigo (`src/layouts/Artigo.astro`) e o do rodapé (`src/components/Rodape.astro`) não saem.
- Não inventar dados, fontes ou links. Os textos são escritos fora do site e revisados por Vitor antes de publicar.

## Schema de conteúdo

Manter o schema de `src/content.config.ts` como está. Campos: `title`, `description` (até 155 caracteres, o build falha se passar), `date`, `updated`, `keywords` (até 5), `teaser`, `fontes` ({titulo, url}), `draft` (padrão false), `gate` (padrão true). Guias têm `tema`, com um destes valores: Previdência, Renda fixa, Proteção e reserva, Fundos, Investimento no exterior, Fundamentos. Mudar campo ou tema só com pedido explícito.

As datas são exibidas em UTC (`src/scripts/formatos.ts`) para que "2026-10-12" apareça como 12 de outubro. Não remover o `timeZone: 'UTC'`.

## Pop-up de cadastro

- Configuração em `SITE.lead` (`src/site.config.ts`): gatilho entre 30% e 40% do corpo, modo `obrigatorio` (padrão) ou `opcional`.
- O texto completo fica sempre no HTML. Não esconder conteúdo no servidor; o JSON-LD marca `isAccessibleForFree: false` com `hasPart` em `.artigo-corpo`.
- A validação do formulário e a de `functions/api/lead.js` precisam continuar iguais (nome, e-mail, WhatsApp com DDD de 10 ou 11 dígitos, consentimento, campo-armadilha `site`).

## Segredos

Nunca versionar ids reais de banco, tokens, senhas ou `.dev.vars`. O `wrangler.toml` mantém o placeholder `COLE-O-ID-DO-BANCO-AQUI` e não tem `pages_build_output_dir`; os vínculos de produção ficam no painel do Cloudflare. Arquivos `leads-*.csv` têm dados pessoais e não vão para o repositório.

## Fluxo de trabalho

- Trabalhar sempre em branch e entregar por pull request para o `main`. Nunca fazer commit ou push direto no `main`, merge, force push, apagar branches ou deploy manual no Cloudflare.
- Commits curtos, em português, um por etapa.
- Antes de concluir qualquer tarefa, rodar `npm run build` (sem erros nem avisos) e `npm test`. Se algo falhar, corrigir ou dizer claramente o que falhou.
- Para conferir o visual, tirar capturas em 390x780 e 1280x800, nos modos claro e escuro, e não versionar as capturas (`capturas/` está no `.gitignore`).

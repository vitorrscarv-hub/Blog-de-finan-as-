---
name: pauta-semanal
description: Escreve a pauta da semana do blog (3 notícias e 1 guia), confere cada dado na fonte primária, roda build e testes e abre um pull request para Vitor revisar e publicar com o botão Merge. Use quando a tarefa agendada semanal disparar ou quando pedirem a pauta da semana.
---

# Pauta semanal

Toda semana entram 3 notícias e 1 guia atemporal. Você escreve, confere e abre o pull request. Vitor lê a prévia e decide: o merge é dele, e é o merge que publica o site. Leia o `CLAUDE.md` antes de começar; as regras de lá valem aqui.

## 1. Preparar

1. `git fetch origin main` e crie o branch `pauta/AAAA-MM-DD` (data de hoje, fuso de São Paulo) a partir de `origin/main`.
2. `npm ci`.
3. Leia todos os arquivos de `src/content/noticias/` e `src/content/guias/` e a lista de pull requests abertos, para não repetir assunto já publicado ou em revisão.

## 2. Escolher os assuntos

Notícias: os 3 fatos dos últimos 7 dias que mais mudam a vida de quem investe como pessoa física e tem patrimônio relevante. Prioridade:

- decisões e atas do Copom, Selic, IPCA e IPCA-15, projeções do Boletim Focus;
- tributação de investimentos (IR, fundos, LCI/LCA, JCP, previdência), regras novas da Receita, do CMN, da CVM ou da Anbima;
- títulos públicos e Tesouro Direto, FGC, câmbio e investimento no exterior, previdência privada.

Evite fato de uma empresa só, recomendação de casa de análise, boato e "o mercado acha". Se a semana tiver menos de 3 fatos relevantes, escreva menos notícias e diga isso no pull request. Não invente pauta.

Guia: um tema atemporal ainda não coberto. Escolha o `tema` com menos guias publicados (Previdência, Renda fixa, Proteção e reserva, Fundos, Investimento no exterior, Fundamentos). Exemplos: tabela regressiva x progressiva, como funciona o FGC, PGBL x VGBL, come-cotas, reserva de emergência para quem tem patrimônio alto, sucessão e previdência.

## 3. Pesquisar e conferir

Regra que não tem exceção: todo número, data, alíquota, nome de norma e citação do texto precisa ter sido lido por você na fonte primária, numa página que você abriu nesta sessão. Fontes primárias: Banco Central (bcb.gov.br, inclusive a API SGS em api.bcb.gov.br), IBGE (ibge.gov.br, agenciadenoticias.ibge.gov.br, servicodados.ibge.gov.br), Tesouro Nacional e Tesouro Direto, Receita Federal e CVM (gov.br), Anbima, B3, Diário Oficial da União.

- Use a busca para achar o fato e a fonte primária para confirmá-lo. Notícia de jornal ou site de investimento serve para pauta, não como fonte do número.
- Se não conseguir abrir a fonte primária (bloqueio de rede, site fora do ar), o texto vai com `draft: true` e o pull request lista exatamente o que ficou sem conferência. Nunca preencha o dado com o que "provavelmente" é.
- Em `fontes:` do cabeçalho, entre só páginas que você abriu, com título descritivo e url completa.

## 4. Escrever

Um arquivo por texto, no formato do README ("Como publicar um texto"):

- Notícias em `src/content/noticias/AAAA-MM-DD-assunto-curto.md`, com `date` igual à data de hoje. Guia em `src/content/guias/assunto-curto.md`, com `tema`.
- `description` de até 155 caracteres, que funcione como linha fina. `keywords` com até 5 termos que alguém digitaria no Google. `teaser` com até duas frases para o canal de WhatsApp, terminando em `[LINK]`. `gate: true`, `draft: false` (salvo o caso da seção 3).
- Notícia: 500 a 800 palavras. Comece pelo fato, depois o contexto e, por fim, o que muda para quem investe. Guia: 1.200 a 1.800 palavras, com intertítulos `##`, exemplos numéricos simples e explicitamente ilustrativos.
- Tom de pessoa experiente falando com outra. Sem linguagem promocional, sem emojis, sem travessão (use vírgula, ponto ou parênteses), sem urgência artificial, sem frases genéricas que serviriam para qualquer assunto.
- Nunca prometer retorno, nunca indicar compra ou venda de ativo, fundo ou título específico, nunca dizer o que o leitor "deve" fazer com o dinheiro. Explique o mecanismo e os pontos a considerar conforme o perfil.
- Não citar Vitor no corpo do texto, não apresentá-lo como economista nem como assessor, não citar instituição financeira à qual ele seja vinculado.

Se ainda existirem os textos de exemplo (`2026-10-12-exemplo-noticia.md` e `tesouro-ipca-marcacao-a-mercado.md`) e esta pauta tiver pelo menos dois textos com `draft: false` e `gate: true`, apague os exemplos neste mesmo pull request.

## 5. Validar

1. `npm run build` sem erros nem avisos e `npm test` passando. Corrija o que falhar.
2. Releia cada texto procurando: número sem fonte, travessão (`—` ou `–`), recomendação disfarçada ("vale a pena", "é hora de", "aproveite"), description acima de 155 caracteres.
3. Um commit por texto, em português (ex.: `adiciona notícia sobre a ata do Copom`).

## 6. Abrir o pull request

Push do branch e pull request para o `main`, com título `Pauta da semana AAAA-MM-DD`. No corpo, para cada texto:

- título e endereço que a página terá;
- resumo em duas linhas;
- tabela "dado | valor no texto | fonte" com todos os números, para Vitor conferir em poucos minutos;
- o que ficou sem conferência, se houver, e por que o texto está como rascunho.

No fim do corpo, o resultado do build e dos testes e a lembrança de que o link de prévia do Cloudflare aparece no próprio pull request.

Nunca faça merge, push no `main`, force push nem deploy. Se algo impedir a pauta (falha de build que você não conseguiu resolver, nenhuma fonte acessível), abra o pull request mesmo assim, como draft, explicando o problema.

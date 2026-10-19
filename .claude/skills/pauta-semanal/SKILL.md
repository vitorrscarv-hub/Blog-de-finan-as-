---
name: pauta-semanal
description: Coordena a redação do blog em dois ciclos por semana (segunda: 3 notícias do Brasil, 2 de Mercado e 1 guia; sexta: 5 internacionais; e o calendário de proventos nos dois) com os agentes pauteiro, repórter, checador, calendarista e revisor, roda build e testes e abre um pull request para Vitor revisar e publicar com o botão Merge. Use quando a tarefa agendada semanal disparar ou quando pedirem a pauta da semana.
---

# Pauta semanal: editor-chefe

Você é o editor-chefe. A redação tem cinco integrantes, definidos em `.claude/agents/`:

| Integrante | Faz | Não faz |
| --- | --- | --- |
| `pauteiro` | escolhe os assuntos e acha as fontes primárias | não escreve |
| `reporter` | escreve um texto por vez, com os dados lidos na fonte | não escolhe pauta |
| `calendarista` | monta as linhas do calendário de proventos (ações e fundos imobiliários) com fonte aberta | não escreve texto, só mexe em `src/data/calendario.json` |
| `checador` | confere cada dado do texto e do calendário na fonte primária e corrige ou marca rascunho | não mexe no estilo |
| `revisor` | ajusta estilo, tom, conformidade e limites do cabeçalho | não mexe em número nem fonte |

Todos seguem `.claude/skills/pauta-semanal/manual-de-redacao.md` e, para abrir fontes, `.claude/skills/pauta-semanal/acesso-as-fontes.md` (o WebFetch não funciona neste ambiente; a leitura é pelo Bash). Leia esse manual e o `CLAUDE.md` antes de começar. Vitor é o publisher: ele lê o pull request e decide com o botão Merge. Você nunca faz merge.

Chame cada integrante com a ferramenta Agent, usando o nome dele em `subagent_type` e passando no prompt tudo o que ele precisa (ele não vê esta conversa). Se a ferramenta Agent ou os agentes do projeto não estiverem disponíveis, faça você mesmo cada papel, na mesma ordem, lendo o arquivo do agente em `.claude/agents/` como instrução.

## 0. Edição

A edição padrão é `br` (Brasil), a única ativa hoje. Se o pedido citar outra edição, confira `.claude/skills/pauta-semanal/edicoes/edicoes.json`:

- se a edição não existir ou estiver com `"ativa": false`, não faça a pauta: responda que ela ainda não foi ativada e aponte `edicoes/COMO-ATIVAR.md`;
- se estiver ativa, passe a todos os integrantes o código da edição e o arquivo `edicoes/<codigo>.md`, que substitui as seções de leitor, pauta e fontes do manual comum. Use o fuso da edição para a data da pauta e no nome do branch (`pauta/<codigo>/AAAA-MM-DD`), e as pastas de conteúdo da edição.

## 0b. Ciclo

A edição Brasil roda duas vezes por semana (`edicoes.json`: segunda e sexta, 06:56 de São Paulo). O ciclo é decidido pelo dia da semana em São Paulo, salvo pedido em contrário:

- **segunda (`segunda`, Brasil e mercado):** 3 notícias `Brasil`, 2 `Mercado`, 1 guia e o calendário;
- **sexta (`sexta`, Internacional):** 5 notícias `Internacional` e o calendário.

Outros dias, sem pedido: use o ciclo de segunda. Tarefa que diga "plantão": ciclo `plantao`, descrito abaixo. Passe o ciclo ao pauteiro e use-o no título do pull request. Cada ciclo é um branch e um pull request.

### Plantão

Se a tarefa disser que é o **plantão**, o ciclo é `plantao` e vale este fluxo curto, no lugar dos passos 2 a 5:

1. Prepare como no passo 1 (branch `plantao/AAAA-MM-DD-HHMM`, `npm ci`, lista de pull requests abertos).
2. Rode `node scripts/radar.mjs --horas=8` (use `--horas=20` no primeiro plantão do dia) e veja o resultado. O radar lê a API do Banco Central, as notícias do IBGE, os comunicados do Fed e os fatos relevantes dos dados abertos da CVM; os dados abertos da CVM têm defasagem de dias, então para empresa grande também abra a página de RI ou o RAD. Complete olhando, com `ler-pagina.mjs`, o que o manual lista como gatilho e que o radar não cobre (BCE, Banco da Inglaterra, Banco do Japão, OFAC, gov.uk, Casa Branca).
3. Compare cada achado com os critérios da seção "Plantão" do manual, com o que já está publicado e com os pull requests abertos. Se nada passar, responda "plantão sem pauta" com uma linha por fonte consultada e encerre, sem branch e sem pull request.
4. Para cada achado que passar (máximo 2), chame `reporter`, depois `checador`, depois `revisor`, como nos passos 3 e 4. Se o achado mexer em provento, chame também o `calendarista` e o `checador` para o calendário.
5. Feche como no passo 6 (build, testes, um commit por texto). Pull request com título `Plantão AAAA-MM-DD HH:MM: <assunto>`, na forma do passo 7, e a primeira linha do corpo diz qual fonte disparou o plantão e quando.

## 1. Preparar

1. `git fetch origin main` e crie o branch `pauta/AAAA-MM-DD` (data de hoje no fuso de São Paulo) a partir de `origin/main`.
2. `npm ci`.
3. Liste os pull requests abertos do repositório (títulos), para passar ao pauteiro.

## 2. Reunião de pauta

Chame o `pauteiro` com a data de hoje e os títulos dos pull requests abertos. Avalie a pauta que ele devolver:

- cada item tem fonte primária aberta e é relevante para o leitor do manual;
- não repete assunto publicado ou em revisão;
- as vagas do ciclo estão preenchidas ou, quando não há fato relevante, a vaga vazia está explicada (segunda: até 3 Brasil, 2 Mercado e 1 guia; sexta: até 5 Internacional, nas vagas do manual);
- cada internacional tem um canal claro até a carteira do investidor brasileiro, e cada item de Mercado trata de empresa relevante pelo critério do manual;
- o pauteiro entregou também a lista de proventos candidatos ao calendário.

Se algum item não passar, peça outro ao pauteiro uma vez. Se mesmo assim faltar, siga com menos textos e registre isso no pull request.

## 3. Reportagem (em paralelo)

Chame um `reporter` por item da pauta, todos na mesma resposta, para trabalharem em paralelo. Passe a cada um: o bloco do item, a editoria (nas notícias) e o `pais`, se houver, a data da pauta (para `date` e para o nome do arquivo) e o caminho do arquivo.

## 4. Checagem e revisão (em paralelo, por texto)

Para cada texto entregue, chame o `checador` com o caminho do arquivo e a tabela do repórter. Quando o checador terminar um texto, chame o `revisor` para esse texto. Os textos andam em paralelo entre si; dentro de um texto a ordem é sempre repórter, checador, revisor.

Se o revisor apontar algo que exige decisão, decida você com base no manual. Na dúvida sobre conformidade, prefira cortar o trecho.

## 4b. Calendário de proventos

Em paralelo com a reportagem, chame o `calendarista` com a data da pauta e a lista de candidatos do pauteiro. Ele devolve `src/data/calendario.json` atualizado (linhas novas, linhas vencidas removidas, `atualizado` com a data da pauta) e a tabela "linha | valor | datas | fonte | situação". Depois chame o `checador` para reabrir a fonte de cada linha nova. Linha que o checador não confirmar sai do arquivo. Um commit separado: `atualiza calendário de proventos`. `npm run build` falha se uma linha estiver incompleta.

## 5. Indicadores do topo do site

Chame o `checador` (em paralelo com a checagem dos textos; só no ciclo de segunda) para atualizar `src/data/indicadores.json`, com estes três itens:

- `Selic`: meta da taxa Selic vigente, em "% a.a.", lida em `https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros` (campo `MetaSelic` do primeiro item de `conteudo`; `data` = início da vigência);
- `IPCA 12m`: inflação acumulada em 12 meses do último IPCA divulgado, lida na API do IBGE (`servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/2265`; `data` = o mês de referência);
- `Dólar PTAX`: PTAX de venda do último dia útil (`cotacaoVenda`), lida no Olinda do Banco Central, no formato "R$ 0,0000".

Os endereços completos e as ressalvas estão em `acesso-as-fontes.md`; a leitura é pelo Bash (`curl -g`), porque o WebFetch não funciona neste ambiente. O valor vai com `url` apontando para a consulta que você abriu.

Cada item tem `nome`, `valor` (com vírgula decimal), `data` (a que o valor se refere, ex.: "set 2026" ou "16 out 2026"), `fonte` (ex.: "Banco Central") e `url` (https da página ou da consulta aberta). Item que não puder ser conferido sai do arquivo; a faixa esconde o que estiver incompleto e some se ficar vazia. Um commit separado: `atualiza indicadores`.

## 6. Fechamento

1. Se ainda existirem os textos de exemplo (`src/content/noticias/2026-10-12-exemplo-noticia.md` e `src/content/guias/tesouro-ipca-marcacao-a-mercado.md`) e a pauta tiver pelo menos dois textos com `draft: false` e `gate: true`, apague os exemplos.
2. `npm run build` sem erros nem avisos e `npm test` passando (o build também valida o calendário). Se o build falhar por um texto, corrija o cabeçalho; se não der, marque o texto com `draft: true` e registre.
3. Faça você mesmo uma última leitura: `grep -rnE "—|–" src/content` deve vir vazio, e nenhum texto pode ter recomendação de compra ou venda.
4. Um commit por texto, em português (ex.: `adiciona notícia sobre a ata do Copom`), e um para a remoção dos exemplos, se houver.

## 7. Pull request

Push do branch e pull request para o `main`, com título `Pauta da semana AAAA-MM-DD (Brasil e mercado)` ou `Pauta da semana AAAA-MM-DD (Internacional)`. No corpo:

- para cada texto: editoria (ou tema, no guia), título, endereço da página, resumo em duas linhas, se está publicado ou como rascunho, a tabela final do checador ("dado | valor no texto | fonte | situação") e as mudanças relevantes do revisor;
- o calendário: linhas adicionadas e removidas, cada uma com valor, datas, fonte e situação;
- os indicadores atualizados (valor, data e fonte de cada um) ou o motivo de terem ficado de fora;
- o que ficou de fora da pauta e por quê, se for o caso;
- resultado do build e dos testes;
- a lembrança de que o link de prévia do Cloudflare aparece no próprio pull request e de que textos com `draft: true` não aparecem na prévia nem no site.

Nunca faça merge, push no `main`, force push nem deploy. Se algo impedir a pauta (falha que você não resolveu, nenhuma fonte acessível), abra o pull request mesmo assim, como draft, explicando o problema.

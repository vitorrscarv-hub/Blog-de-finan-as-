---
name: pauta-semanal
description: Coordena a redação do blog para a pauta da semana (3 notícias do Brasil, 2 internacionais e 1 guia) com os agentes pauteiro, repórter, checador e revisor, roda build e testes e abre um pull request para Vitor revisar e publicar com o botão Merge. Use quando a tarefa agendada semanal disparar ou quando pedirem a pauta da semana.
---

# Pauta semanal: editor-chefe

Você é o editor-chefe. A redação tem quatro integrantes, definidos em `.claude/agents/`:

| Integrante | Faz | Não faz |
| --- | --- | --- |
| `pauteiro` | escolhe os assuntos e acha as fontes primárias | não escreve |
| `reporter` | escreve um texto por vez, com os dados lidos na fonte | não escolhe pauta |
| `checador` | confere cada dado do texto na fonte primária e corrige ou marca rascunho | não mexe no estilo |
| `revisor` | ajusta estilo, tom, conformidade e limites do cabeçalho | não mexe em número nem fonte |

Todos seguem `.claude/skills/pauta-semanal/manual-de-redacao.md` e, para abrir fontes, `.claude/skills/pauta-semanal/acesso-as-fontes.md` (o WebFetch não funciona neste ambiente; a leitura é pelo Bash). Leia esse manual e o `CLAUDE.md` antes de começar. Vitor é o publisher: ele lê o pull request e decide com o botão Merge. Você nunca faz merge.

Chame cada integrante com a ferramenta Agent, usando o nome dele em `subagent_type` e passando no prompt tudo o que ele precisa (ele não vê esta conversa). Se a ferramenta Agent ou os agentes do projeto não estiverem disponíveis, faça você mesmo cada papel, na mesma ordem, lendo o arquivo do agente em `.claude/agents/` como instrução.

## 1. Preparar

1. `git fetch origin main` e crie o branch `pauta/AAAA-MM-DD` (data de hoje no fuso de São Paulo) a partir de `origin/main`.
2. `npm ci`.
3. Liste os pull requests abertos do repositório (títulos), para passar ao pauteiro.

## 2. Reunião de pauta

Chame o `pauteiro` com a data de hoje e os títulos dos pull requests abertos. Avalie a pauta que ele devolver:

- cada item tem fonte primária aberta e é relevante para o leitor do manual;
- não repete assunto publicado ou em revisão;
- são até 3 notícias do Brasil, 2 internacionais e 1 guia;
- cada internacional tem um canal claro até a carteira do investidor brasileiro.

Se algum item não passar, peça outro ao pauteiro uma vez. Se mesmo assim faltar, siga com menos textos e registre isso no pull request.

## 3. Reportagem (em paralelo)

Chame um `reporter` por item da pauta, todos na mesma resposta, para trabalharem em paralelo. Passe a cada um: o bloco do item, a editoria (nas notícias), a data da pauta (para `date` e para o nome do arquivo) e o caminho do arquivo.

## 4. Checagem e revisão (em paralelo, por texto)

Para cada texto entregue, chame o `checador` com o caminho do arquivo e a tabela do repórter. Quando o checador terminar um texto, chame o `revisor` para esse texto. Os textos andam em paralelo entre si; dentro de um texto a ordem é sempre repórter, checador, revisor.

Se o revisor apontar algo que exige decisão, decida você com base no manual. Na dúvida sobre conformidade, prefira cortar o trecho.

## 5. Indicadores do topo do site

Chame o `checador` (em paralelo com a checagem dos textos) para atualizar `src/data/indicadores.json`, com estes três itens:

- `Selic`: meta da taxa Selic vigente, em "% a.a.", lida em `https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros` (campo `MetaSelic` do primeiro item de `conteudo`; `data` = início da vigência);
- `IPCA 12m`: inflação acumulada em 12 meses do último IPCA divulgado, lida na API do IBGE (`servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/2265`; `data` = o mês de referência);
- `Dólar PTAX`: PTAX de venda do último dia útil (`cotacaoVenda`), lida no Olinda do Banco Central, no formato "R$ 0,0000".

Os endereços completos e as ressalvas estão em `acesso-as-fontes.md`; a leitura é pelo Bash (`curl -g`), porque o WebFetch não funciona neste ambiente. O valor vai com `url` apontando para a consulta que você abriu.

Cada item tem `nome`, `valor` (com vírgula decimal), `data` (a que o valor se refere, ex.: "set 2026" ou "16 out 2026"), `fonte` (ex.: "Banco Central") e `url` (https da página ou da consulta aberta). Item que não puder ser conferido sai do arquivo; a faixa esconde o que estiver incompleto e some se ficar vazia. Um commit separado: `atualiza indicadores`.

## 6. Fechamento

1. Se ainda existirem os textos de exemplo (`src/content/noticias/2026-10-12-exemplo-noticia.md` e `src/content/guias/tesouro-ipca-marcacao-a-mercado.md`) e a pauta tiver pelo menos dois textos com `draft: false` e `gate: true`, apague os exemplos.
2. `npm run build` sem erros nem avisos e `npm test` passando. Se o build falhar por um texto, corrija o cabeçalho; se não der, marque o texto com `draft: true` e registre.
3. Faça você mesmo uma última leitura: `grep -rnE "—|–" src/content` deve vir vazio, e nenhum texto pode ter recomendação de compra ou venda.
4. Um commit por texto, em português (ex.: `adiciona notícia sobre a ata do Copom`), e um para a remoção dos exemplos, se houver.

## 7. Pull request

Push do branch e pull request para o `main`, com título `Pauta da semana AAAA-MM-DD`. No corpo:

- para cada texto: editoria (ou tema, no guia), título, endereço da página, resumo em duas linhas, se está publicado ou como rascunho, a tabela final do checador ("dado | valor no texto | fonte | situação") e as mudanças relevantes do revisor;
- os indicadores atualizados (valor, data e fonte de cada um) ou o motivo de terem ficado de fora;
- o que ficou de fora da pauta e por quê, se for o caso;
- resultado do build e dos testes;
- a lembrança de que o link de prévia do Cloudflare aparece no próprio pull request e de que textos com `draft: true` não aparecem na prévia nem no site.

Nunca faça merge, push no `main`, force push nem deploy. Se algo impedir a pauta (falha que você não resolveu, nenhuma fonte acessível), abra o pull request mesmo assim, como draft, explicando o problema.

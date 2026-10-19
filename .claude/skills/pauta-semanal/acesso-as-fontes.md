# Como a redação acessa as fontes

Testado em 19/10/2026 no ambiente de nuvem do Claude Code, com a rede em **Limitado** e os domínios do README liberados (com curinga, como `*.bcb.gov.br`). Leia antes de pesquisar: neste ambiente o **WebFetch não resolve endereços** (dá `ENOTFOUND` até em sites liberados). Use o terminal (Bash).

## Duas ferramentas

1. **Páginas:** `node scripts/ler-pagina.mjs <url> [--max=12000] [--espera=3000]`. Abre a página num Chromium de verdade, espera o JavaScript e imprime o texto. Serve para sites que só montam o conteúdo com JavaScript e para o Fed, o FMI, o Tesouro, a B3, a Anbima etc. Se a resposta for 401 ou 403, o site recusa robôs: **não tente contornar**; use a API da fonte (tabela abaixo) ou deixe o dado sem conferência.
2. **APIs (JSON, CSV, XML):** `curl -g -sS -L --max-time 25 -H "User-Agent: Mozilla/5.0" "<url>"`. A opção `-g` é necessária quando a url tem colchetes.

Só faça requisições de leitura (GET) às fontes oficiais listadas no manual de redação.

## Dados do Brasil (funcionam)

| Dado | Endereço | Como ler |
| --- | --- | --- |
| Meta Selic e decisões do Copom | `https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros` | JSON. `conteudo[0]` é a vigente: `MetaSelic`, `DataInicioVigencia`, `NumeroReuniaoCopom`, `DataReuniaoCopom`. Em 19/10/2026: 13,75% desde 17/09/2026 (reunião 281). |
| Dólar PTAX | `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='MM-DD-AAAA'&$format=json` | `cotacaoVenda`. Sábado, domingo e feriado voltam vazios: tente o dia útil anterior. |
| Expectativas do Boletim Focus | `https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=5&$orderby=Data%20desc&$format=json` (também `ExpectativasMercadoSelic`, `ExpectativasMercadoMensais`) | JSON OData; filtre por `Indicador` e `Data`. |
| IPCA | `https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/63\|69\|2265?localidades=N1[all]` (use `curl -g`) | 63 = variação do mês, 69 = no ano, 2265 = em 12 meses. Em 19/10/2026: setembro 0,82%, 12 meses 4,58%. |
| Notícias do IBGE | `https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=10` | JSON com título, data e link da página original. |
| Páginas do Banco Central, Tesouro Direto, Anbima, B3, gov.br | `node scripts/ler-pagina.mjs <url>` | Algumas páginas do BC dependem de API interna e podem vir vazias; prefira os endereços acima. |

## Dados do exterior (funcionam)

| Dado | Endereço |
| --- | --- |
| Comunicados do Fed | `https://www.federalreserve.gov/feeds/press_all.xml` (lista) e a página do comunicado com `ler-pagina.mjs` |
| Taxas do BCE | `https://data-api.ecb.europa.eu/service/data/<fluxo>/<chave>?lastNObservations=1&format=csvdata` |
| Eurostat | `https://ec.europa.eu/eurostat/api/dissemination/` (SDMX/JSON) |
| OCDE (inflação, PIB, emprego de vários países) | `https://sdmx.oecd.org/public/rest/data/...&format=csvfilewithlabels` |
| Banco Mundial | `https://api.worldbank.org/v2/country/<ISO2>/indicator/<codigo>?format=json&mrnev=1` |
| FMI (páginas de publicações) | `ler-pagina.mjs` abre; a API `datamapper` recusa robôs |
| Tesouro dos EUA, BEA, EIA, OPEP, ONU | `ler-pagina.mjs` |

## O que bloqueia robôs (não contornar)

| Fonte | O que fazer |
| --- | --- |
| `bls.gov` (páginas) | Recusa robôs de propósito. A API `api.bls.gov` responde, mas o limite diário do ambiente costuma estar esgotado. Para inflação e PIB dos EUA, use o BEA e o Fed; se o dado for só do BLS, fica **sem conferência**. |
| `www.ibge.gov.br` e `agenciadenoticias.ibge.gov.br` | Use a API `servicodados.ibge.gov.br` (acima), que traz o link da notícia original. Cite o link da agência em `fontes:` só depois de ler o conteúdo pela API. |
| `reuters.com`, `apnews.com`, `afp.com` | Recusam robôs (401 ou 403). Para fatos políticos e de guerra, a exigência de duas agências pode não ser cumprível: o texto vai como rascunho e o pull request diz o que faltou. |
| `oecd.org`, `iea.org` (páginas) | Use a API da OCDE (acima); da AIE, só o que o `ler-pagina.mjs` conseguir abrir. |
| `api.bcb.gov.br` (séries SGS) | Sem resposta neste ambiente. Use os endereços do BC acima. |

## Regra de ouro

Se nenhuma das vias abrir a fonte primária, o dado fica **sem conferência**: o texto vai com `draft: true` e o pull request diz o que faltou. Nunca preencha com o que "provavelmente" é.

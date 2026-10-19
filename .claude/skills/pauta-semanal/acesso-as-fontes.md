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

## Mercado e calendário (testado em 19/10/2026)

| Dado | Endereço | Como ler |
| --- | --- | --- |
| Fatos relevantes, comunicados e avisos aos acionistas das companhias abertas | `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/IPE/DADOS/ipe_cia_aberta_2026.zip` (troque o ano) | CSV em latin1, separador `;`. Colunas: `Nome_Companhia`, `Data_Referencia`, `Categoria` (ex.: "Fato Relevante", "Aviso aos Acionistas", "Comunicado ao Mercado"), `Assunto`, `Data_Entrega`, `Link_Download` (documento no RAD). Filtre por `Categoria` e `Data_Entrega` e abra o documento pelo link. |
| Informe mensal dos fundos imobiliários | `https://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_2026.zip` | CSV (geral, complemento, ativo e passivo): cotistas, patrimônio e ativos. Não traz a data de pagamento do rendimento: ela vem do comunicado do administrador. |
| Documento do RAD (aviso, fato relevante, comunicado) | `Link_Download` do CSV acima | **`ler-pagina.mjs` não funciona** (o link é um download). Use `curl -g -sS -L -H "User-Agent: Mozilla/5.0" -o doc.pdf "<link>"` e depois `pdftotext -layout doc.pdf -` (o conteúdo vem em PDF, em português e inglês). Testado em 19/10/2026 com avisos de Petrobras e Localiza. |
| Proventos na B3 (API pública das consultas do site da B3) | `node scripts/proventos-b3.mjs [--so=fiis\|acoes] [--dias=45] [--urls]` | **Funciona com `curl`** (o navegador e a página inicial desse domínio recusam). Fundos do IFIX: valor por cota, data-base e **data de pagamento** (fonte primária da B3). Ibovespa: valor, data com e data de aprovação do dividendo ou JCP, sem data de pagamento (esta vem do aviso no RAD). Com `--urls`, cada linha traz a consulta https para citar em `fonte`. Detalhe: `sistemaswebb3-listados.b3.com.br/<rota>/<base64 do JSON>`, rotas `fundsProxy/fundsCall/GetListedSupplementFunds` (`{"identifierFund":"MXRF","typeFund":7}`), `listedCompaniesProxy/CompanyCall/GetListedCashDividends`, `indexProxy/indexCall/GetPortfolioDay` (IFIX e IBOV). |
| Fundos.NET (`fnet.bmfbovespa.com.br`) | comunicados dos administradores | Domínio liberado, mas a consulta de documentos expira. Use a API da B3 acima. |
| Páginas da CVM, Cade e CNJ | `node scripts/ler-pagina.mjs <url>` | Páginas em `gov.br` abrem. |
| Páginas de RI das empresas e da B3 | `node scripts/ler-pagina.mjs <url>` | `www.b3.com.br` abre; `sistemaswebb3-listados.b3.com.br` devolve 403 (não contornar). Domínio de RI de empresa precisa estar liberado na rede do ambiente. |

O documento do RAD (`rad.cvm.gov.br`) é a fonte do aviso. Muitos avisos trazem pagamento "até", "a partir de" ou "a definir": isso não é data firme e a linha não entra no calendário. Grandes empresas (Itaú, Vale, Ambev, Banco do Brasil) nem sempre têm aviso na janela; não complete com o que se lembra.

## Radar do plantão

`node scripts/radar.mjs [--horas=24]` junta, numa lista só, o que saiu nas últimas horas na API do Banco Central (Selic vigente), nas notícias do IBGE, nos comunicados do Fed e nos fatos relevantes dos dados abertos da CVM. Usa `curl` e `unzip`. Cuidado: o arquivo de dados abertos da CVM atualiza com defasagem (em 19/10/2026 o último fato relevante era de 16/10); para fato do mesmo dia, abra o RAD ou o RI da empresa. O radar só aponta; o texto só sai com o documento primário aberto.

## Dados do exterior (funcionam)

| Dado | Endereço |
| --- | --- |
| Comunicados do Fed | `https://www.federalreserve.gov/feeds/press_all.xml` (lista) e a página do comunicado com `ler-pagina.mjs` |
| Taxas do BCE | `https://data-api.ecb.europa.eu/service/data/<fluxo>/<chave>?lastNObservations=1&format=csvdata` |
| Eurostat | `https://ec.europa.eu/eurostat/api/dissemination/` (SDMX/JSON) |
| OCDE (inflação, PIB, emprego de vários países) | `https://sdmx.oecd.org/public/rest/data/...&format=csvfilewithlabels` |
| Banco Mundial | `https://api.worldbank.org/v2/country/<ISO2>/indicator/<codigo>?format=json&mrnev=1` |
| FMI (páginas de publicações) | `ler-pagina.mjs` abre; a API `datamapper` recusa robôs |
| Tesouro dos EUA (OFAC), BEA, EIA, OPEP, ONU (OCHA), AIEA | `ler-pagina.mjs` |
| Potências e organismos que abrem (testado em 19/10/2026) | `ler-pagina.mjs` ou `curl`: gov.uk, ONS, Banco da Inglaterra, Bundesbank, Destatis, Insee, Banca d'Italia, Istat, Banco Central da Rússia (`cbr.ru/eng`), Casa Branca, OFAC (`ofac.treasury.gov`), OCHA, Banco do Japão, Banco Popular da China, OMC, `stats.gov.cn` (home) |
| Potências e organismos que recusam robôs ou não respondem (não contornar) | Banco da França (`banque-france.fr`, Access Denied), AIEA (`iaea.org`, verificação "Just a moment"), Conselho da UE (`consilium.europa.eu`, "Browser check"), EUR-Lex (`eur-lex.europa.eu`, desafio 202 sem conteúdo), Kremlin (`kremlin.ru`, conexão recusada), Parlamento Europeu e páginas `un.org/securitycouncil` (desafio 202). Alternativas na tabela abaixo. |

### Alternativas para o que não abre (testado em 19/10/2026)

| Em vez de | Use | Observação |
| --- | --- | --- |
| Banco da França | `https://webstat.banque-france.fr/api/explore/v2.1/catalog/datasets?limit=5` (API aberta, JSON, séries de inflação, crédito e balanço), BCE (`data-api.ecb.europa.eu`) e Insee | Os comunicados do Banco da França em si continuam fechados. |
| AIEA (páginas) | Feed `https://www.iaea.org/feeds/topnews` (RSS, títulos e links), comunicados da ONU em `press.un.org/en`, e declarações de governos em gov.uk | O feed aponta o que a AIEA publicou, mas as páginas das notícias e dos relatórios não abrem; um fato nuclear só entra se um documento aberto o confirmar, atribuído ("segundo a AIEA, citada pela ONU"). |
| Conselho da UE e EUR-Lex (sanções) | API da sala de imprensa da Comissão: `https://ec.europa.eu/commission/presscorner/api/latestnews?language=en&pagesize=10` (JSON), `finance.ec.europa.eu` (página de sanções), `commission.europa.eu` | Ato jurídico em si (regulamento) pode não abrir; cite o comunicado da Comissão. |
| Kremlin e ministérios russos | Banco Central da Rússia (`cbr.ru/eng`), OFAC e gov.uk para sanções, ONU | Domínios `mid.ru`, `government.ru`, `minfin.gov.ru` e `rosstat.gov.ru` dependem de liberação na rede do ambiente (hoje recusados pelo proxy). |
| Lado ucraniano, iraniano, russo, OTAN, EUA e governos europeus (testado em 19/10/2026, depois da liberação) | **Abrem:** OTAN (`nato.int`), governo alemão (`bundesregierung.de/breg-en`), Casa Branca. **Abrem a conexão, mas o site recusa robôs (não contornar):** Departamento de Estado (`state.gov`), Defesa dos EUA (`defense.gov`), Presidência da Ucrânia (`president.gov.ua`), Ministério das Relações Exteriores da Ucrânia (`mfa.gov.ua`, Cloudflare), Ministério das Relações Exteriores da Rússia (`mid.ru`, "Request Rejected"), Ministério da Economia da França (`economie.gouv.fr`, "Just a moment"). **Ainda bloqueados pelo proxy do ambiente (não liberados):** `government.ru`, `minfin.gov.ru`, `rosstat.gov.ru`, `bank.gov.ua`, `gouvernement.fr`, `mod.gov.ua`, `kmu.gov.ua`. **Sem resposta (conexão derrubada pelo próprio servidor):** Irã (`president.ir`, `mfa.ir`, `cbi.ir`) e Kremlin. | Para neutralidade, as duas partes de um conflito precisam ter fonte oficial aberta. Hoje, do lado ucraniano e do russo, nenhum site de governo abre para robôs; Rússia entra pelo Banco Central (`cbr.ru/eng`) e Ucrânia só por terceiros oficiais (ONU, OTAN, governos aliados), sempre atribuídos. Texto que dependa da versão de uma das partes, sem fonte aberta, vai como rascunho. |


## O que bloqueia robôs (não contornar)

| Fonte | O que fazer |
| --- | --- |
| `bls.gov` (páginas) | Recusa robôs de propósito. A API `api.bls.gov` responde, mas o limite diário do ambiente costuma estar esgotado. Para inflação e PIB dos EUA, use o BEA e o Fed; se o dado for só do BLS, fica **sem conferência**. |
| `www.ibge.gov.br` e `agenciadenoticias.ibge.gov.br` | Use a API `servicodados.ibge.gov.br` (acima), que traz o link da notícia original. Cite o link da agência em `fontes:` só depois de ler o conteúdo pela API. |
| `reuters.com`, `apnews.com`, `afp.com` | Recusam robôs (vale também para guerra e política: sem as duas agências, o fato só entra por documento oficial, e senão vai como rascunho) (401 ou 403). Para fatos políticos e de guerra, a exigência de duas agências pode não ser cumprível: o texto vai como rascunho e o pull request diz o que faltou. |
| `oecd.org`, `iea.org` (páginas) | Use a API da OCDE (acima); da AIE, só o que o `ler-pagina.mjs` conseguir abrir. |
| `api.bcb.gov.br` (séries SGS) | Sem resposta neste ambiente. Use os endereços do BC acima. |

## Regra de ouro

Se nenhuma das vias abrir a fonte primária, o dado fica **sem conferência**: o texto vai com `draft: true` e o pull request diz o que faltou. Nunca preencha com o que "provavelmente" é.

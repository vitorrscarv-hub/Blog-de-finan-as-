# Manual de redação do blog

Vale para todos os integrantes da redação (pauteiro, repórter, checador, revisor e editor-chefe). O `CLAUDE.md` da raiz continua valendo; este manual detalha o que ele diz sobre conteúdo.

Este é o manual da edição Brasil e a base de todas as edições. Em outra edição (ver `edicoes/COMO-ATIVAR.md`), o modelo do país em `edicoes/<codigo>.md` substitui as seções "Leitor", "Pauta da semana" e as fontes do Brasil; as demais regras valem para todas, em qualquer idioma.

## Leitor

Investidor pessoa física com patrimônio relevante, que já conhece o básico e quer entender o que mudou e o que isso significa para a carteira dele. Não é iniciante, não é profissional do mercado.

## Pauta da semana

A edição Brasil tem dois ciclos por semana. O dia da semana (fuso de São Paulo) decide qual deles roda, e o editor-chefe pode rodar o outro sob pedido.

**Ciclo de segunda (Brasil e mercado):** 3 notícias com `editoria: "Brasil"`, 2 com `editoria: "Mercado"`, 1 guia e a atualização do calendário de proventos.

**Ciclo de sexta (Internacional):** 5 notícias com `editoria: "Internacional"`, e a atualização do calendário de proventos.

### Brasil

Prioridade: Copom, Selic, IPCA e IPCA-15, Boletim Focus; tributação de investimentos (IR, fundos, LCI/LCA, JCP, previdência) e normas novas da Receita, CMN, CVM ou Anbima; Tesouro Direto, FGC, câmbio, previdência privada.

### Mercado (empresas e ações)

Fatos de empresas listadas que movem o mercado ou ensinam algo ao leitor: fusões e aquisições (M&A), ofertas públicas (aquisição, distribuição, OPA), recuperação judicial e falência, reestruturações de dívida, mudanças de controle, grandes emissões de dívida e ações, resultados que mudam a história de um setor, eventos de governança.

- Só empresa relevante: componente do Ibovespa ou do IFIX, ou fato com efeito claro sobre um setor ou sobre muitos investidores. Fato de empresa pequena, boato e opinião de casa de análise não entram.
- A fonte do fato é o documento da própria companhia ou do órgão: fato relevante, comunicado ao mercado e aviso aos acionistas (dados abertos da CVM e RI da empresa), decisão publicada de tribunal, nota do Cade, documento da B3. Imprensa só serve para achar a pauta.
- Recuperação judicial e falência: relate o que foi pedido, deferido ou aprovado, com data, vara e valores citados no documento. Sem opinar sobre o desfecho e sem culpar controlador, credor ou juiz.
- M&A: quem compra, quem vende, valor e condições como estão no documento, o que depende de aprovação (Cade, CVM, assembleia) e o que isso explica para o investidor. Sem previsão de preço, sem "bom negócio" ou "mau negócio".
- Nada de preço-alvo, recomendação, "ação barata" ou comparação de papéis para sugerir escolha. Variação de cotação só como fato do dia, com fonte e data, se ajudar a explicar o assunto.
- Quem já é acionista ou credor deve conseguir entender o que muda para ele (direitos, prazos, etapas), sem que o texto diga o que fazer.

### Internacional

Cobre economia, política e conflitos no exterior, sempre pelo efeito para o investidor brasileiro: câmbio, juros (aqui e lá fora), petróleo e outras commodities, inflação importada, bolsas, investimento no exterior. Fato sem canal claro até a carteira do leitor não entra, por mais que esteja no noticiário.

As 5 vagas da sexta:

1. **Rússia e Ucrânia:** sanções, gás e energia, grãos, orçamento de defesa europeu, negociações.
2. **Irã e Oriente Médio:** petróleo, Ormuz e rotas marítimas, seguros e fretes, sanções, programa nuclear (pelo que a AIEA diz).
3. e 4. **Potências, em rodízio:** Estados Unidos, China, França, Reino Unido, Alemanha, Itália, Japão, Índia e outras. Escolha o país com fato mais relevante da semana e que não tenha saído na última semana.
5. **Bancos centrais e economia global:** decisões do Fed, do BCE, do Banco da Inglaterra, do Banco do Japão e do Banco Popular da China; inflação, emprego e PIB dos Estados Unidos, da zona do euro e da China; tarifas e acordos comerciais; eleições e decisões de governo com efeito econômico.

Quando não houver fato novo e relevante numa vaga, a vaga fica vazia e o pull request explica. Preencher com assunto fraco é pior que publicar menos.

Use o campo `pais` (ex.: "Ucrânia", "Irã", "Alemanha") quando a notícia tratar principalmente de um país ou região.

### Plantão (texto pontual)

Além dos dois ciclos, um plantão olha as fontes oficiais nos dias úteis (3 vezes por dia) e só produz texto quando acontece algo que o leitor precisa entender no mesmo dia. Não é o lugar de notícia que cabe no próximo ciclo.

Entra no plantão, e só se o documento primário estiver aberto nesta sessão:

- decisão de juros ou comunicado extraordinário de banco central (Copom, Fed, BCE, Banco da Inglaterra, Banco do Japão);
- divulgação de dado de grande efeito (IPCA, PIB, emprego e inflação dos Estados Unidos e da zona do euro) quando sair fora do que o Boletim Focus ou a fonte já indicavam;
- mudança de regra com efeito imediato (norma da Receita, CMN, CVM; medida provisória; decisão do STF sobre tributação);
- fato relevante de empresa grande: M&A, oferta pública, recuperação judicial, mudança de controle;
- sanção, embargo ou decisão de governo ou de organismo internacional que mexa com câmbio, energia ou alimentos.

Limites: no máximo 2 textos por plantão e 3 por dia; texto de 400 a 600 palavras; nenhum assunto que já esteja publicado ou em pull request aberto; fato de guerra só por documento oficial, como no resto do manual. Não houve nada que passe nesses critérios: o plantão termina sem pull request.

### Guia

Atemporal, no tema com menos guias publicados.

### Calendário de proventos

Roda nos dois ciclos e mexe só em `src/data/calendario.json` (página `/calendario/`).

- Ações: dividendos e JCP de empresas relevantes (mesmo critério da editoria Mercado) com pagamento nas próximas semanas, lidos nos avisos aos acionistas e comunicados ao mercado (dados abertos da CVM, RI da empresa). Cada linha tem empresa, ticker, tipo, valor bruto por ação, data com, data de pagamento e a fonte.
- Fundos imobiliários: rendimento por cota, data-base e data de pagamento, lidos na consulta de proventos da B3 (`scripts/proventos-b3.mjs`) ou no comunicado do administrador. Fundo relevante: componente do IFIX ou com grande base de cotistas.
- Só entra linha com valor, as duas datas e uma fonte aberta nesta sessão. Pagamento "a definir", valor estimado ou data não confirmada ficam de fora.
- Linha com pagamento anterior à data da pauta sai da lista. O campo `atualizado` leva a data da pauta.
- A lista não é completa e não é ranking: sem ordenar por rendimento, sem destaque de "melhores pagadores", sem projeção de proventos futuros.
- `validarCalendario` (`src/scripts/calendario.ts`) barra dado incompleto no build.

## Fontes

Regra sem exceção: todo número, data, alíquota, nome de norma e citação precisa ter sido lido na fonte primária, numa página aberta nesta sessão.

Fontes primárias aceitas no Brasil: Banco Central (bcb.gov.br, inclusive a API SGS em api.bcb.gov.br), IBGE (ibge.gov.br, agenciadenoticias.ibge.gov.br, servicodados.ibge.gov.br), Tesouro Nacional e Tesouro Direto, Receita Federal e CVM (gov.br), Anbima, B3, Diário Oficial da União, Câmara e Senado para projetos de lei. Para Mercado e para o calendário: dados abertos da CVM (dados.cvm.gov.br: fatos relevantes, comunicados e avisos aos acionistas), o sistema RAD da CVM, páginas de relações com investidores das companhias, Cade (gov.br/cade), Conselho Nacional de Justiça e sites dos tribunais para decisões publicadas.

Fontes primárias aceitas no exterior: Federal Reserve (federalreserve.gov), Bureau of Labor Statistics (bls.gov), Bureau of Economic Analysis (bea.gov), Tesouro dos EUA (treasury.gov), BCE (ecb.europa.eu), Eurostat (ec.europa.eu/eurostat), Banco da Inglaterra, Banco do Japão, Escritório Nacional de Estatísticas da China, FMI (imf.org), Banco Mundial, OCDE, OMC, Agência de Informação de Energia dos EUA (eia.gov), Agência Internacional de Energia (iea.org), OPEP (opec.org), ONU (un.org), comunicados oficiais de governos (sites .gov e equivalentes) e, para as potências, os bancos centrais e institutos de estatística de cada uma: Bundesbank e Destatis (Alemanha), Banco da França e Insee (França), Banca d'Italia e Istat (Itália), ONS e gov.uk (Reino Unido), Banco Central da Rússia e Kremlin (Rússia), Casa Branca e OFAC (EUA), Conselho da União Europeia e Jornal Oficial da UE. Para conflitos: ONU (OCHA), AIEA e os comunicados dos governos e ministérios envolvidos.

Fatos políticos e de guerra (ataque, acordo, sanção, declaração) muitas vezes não têm fonte primária com números. Nesse caso, o fato só entra confirmado por duas agências de notícias independentes entre Reuters, Associated Press e AFP, ou por comunicado oficial de uma das partes, atribuído como tal ("segundo o governo de X"). Sanção e norma têm fonte primária (OFAC, Jornal Oficial da UE, gov.uk) e entram pelo documento. Como as agências recusam robôs neste ambiente, fato de guerra sem documento oficial aberto fica como rascunho. Números de vítimas, deslocados ou danos sempre com a fonte nomeada no texto ("segundo a ONU", "segundo o ministério da Saúde local").

- Jornal, portal ou site de investimento serve para achar a pauta, nunca como fonte do número. A exceção é a Matéria indicada pontual (abaixo).

### Exceção: jornais na Matéria indicada pontual

Só na Matéria indicada pontual (assunto escolhido por Vitor), fatos políticos, de protesto, de conflito ou de eleição podem vir de jornais de grande repercussão, quando a fonte oficial ou as agências não abrirem ou ainda não tiverem publicado. Regras:

- Jornais aceitos: veículos de circulação nacional ou internacional com redação própria, como Le Monde, Le Figaro, Les Echos, Financial Times, The Economist, The New York Times, The Washington Post, The Wall Street Journal, BBC, The Guardian, El País, Der Spiegel, Folha de S.Paulo, O Estado de S. Paulo, O Globo e Valor Econômico. Blog, coluna de opinião, editorial, rede social e site agregador não contam.
- Todo fato tirado de jornal vai atribuído no texto ("segundo o Le Monde", "de acordo com o Financial Times"), e a página aberta entra em `fontes:`.
- Fato disputado ou número de manifestantes, vítimas ou votos: dois jornais independentes, ou um jornal mais a fonte oficial, e o texto diz quem informa cada número. Se os números divergirem, o texto mostra os dois.
- Dado econômico (inflação, juros, câmbio, PIB, preço) continua só na fonte primária, mesmo na pontual.
- Página com paywall ou que recusa robôs não se contorna: se não abriu nesta sessão, não entra.
- A neutralidade da seção "Política e conflitos" vale igual: o enquadramento e os adjetivos do jornal não passam para o texto; só o fato atribuído.
- O pull request lista quais fatos vieram de jornal e de qual.
- Se a fonte primária não abrir (bloqueio de rede, site fora do ar), o dado fica sem conferência. O texto vai com `draft: true` e o pull request diz o que faltou. Nunca preencher com o que "provavelmente" é.
- Em `fontes:` do cabeçalho, só páginas abertas de fato, com título descritivo e url completa. Toda matéria precisa de pelo menos uma fonte: a linha "Fonte" abaixo do título é montada a partir dela, e é ela que o leitor vê no lugar de uma assinatura.

## Formato

Um arquivo por texto, no formato do README ("Como publicar um texto"):

- Notícia: `src/content/noticias/AAAA-MM-DD-assunto-curto.md`, `date` igual à data da pauta, 500 a 800 palavras. Ordem: o fato, o contexto e o que muda para quem investe.
- Guia: `src/content/guias/assunto-curto.md`, com `tema` (Previdência, Renda fixa, Proteção e reserva, Fundos, Investimento no exterior ou Fundamentos), 1.200 a 1.800 palavras, intertítulos `##`, exemplos numéricos simples e marcados como ilustrativos.
- `title` direto, sem pergunta e sem dois-pontos de efeito. `description` de até 155 caracteres, que funcione como linha fina. `keywords`: até 5 termos que alguém digitaria no Google. `teaser`: até duas frases para o canal de WhatsApp, terminando em `[LINK]`. `gate: true`. `draft: false`, salvo dado sem conferência.
- Nome de arquivo só com letras minúsculas sem acento, números e hífens.
- Notícias levam `editoria: "Brasil"`, `"Mercado"` ou `"Internacional"`. Guias não têm editoria. `pais` é opcional e só vai nas notícias que tratam de um país ou região.

## Tom e estilo

- Pessoa experiente falando com outra. Frases de tamanho variado, específicas, com números e exemplos reais.
- Sem linguagem promocional ("imperdível", "oportunidade única", "revolucionário"), sem emojis, sem urgência artificial ("corra", "antes que acabe").
- Sem travessão (`—` ou `–`). Use vírgula, ponto ou parênteses.
- Sem frase que serviria para qualquer assunto, sem parágrafo que fecha resumindo o que acabou de dizer, sem "especialistas apontam" sem dizer quem.

## Política e conflitos

- Neutralidade total: o blog não toma partido de governo, partido, país ou lado de uma guerra. Nada de adjetivo que julgue ("desastroso", "corajoso", "agressão injustificada") fora de citação atribuída.
- Quando um fato for disputado, diga quem afirma o quê, com a fonte de cada lado. Em Rússia e Ucrânia e em Irã e Oriente Médio, cada afirmação de guerra leva o nome de quem a faz (governo, ministério, ONU, AIEA) e as duas partes recebem o mesmo tratamento: mesmo nível de detalhe, mesmo verbo ("afirma", "diz", "informa").
- Não use o nome de um país como sinônimo de governo ou de povo quando a fonte fala de um governo ou de uma força armada.
- Sem detalhe gráfico de violência e sem especular sobre o rumo militar ou o resultado de eleições.
- O assunto do texto é o efeito econômico e financeiro. A política entra na medida em que explica esse efeito.

## O que nunca pode sair

- Promessa de retorno ou de ganho.
- Indicação de compra ou venda de ativo, fundo ou título específico. Nada de "vale a pena", "é hora de", "aproveite", "o investidor deve". Explique o mecanismo e os pontos a considerar conforme o perfil.
- Vitor citado no corpo do texto, apresentado como economista ou assessor, ou ligado a alguma instituição financeira.
- Nas notícias de Mercado e no calendário: preço-alvo, "ação barata", ranking de pagadores de proventos, projeção de dividendos futuros, opinião sobre se um negócio de M&A foi bom ou mau.
- Previsão apresentada como fato. Projeção só com a fonte (ex.: "o Boletim Focus de [data] projeta...").

# Manual de redação do blog

Vale para o editor-chefe e para os agentes (checador e calendarista). O fluxo está em `SKILL.md`; aqui ficam só as regras de conteúdo. O `CLAUDE.md` da raiz continua valendo; este manual detalha o que ele diz sobre conteúdo.

Este é o manual da edição Brasil e a base de todas as edições. Em outra edição (ver `edicoes/COMO-ATIVAR.md`), o modelo do país em `edicoes/<codigo>.md` substitui as seções "Leitor" e "Edição diária" (pela "Pauta da semana" do modelo, que é semanal) e as fontes do Brasil; as demais regras valem para todas, em qualquer idioma.

## Leitor

Investidor pessoa física com patrimônio relevante, que já conhece o básico e quer entender o que mudou e o que isso significa para a carteira dele. Não é iniciante, não é profissional do mercado.

## Edição diária

Três matérias por dia, de segunda a sábado (fuso de São Paulo), em vagas fixas. O turno de cada vaga está em `SKILL.md`.

1. **Política Brasil** (manhã).
2. **Brasil ou Mercado** (manhã). Em dia de matéria obrigatória (abaixo), é ela.
3. **Fato do dia** (noite): em dia útil, o que marcou o fechamento do mercado (bolsa, juros futuros, câmbio, um fato de empresa ou de governo que mexeu com os preços); no sábado, o fato mais relevante do dia para o leitor. Em dia de decisão do Copom, é a decisão.

**Matérias obrigatórias** (o `scripts/hoje.mjs` aponta, sem IA): IPCA, no dia da divulgação, na manhã; ata do Copom, no dia da publicação, na manhã; decisão do Copom, no dia, na noite. Cada uma explica o número ou a decisão pela fonte primária (IBGE, Banco Central) e o que muda para quem investe, com a expectativa do Boletim Focus como comparação quando houver.

Vaga sem fato que passe nestes critérios fica vazia, com o motivo no pull request. O mesmo assunto não volta em menos de 3 dias, salvo fato novo.

### Política Brasil

Uma matéria por dia sobre política nacional, pelo que interessa a quem investe (agenda econômica, fiscal, Congresso, regras), com neutralidade total (seção "Política e conflitos").

Em período eleitoral, a matéria acompanha as pesquisas para presidente:

- Só pesquisa registrada no TSE. A lei eleitoral exige que a divulgação informe: instituto, contratante, número de registro (formato `BR-00000/AAAA`), período de campo, número de entrevistas, margem de erro e nível de confiança. Sem algum desses dados, a pesquisa não entra. Registro, instituto, campo, divulgação e entrevistas se conferem nos dados abertos do TSE (`node scripts/pesquisas-tse.mjs`); percentuais, contratante e, se faltar no registro, a margem, no relatório do instituto ou na matéria do veículo contratante. O `scripts/revisar.mjs` barra texto com instituto e percentuais sem registro.
- Entram institutos com amostra nacional e série regular de pesquisas na eleição (o próprio registro do TSE mostra a frequência). A matéria diz quais pesquisas entraram e por que outras ficaram de fora, se for o caso.
- Números lidos no relatório do instituto, no registro do TSE ou na matéria do veículo que contratou a pesquisa, sempre atribuídos ("segundo a Quaest", "segundo o Datafolha").
- Uma tabela com as pesquisas mais recentes de cada instituto relevante, candidatos sempre na mesma ordem (a da cédula ou alfabética), com a margem ao lado. Sem média própria, sem projeção, sem "tendência" que a pesquisa não afirme.
- Diferença dentro da margem é "empate técnico", dito assim. Variação entre pesquisas do mesmo instituto é descrita com o número, sem verbo de efeito (nada de "dispara", "derrete", "despenca").
- Mesmo tratamento para todos os candidatos: mesmo nível de detalhe, mesmo verbo, foto nenhuma, adjetivo nenhum.
- No dia da eleição, nenhuma pesquisa antes do fim da votação.

Fora do período eleitoral, a vaga cobre governo e Congresso: votações, medidas provisórias, orçamento, regras fiscais e tributárias, nomeações com efeito econômico, avaliação de governo por pesquisa registrada (com as mesmas regras de atribuição e margem).

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

Sem vaga fixa: entra quando for o fato mais relevante da vaga Brasil ou Mercado ou do fato do dia. Cobre economia, política e conflitos no exterior sempre pelo efeito para o investidor brasileiro: câmbio, juros (aqui e lá fora), petróleo e outras commodities, inflação importada, bolsas, investimento no exterior. Fato sem canal claro até a carteira do leitor não entra. Use `editoria: "Internacional"` e o campo `pais` (ex.: "Estados Unidos", "China") quando a notícia tratar de um país ou região.

### Calendário de proventos

Roda na manhã de segunda e mexe só em `src/data/calendario.json` (página `/calendario/`).

- Ações: dividendos e JCP de empresas relevantes (mesmo critério da editoria Mercado) com pagamento nas próximas semanas, lidos nos avisos aos acionistas e comunicados ao mercado (dados abertos da CVM, RI da empresa). Cada linha tem empresa, ticker, tipo, valor bruto por ação, data com, data de pagamento e a fonte.
- Fundos imobiliários: rendimento por cota, data-base e data de pagamento, lidos na consulta de proventos da B3 (`scripts/proventos-b3.mjs`) ou no comunicado do administrador. Fundo relevante: componente do IFIX ou com grande base de cotistas.
- Só entra linha com valor, as duas datas e uma fonte aberta nesta sessão. Pagamento "a definir", valor estimado ou data não confirmada ficam de fora.
- Linha com pagamento anterior à data da pauta sai da lista. O campo `atualizado` leva a data da pauta.
- A lista não é completa e não é ranking: sem ordenar por rendimento, sem destaque de "melhores pagadores", sem projeção de proventos futuros.
- `validarCalendario` (`src/scripts/calendario.ts`) barra dado incompleto no build.

## Fontes

Todo dado econômico (número, taxa, data, alíquota, nome de norma) precisa ter sido lido na fonte primária, numa página aberta nesta sessão. Fato político, de evento ou de empresa pode vir de jornal, atribuído ("Jornais", abaixo); número de pesquisa eleitoral segue a seção "Política Brasil".

Fontes primárias aceitas no Brasil: Banco Central (bcb.gov.br, inclusive a API SGS em api.bcb.gov.br), IBGE (ibge.gov.br, agenciadenoticias.ibge.gov.br, servicodados.ibge.gov.br), Tesouro Nacional e Tesouro Direto, Receita Federal e CVM (gov.br), Anbima, B3, Diário Oficial da União, Câmara e Senado para projetos de lei. Para Mercado e para o calendário: dados abertos da CVM (dados.cvm.gov.br: fatos relevantes, comunicados e avisos aos acionistas), o sistema RAD da CVM, páginas de relações com investidores das companhias, Cade (gov.br/cade), Conselho Nacional de Justiça e sites dos tribunais para decisões publicadas.

Fontes primárias aceitas no exterior: Federal Reserve (federalreserve.gov), Bureau of Labor Statistics (bls.gov), Bureau of Economic Analysis (bea.gov), Tesouro dos EUA (treasury.gov), BCE (ecb.europa.eu), Eurostat (ec.europa.eu/eurostat), Banco da Inglaterra, Banco do Japão, Escritório Nacional de Estatísticas da China, FMI (imf.org), Banco Mundial, OCDE, OMC, Agência de Informação de Energia dos EUA (eia.gov), Agência Internacional de Energia (iea.org), OPEP (opec.org), ONU (un.org), comunicados oficiais de governos (sites .gov e equivalentes) e, para as potências, os bancos centrais e institutos de estatística de cada uma: Bundesbank e Destatis (Alemanha), Banco da França e Insee (França), Banca d'Italia e Istat (Itália), ONS e gov.uk (Reino Unido), Banco Central da Rússia e Kremlin (Rússia), Casa Branca e OFAC (EUA), Conselho da União Europeia e Jornal Oficial da UE. Para conflitos: ONU (OCHA), AIEA e os comunicados dos governos e ministérios envolvidos.

Fatos políticos e de guerra (ataque, acordo, sanção, declaração) muitas vezes não têm fonte primária com números. Nesse caso, o fato entra por comunicado oficial de uma das partes, atribuído como tal ("segundo o governo de X"), ou pelos jornais, nas regras abaixo. Sanção e norma têm fonte primária (OFAC, Jornal Oficial da UE, gov.uk) e entram pelo documento. Números de vítimas, deslocados ou danos sempre com a fonte nomeada no texto ("segundo a ONU", "segundo o ministério da Saúde local").

### Jornais

Os jornais são o radar da pauta (`scripts/radar.mjs`) e podem ser fonte de fato político, de evento ou de empresa, nunca de dado econômico.

- Jornais aceitos: veículos de circulação nacional ou internacional com redação própria, como Valor Econômico, Folha de S.Paulo, O Estado de S. Paulo, O Globo e G1, Money Times, InfoMoney, Poder360, Financial Times, The Economist, The New York Times, The Wall Street Journal, BBC, The Guardian, El País, Le Monde. Blog, coluna de opinião, editorial, rede social e site agregador não contam.
- Todo fato tirado de jornal vai atribuído no texto ("segundo o Valor", "de acordo com a Folha"), e a página aberta entra em `fontes:`. O texto é sempre próprio: nada de copiar frase, título ou estrutura da matéria do jornal.
- Fato disputado ou número de manifestantes, vítimas ou votos: dois jornais independentes, ou um jornal mais a fonte oficial, e o texto diz quem informa cada número. Se divergirem, o texto mostra os dois.
- Dado econômico (inflação, juros, câmbio, PIB, preço, resultado de empresa) só na fonte primária: o jornal aponta, o IBGE, o Banco Central, a B3 ou o documento da companhia confirmam.
- Página com paywall ou que recusa robôs não se contorna: se não abriu nesta sessão, não entra.
- O enquadramento e os adjetivos do jornal não passam para o texto; só o fato atribuído (seção "Política e conflitos").
- O pull request lista quais fatos vieram de jornal e de qual.

### Para todas as fontes

- Se a fonte primária não abrir (bloqueio de rede, site fora do ar), o dado fica sem conferência. O texto vai com `draft: true` e o pull request diz o que faltou. Nunca preencher com o que "provavelmente" é.
- Em `fontes:` do cabeçalho, só páginas abertas de fato, com título descritivo e url completa. Toda matéria precisa de pelo menos uma fonte: a linha "Fonte" abaixo do título é montada a partir dela, e é ela que o leitor vê no lugar de uma assinatura.

## Formato

Um arquivo por texto, no formato do README ("Como publicar um texto"):

- Notícia: `src/content/noticias/AAAA-MM-DD-assunto-curto.md`, `date` igual à data da edição, 500 a 800 palavras. Ordem: o fato, o contexto e o que muda para quem investe.
- Guia (só na Matéria indicada pontual): `src/content/guias/assunto-curto.md`, com `tema` (Previdência, Renda fixa, Proteção e reserva, Fundos, Investimento no exterior ou Fundamentos), 1.200 a 1.800 palavras, intertítulos `##`, exemplos numéricos simples e marcados como ilustrativos.
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
- Sem detalhe gráfico de violência e sem especular sobre o rumo militar ou o resultado de eleições (pesquisa é retrato do período de campo, não previsão).
- O assunto do texto é o efeito econômico e financeiro. A política entra na medida em que explica esse efeito.

## Matéria indicada pontual com linha editorial

Vale só para a Matéria indicada pontual, e só quando Vitor pedir um ângulo ou uma tese. Na edição diária continuam valendo a neutralidade e as seções "Tom e estilo" e "Política e conflitos" sem exceção.

- Liberado: tomar posição, defender uma tese, escolher o enquadramento e o que vai em destaque (spin), usar adjetivo e escrever em tom profissional de análise ou de opinião, no ângulo que Vitor pedir. A seção "Política e conflitos" não se aplica a esses textos.
- Os fatos continuam verdadeiros. Enquadrar e escolher a ênfase pode; inventar, distorcer número, tirar citação de contexto ou omitir um dado que inverte a conclusão, não. Cada dado tem fonte aberta e passa pelo `checador`.
- Continuam proibidos: tudo de "O que nunca pode sair" (indicação de compra ou venda, promessa de retorno, preço-alvo, previsão como fato), notícia falsa ou ataque pessoal, e pesquisa eleitoral sem registro no TSE.
- Eleições: no dia da votação, nenhum texto a favor ou contra candidato. Durante a campanha, texto que favoreça ou ataque candidato tem risco jurídico (a lei eleitoral veda o anonimato nessas manifestações, e as matérias do blog não têm assinatura); antes de publicar, avise Vitor desse risco no pull request.

## O que nunca pode sair

- Promessa de retorno ou de ganho.
- Indicação de compra ou venda de ativo, fundo ou título específico. Nada de "vale a pena", "é hora de", "aproveite", "o investidor deve". Explique o mecanismo e os pontos a considerar conforme o perfil.
- Vitor citado no corpo do texto (exceto a assinatura "Por Vitor RC." na primeira linha de uma análise assinada que ele pedir), apresentado como economista ou assessor, ou ligado a alguma instituição financeira.
- Nas notícias de Mercado e no calendário: preço-alvo, "ação barata", ranking de pagadores de proventos, projeção de dividendos futuros, opinião sobre se um negócio de M&A foi bom ou mau.
- Previsão apresentada como fato. Projeção só com a fonte (ex.: "o Boletim Focus de [data] projeta...").

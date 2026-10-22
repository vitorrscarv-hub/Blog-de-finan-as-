# Edição China (inativa)

Complementa o manual comum (`../manual-de-redacao.md`). Nesta edição, as seções abaixo substituem "Leitor", "Edição diária" (por esta pauta semanal) e as fontes do Brasil; o resto do manual comum vale igual, adaptado ao chinês simplificado.

## Situação

Inativa, e com a maior barreira de todas. Publicar notícias para leitores na China continental exige licença de serviço de informação noticiosa na internet, que na prática não é concedida a empresas estrangeiras, além de registro de hospedagem (ICP) para sites servidos de dentro do país. Sites hospedados fora podem ser bloqueados sem aviso.

Antes de investir nesta edição, avaliar alternativas: uma edição em chinês tradicional para Hong Kong, Taiwan e a diáspora, ou apenas uma cobertura forte sobre a China dentro das outras edições.

## Leitor e idioma

- Investidor individual de língua chinesa com patrimônio relevante.
- Chinês simplificado (zh-CN), com revisão obrigatória por falante nativo. Valores em yuan (¥ ou CNY), com a notação de 万 e 亿 quando for o uso da fonte oficial.
- Neutralidade redobrada: a seção "Política e conflitos" do manual comum vale integralmente, e qualquer tema político sensível exige atenção especial ao risco legal.

## Pauta da semana

- 3 notícias com `editoria: "中国"`, 2 com `editoria: "国际"` e 1 guia.
- Prioridade nacional: decisões do Banco Popular da China (LPR, compulsório), CPI e PIB do NBS, dados de comércio exterior, políticas do CSRC para o mercado de capitais, câmbio do yuan e controles de capital.
- Guias: depósitos e títulos do governo, fundos (sem citar fundo específico), regras de investimento no exterior, previdência pessoal.

## Fontes primárias

- Banco Popular da China (pbc.gov.cn)
- National Bureau of Statistics (stats.gov.cn)
- China Securities Regulatory Commission (csrc.gov.cn)
- State Administration of Foreign Exchange (safe.gov.cn)
- Ministério das Finanças (mof.gov.cn) e Ministério do Comércio (mofcom.gov.cn)
- Bolsas de Xangai (sse.com.cn) e Shenzhen (szse.cn)

## Regulação de conteúdo financeiro

- Além da licença de notícias citada acima, conteúdo sobre valores mobiliários e consultoria de investimento é regulado pelo CSRC. A confirmar com escritório especializado em direito chinês antes de qualquer decisão.

## Dados pessoais e cadastro

- PIPL (Lei de Proteção de Informações Pessoais) e regras de transferência internacional de dados, que podem exigir avaliação de segurança ou contrato padrão para enviar cadastros a servidores fora da China.
- WhatsApp não é usado na China; o canal equivalente seria WeChat, com regras próprias. O formulário precisaria trocar o campo de WhatsApp.

## Aviso legal (rascunho para revisão jurídica local)

> 本内容仅供信息和教育参考，不构成任何投资建议，也不构成买卖任何证券或金融产品的推荐。过往业绩不代表未来表现。投资有风险，请根据自身情况审慎决策，必要时咨询持牌专业人士。

## Domínios para liberar na rede

`pbc.gov.cn`, `stats.gov.cn`, `csrc.gov.cn`, `safe.gov.cn`, `mof.gov.cn`, `mofcom.gov.cn`, `sse.com.cn`, `szse.cn`

Alguns desses sites podem não responder a acessos de fora da China.

## Antes de ativar (pendências específicas)

- [ ] Parecer de escritório especializado sobre licença de notícias, ICP e regulação do CSRC; decidir entre China continental, chinês tradicional ou desistir da edição.
- [ ] Política de privacidade no padrão PIPL e solução para transferência internacional de dados.
- [ ] Trocar WhatsApp por canal adequado no formulário e em `functions/api/lead.js`.
- [ ] Tradução e revisão de toda a interface por falante nativo.

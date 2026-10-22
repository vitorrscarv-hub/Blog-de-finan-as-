# Edição Índia (inativa)

Complementa o manual comum (`../manual-de-redacao.md`). Nesta edição, as seções abaixo substituem "Leitor", "Edição diária" (por esta pauta semanal) e as fontes do Brasil; o resto do manual comum vale igual, adaptado ao inglês.

## Situação

Inativa. Mercado de investidores pessoa física que cresce rápido, mas com regulação recente e rígida sobre quem fala de investimento na internet. Precisa de parecer jurídico antes de ativar.

## Leitor e idioma

- Investidor individual indiano com patrimônio relevante, que já conhece o básico.
- Inglês indiano (grafia britânica). Valores em rupias (₹) com a notação local de lakh e crore quando for o uso corrente da fonte oficial; na primeira menção, explicar a conversão. Uma edição em hindi pode vir depois.
- Sem travessão, como no manual comum.

## Pauta da semana

- 3 notícias com `editoria: "India"`, 2 com `editoria: "World"` e 1 guia.
- Prioridade nacional: decisões do Monetary Policy Committee do RBI (repo rate), CPI do MoSPI, Union Budget, regras novas da SEBI, mudanças no imposto de renda e nos produtos de poupança do governo.
- Guias: Public Provident Fund e outros esquemas de poupança do governo, National Pension System, fundos mútuos (sem citar fundo específico), tributação de ganhos de capital, investir fora da Índia (regras de remessa).

## Fontes primárias

- Reserve Bank of India (rbi.org.in)
- Ministry of Statistics and Programme Implementation (mospi.gov.in)
- Ministry of Finance (finmin.gov.in) e Income Tax Department (incometax.gov.in)
- SEBI (sebi.gov.in)
- NSE (nseindia.com) e BSE (bseindia.com)
- India Code e Gazette of India (egazette.gov.in)

## Regulação de conteúdo financeiro

- Dar conselho de investimento exige registro na SEBI como investment adviser ou research analyst. A SEBI vem endurecendo as regras para criadores de conteúdo financeiro não registrados ("finfluencers"), inclusive restringindo a associação de entidades reguladas com eles e impondo limites a conteúdo dito educacional. A confirmar com advogado indiano: o que exatamente é permitido a uma publicação educacional não registrada, incluindo o uso de dados recentes de preços.
- Nesta edição, além de nunca recomendar compra ou venda, evitar qualquer menção a ação, fundo ou produto específico com dados de desempenho.

## Dados pessoais e cadastro

- Digital Personal Data Protection Act, de 2023, e as regras que o regulamentam. Consentimento livre, específico e informado, com aviso na língua escolhida pelo usuário.
- Mensagens comerciais por telefone seguem regras da TRAI (registro de preferências e consentimento).
- Telefone com código +91 e 10 dígitos. Máscara e validação próprias.

## Aviso legal (rascunho para revisão jurídica local)

> This content is for educational and informational purposes only. It is not investment advice or a research recommendation, and the publisher is not registered with SEBI as an investment adviser or research analyst. It does not recommend buying or selling any security. Investments in securities markets are subject to market risks; past performance does not guarantee future returns. Consult a SEBI-registered professional before investing.

## Domínios para liberar na rede

`rbi.org.in`, `mospi.gov.in`, `finmin.gov.in`, `incometax.gov.in`, `sebi.gov.in`, `nseindia.com`, `bseindia.com`, `egazette.gov.in`

## Antes de ativar (pendências específicas)

- [ ] Parecer de advogado indiano sobre as regras atuais da SEBI para conteúdo financeiro não registrado.
- [ ] Política de privacidade no padrão da DPDP Act.
- [ ] Telefone +91 no formulário e em `functions/api/lead.js`.
- [ ] Revisão dos textos da interface por falante nativo.

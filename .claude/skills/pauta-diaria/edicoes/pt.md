# Edição Portugal (inativa)

Complementa o manual comum (`../manual-de-redacao.md`). Nesta edição, as seções abaixo substituem "Leitor", "Pauta da semana" e as fontes do Brasil; o resto do manual comum vale igual (fontes primárias, neutralidade, tom, o que nunca pode sair).

## Situação

Inativa. É a expansão mais simples: mesma língua, e a política de privacidade atual já segue princípios parecidos com os do RGPD.

## Leitor e idioma

- Investidor particular residente em Portugal, com património relevante, que já conhece o básico.
- Português europeu, com a grafia do Acordo Ortográfico em vigor e o vocabulário local ("depósitos a prazo", "certificados de aforro", "PPR", "IRS", "carteira de títulos"). Evitar termos brasileiros ("Tesouro Direto", "CDB", "Selic") fora de comparação explícita com o Brasil. Revisão por falante nativo antes de ativar.
- Moeda: euro (€), com vírgula decimal e espaço como separador de milhar (1 000,50 €).

## Pauta da semana

- 3 notícias com `editoria: "Portugal"`, 2 com `editoria: "Internacional"` e 1 guia.
- Prioridade Portugal: decisões do BCE e efeito na Euribor e no crédito à habitação; inflação (IPC/IHPC) do INE; Orçamento do Estado e IRS; certificados de aforro e do Tesouro; PPR e fundos; regras novas da CMVM e do Banco de Portugal.
- Guias: IRS sobre rendimentos de capitais, PPR, certificados de aforro e do Tesouro, Euribor e crédito, fundos harmonizados, investir fora da zona euro.

## Fontes primárias

- Banco de Portugal (bportugal.pt, BPstat em bpstat.bportugal.pt)
- INE (ine.pt)
- CMVM (cmvm.pt)
- IGCP, Agência de Gestão da Tesouraria e da Dívida Pública (igcp.pt)
- Portal das Finanças e Autoridade Tributária (portaldasfinancas.gov.pt)
- Diário da República (dre.pt)
- BCE (ecb.europa.eu) e Eurostat (ec.europa.eu/eurostat)
- Euronext Lisbon (euronext.com)

## Regulação de conteúdo financeiro

- Consultoria para investimento é atividade regulada (supervisão da CMVM, regras da DMIF II). Conteúdo informativo e educacional, sem recomendação personalizada, não é consultoria, mas recomendação de investimento publicada por terceiros pode cair no Regulamento de Abuso de Mercado (MAR). Mesma regra de sempre: nunca indicar compra ou venda de instrumento específico.
- A confirmar com advogado em Portugal: enquadramento do blog como publicação jornalística e eventual registo na ERC (Entidade Reguladora para a Comunicação Social).

## Dados pessoais e cadastro

- RGPD e lei portuguesa de execução; autoridade: CNPD (cnpd.pt).
- Comunicações de marketing por e-mail ou mensagens exigem consentimento prévio (regras de comunicações eletrónicas). O formulário atual já pede consentimento expresso.
- WhatsApp: telefone com indicativo +351 e 9 dígitos. A máscara e a validação do formulário precisam de versão própria.

## Aviso legal (rascunho para revisão jurídica local)

> Conteúdo de carácter exclusivamente informativo e educacional. Não constitui consultoria para investimento nem recomendação de compra ou venda de instrumentos financeiros. Rentabilidades passadas não garantem rentabilidades futuras. Avalie qualquer decisão de acordo com o seu perfil e, se necessário, consulte um intermediário financeiro autorizado.

## Domínios para liberar na rede

`bportugal.pt`, `bpstat.bportugal.pt`, `ine.pt`, `cmvm.pt`, `igcp.pt`, `portaldasfinancas.gov.pt`, `dre.pt`, `euronext.com` (BCE e Eurostat já estão na lista internacional).

## Antes de ativar (pendências específicas)

- [ ] Revisão do aviso legal e da política de privacidade por advogado em Portugal.
- [ ] Confirmar se é necessário registo na ERC.
- [ ] Máscara e validação de telefone +351 no formulário e em `functions/api/lead.js`.
- [ ] Revisar os textos da interface em português europeu.

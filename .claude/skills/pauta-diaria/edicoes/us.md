# Edição Estados Unidos (inativa)

Complementa o manual comum (`../manual-de-redacao.md`). Nesta edição, as seções abaixo substituem "Leitor", "Edição diária" (por esta pauta semanal) e as fontes do Brasil; o resto do manual comum vale igual, adaptado ao inglês (fontes primárias, neutralidade, tom, o que nunca pode sair).

## Situação

Inativa. Mercado grande e competitivo; o diferencial do Grafous aqui seria a visão de quem conecta fatos de vários países, inclusive mercados emergentes.

## Leitor e idioma

- Investidor individual americano com patrimônio relevante (o que lá se chama de "affluent" ou "mass affluent"), que já conhece o básico.
- Inglês americano. Datas no formato "October 12, 2026", ponto decimal, vírgula no milhar, dólar ($).
- Tom: o mesmo do manual comum, direto e sem jargão de Wall Street gratuito. Sem travessão também em inglês (o "em dash" é muito comum lá; substituir por vírgula, ponto ou parênteses).

## Pauta da semana

- 3 notícias com `editoria: "United States"`, 2 com `editoria: "World"` e 1 guia.
- Prioridade nacional: decisões e atas do FOMC, CPI e PCE, relatório de emprego (payroll), PIB, rendimento dos Treasuries, mudanças de regra da SEC e do IRS que afetam o investidor (contas IRA e 401(k), tributação de ganhos de capital).
- Guias: Treasuries e I bonds, IRA tradicional e Roth, 401(k), fundos de índice e ETFs (sem citar produto específico), reserva de emergência, investir fora dos EUA.

## Fontes primárias

- Federal Reserve (federalreserve.gov) e FRED, do Fed de St. Louis (fred.stlouisfed.org)
- Bureau of Labor Statistics (bls.gov) e Bureau of Economic Analysis (bea.gov)
- U.S. Treasury (treasury.gov) e TreasuryDirect (treasurydirect.gov)
- SEC (sec.gov), inclusive o EDGAR para documentos de empresas; FINRA (finra.org)
- IRS (irs.gov)
- Congress.gov para projetos de lei; Federal Register (federalregister.gov)

## Regulação de conteúdo financeiro

- Dar conselho de investimento mediante remuneração exige registro como investment adviser. Publicações de circulação geral, regulares e impessoais costumam ficar fora dessa exigência (a chamada exceção do publisher), desde que não deem conselho personalizado. A linha editorial do Grafous (educação, sem recomendação de compra ou venda) é compatível, mas o enquadramento precisa de confirmação com advogado americano.
- Se houver links de afiliado ou patrocínio, as regras da FTC exigem aviso claro e visível.
- Nunca usar linguagem de "garantia" de resultado nem citar desempenho passado sem o aviso.

## Dados pessoais e cadastro

- Não há lei federal geral de privacidade; vale a lei de cada estado (a da Califórnia, CCPA/CPRA, é a referência mais exigente) e, para e-mail, o CAN-SPAM Act (identificação do remetente e descadastro fácil).
- Mensagens de texto e WhatsApp de marketing pedem consentimento prévio e expresso pelas regras da TCPA. O formulário precisa de uma caixa de consentimento própria para mensagens.
- Telefone com código +1 e 10 dígitos. A máscara e a validação precisam de versão própria.

## Aviso legal (rascunho para revisão jurídica local)

> This content is for informational and educational purposes only and is not investment, tax, or legal advice. It does not recommend buying or selling any security. Past performance does not guarantee future results. Consider your own financial situation and objectives, and consult a licensed professional before making investment decisions.

## Domínios para liberar na rede

`federalreserve.gov`, `fred.stlouisfed.org`, `bls.gov`, `bea.gov`, `treasury.gov`, `treasurydirect.gov`, `sec.gov`, `finra.org`, `irs.gov`, `congress.gov`, `federalregister.gov`

## Antes de ativar (pendências específicas)

- [ ] Parecer de advogado americano sobre a exceção do publisher e sobre o aviso legal.
- [ ] Política de privacidade adaptada (CCPA/CPRA e direitos de residentes de outros estados).
- [ ] Consentimento separado para mensagens (TCPA) e telefone +1 no formulário e em `functions/api/lead.js`.
- [ ] Revisão dos textos da interface por falante nativo.

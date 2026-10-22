# Edição Japão (inativa)

Complementa o manual comum (`../manual-de-redacao.md`). Nesta edição, as seções abaixo substituem "Leitor", "Edição diária" (por esta pauta semanal) e as fontes do Brasil; o resto do manual comum vale igual, adaptado ao japonês.

## Situação

Inativa. Exige redação em japonês com revisão nativa em todos os textos; a redação por agentes pode escrever o rascunho, mas a publicação depende dessa revisão.

## Leitor e idioma

- Investidor individual japonês com patrimônio relevante, que já conhece o básico.
- Japonês (ja-JP), registro formal de publicação (です・ます ou である, escolher um e manter). Valores em iene (円), com 万 e 億 quando for o uso da fonte oficial. Datas no formato 2026年10月12日.
- Sem travessão também em japonês (evitar ーー como pausa).

## Pauta da semana

- 3 notícias com `editoria: "日本"`, 2 com `editoria: "海外"` e 1 guia.
- Prioridade nacional: reuniões de política monetária do Banco do Japão, CPI do Statistics Bureau, câmbio do iene, títulos do governo (JGB), mudanças no NISA e no iDeCo, regras da FSA.
- Guias: NISA, iDeCo, títulos do governo para pessoa física, fundos de investimento (sem citar fundo específico), investir fora do Japão e risco cambial.

## Fontes primárias

- Banco do Japão (boj.or.jp)
- Statistics Bureau of Japan (stat.go.jp) e Gabinete do Governo (cao.go.jp)
- Ministério das Finanças (mof.go.jp)
- Financial Services Agency (fsa.go.jp)
- Japan Exchange Group (jpx.co.jp)
- e-Gov para leis (e-gov.go.jp)

## Regulação de conteúdo financeiro

- A atividade de consultoria de investimento exige registro pela lei de instrumentos financeiros (金融商品取引法). Publicações vendidas ao público em geral, sem conselho individual, costumam ficar fora dessa exigência. A confirmar com advogado japonês.
- Nunca indicar ação, fundo ou produto específico.

## Dados pessoais e cadastro

- APPI (Lei de Proteção de Informações Pessoais); autoridade: Personal Information Protection Commission (ppc.go.jp). Envio de e-mail promocional exige consentimento prévio pela lei antispam japonesa.
- O canal de mensagens mais usado no Japão é o LINE, não o WhatsApp. O formulário provavelmente deve trocar o campo.
- Telefone com código +81. Máscara e validação próprias.

## Aviso legal (rascunho para revisão jurídica local)

> 本コンテンツは情報提供および教育を目的としたものであり、投資助言や特定の金融商品の売買を推奨するものではありません。過去の実績は将来の成果を保証するものではありません。投資判断はご自身の状況に応じて行い、必要に応じて登録を受けた専門家にご相談ください。

## Domínios para liberar na rede

`boj.or.jp`, `stat.go.jp`, `cao.go.jp`, `mof.go.jp`, `fsa.go.jp`, `jpx.co.jp`, `e-gov.go.jp`, `ppc.go.jp`

## Antes de ativar (pendências específicas)

- [ ] Parecer de advogado japonês sobre a lei de instrumentos financeiros e o aviso legal.
- [ ] Política de privacidade no padrão APPI.
- [ ] Decidir o canal de mensagens (LINE) e ajustar o formulário e `functions/api/lead.js`.
- [ ] Revisor nativo fixo para todos os textos, e tradução da interface.

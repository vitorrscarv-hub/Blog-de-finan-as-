# Edições por país: como ativar

O Grafous nasce com a edição Brasil. As outras edições já têm o modelo de redação pronto neste diretório, desligado:

| Código | País | Idioma | Arquivo | Observação |
| --- | --- | --- | --- | --- |
| `pt` | Portugal | pt-PT | `pt.md` | expansão mais simples |
| `us` | Estados Unidos | en-US | `us.md` | exceção do publisher a confirmar |
| `gb` | Reino Unido | en-GB | `gb.md` | regime de promoções financeiras exige parecer |
| `za` | África do Sul | en-ZA | `za.md` | |
| `in` | Índia | en-IN | `in.md` | regras da SEBI para conteúdo financeiro exigem parecer |
| `cn` | China | zh-CN | `cn.md` | maior barreira: licença de notícias e ICP |
| `jp` | Japão | ja-JP | `jp.md` | revisão nativa obrigatória |
| `au` | Austrália | en-AU | `au.md` | general advice warning obrigatório |

O registro de todas fica em `edicoes.json` (código, idioma, fuso, horário da pauta, endereço e se está ativa). A redação só trabalha numa edição com `"ativa": true`.

## O que cada modelo traz

- Leitor e idioma, com moeda e formato de datas.
- Pauta da semana: editorias e prioridades locais.
- Fontes primárias oficiais do país.
- Regulação de conteúdo financeiro e o que precisa de parecer jurídico.
- Dados pessoais e cadastro: lei local, consentimento para mensagens e formato de telefone.
- Aviso legal no idioma local, como rascunho para revisão de advogado do país.
- Domínios para liberar na rede do ambiente do Claude Code.
- Pendências específicas antes de ativar.

## Passo a passo para ativar uma edição

Cada passo é um pull request revisado, como tudo no projeto.

1. **Jurídico.** Resolver as pendências da seção "Antes de ativar" do modelo do país, a começar pelo parecer sobre regulação financeira e pela política de privacidade local. Sem isso, não seguir.
2. **Endereço.** Decidir entre subpasta no mesmo domínio (o padrão previsto em `edicoes.json`, como `/us/`) ou domínio próprio (como `grafous.com`). Subpasta aproveita a autoridade do domínio principal no Google; domínio próprio deixa a marca mais local.
3. **Site.** Pedir ao Claude Code para preparar o site para a edição. Isso envolve:
   - uma coleção de conteúdo por edição (`src/content/<codigo>/noticias` e `guias`), com as editorias do modelo (o schema atual só conhece Brasil e Internacional);
   - rotas da edição, menu e textos da interface no idioma local, inclusive o pop-up de cadastro;
   - `hreflang` entre as edições e um sitemap por edição;
   - formulário com telefone e consentimento no padrão local, e a função `functions/api/lead.js` validando o país (coluna `edicao` no banco);
   - aviso legal e política de privacidade revisados;
   - testes e capturas da edição nova.
4. **Rede.** Liberar os domínios listados no modelo em Allowed domains, no ambiente do Claude Code.
5. **Redação.** Marcar `"ativa": true` em `edicoes.json` para a edição.
6. **Agenda.** Criar uma tarefa agendada própria para a edição, com o `cron` do registro (segunda-feira de manhã no fuso local) e o pedido "pauta da semana da edição `<codigo>`".
7. **Primeiras semanas.** Revisar com atenção redobrada, de preferência com um revisor nativo, antes de cada merge.

## Como a redação usa os modelos

O editor-chefe (`../SKILL.md`) recebe o código da edição (padrão `br`). Para qualquer edição diferente de `br`, todos os integrantes leem o manual comum (`../manual-de-redacao.md`) e, por cima dele, o modelo do país, que substitui as seções de leitor, pauta e fontes. As regras de fonte primária, neutralidade, tom e "o que nunca pode sair" valem para todas as edições, em qualquer idioma.

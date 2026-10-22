---
name: pauta-diaria
description: Edição diária do Grafous (segunda a sábado, 9h15 e 18h45 de São Paulo, 3 matérias por dia, em um pull request por dia, ou dois se a manhã já tiver sido publicada) e a Matéria indicada pontual. Use quando a tarefa agendada da manhã ou da noite disparar, ou quando Vitor pedir uma matéria pontual.
---

# Edição diária: editor-chefe

Este arquivo é a única descrição do fluxo. As regras de conteúdo (vagas, fontes, tom, política, o que nunca sai) estão em `manual-de-redacao.md`; como abrir cada fonte, em `acesso-as-fontes.md`. Leia os dois e o `CLAUDE.md` antes de começar. Vitor é o publisher: você nunca faz merge.

Economia de tokens é regra: script antes de IA, leitura curta (radar e `hoje.mjs` em vez de pesquisar na web), uma matéria por vez e só os dois agentes abaixo.

| Quem | Faz |
| --- | --- |
| você (editor-chefe) | escolhe a pauta pelo radar, escreve as matérias, roda revisão, build e testes, abre ou atualiza o pull request |
| `checador` (`.claude/agents/checador.md`) | confere cada dado de uma matéria na fonte e corrige ou marca rascunho; um por matéria, em paralelo |
| `calendarista` (`.claude/agents/calendarista.md`) | só na manhã de segunda: atualiza o calendário de proventos |

Se a ferramenta Agent ou os agentes do projeto não estiverem disponíveis, faça o papel deles você mesmo, lendo o arquivo do agente como instrução.

## Turnos

| Turno | Quando | Matérias |
| --- | --- | --- |
| `manha` | segunda a sábado, 9h15 (depois da ata do Copom das 8h e do IBGE das 9h; o pull request fica pronto perto da abertura da bolsa, às 10h) | 1 de **Política Brasil** e 1 de **Brasil ou Mercado**. Se `hoje.mjs` apontar matéria obrigatória (IPCA, ata do Copom), ela ocupa a vaga de Brasil ou Mercado. Segunda: também o calendário de proventos. |
| `noite` | segunda a sábado, 18h45 | 1 com o **fato do dia**: em dia útil, o que marcou o fechamento do mercado; no sábado, o fato mais relevante do dia. Se `hoje.mjs` apontar a decisão do Copom, ela é a matéria. |

Vaga sem fato que passe no manual fica vazia, com o motivo no pull request: publicar menos é melhor que publicar fraco. Internacional não tem vaga fixa; entra quando for o fato mais relevante da vaga.

## Passo a passo

1. **Branch.** `git fetch origin`. Data de São Paulo. `npm ci` depois de escolher o branch.
   - Manhã: crie `edicao/AAAA-MM-DD` a partir de `origin/main`.
   - Noite: veja o pull request `Edição de AAAA-MM-DD`. Se estiver **aberto**, faça checkout de `edicao/AAAA-MM-DD` e acrescente a matéria nele. Se já tiver sido **mergeado** (Vitor publicou a manhã) ou não existir, crie `edicao/AAAA-MM-DD-noite` a partir de `origin/main`. Nunca faça push num branch cujo pull request já foi mergeado.
2. **O que o dia pede (sem IA).** `node scripts/hoje.mjs --turno=<turno>`: matéria obrigatória e sugestões.
3. **Radar (sem IA).** `node scripts/radar.mjs --horas=14` na manhã, `--horas=8` na noite: manchetes dos jornais e o que as fontes oficiais publicaram. Na manhã, em período eleitoral, também `node scripts/pesquisas-tse.mjs --dias=7`: pesquisas para presidente registradas no TSE. Para não repetir assunto: `ls src/content/noticias | tail -20` e os títulos dos pull requests abertos.
4. **Pauta.** Escolha os assuntos das vagas do turno pelos critérios do manual. Não pesquise na web além do necessário para abrir a fonte de cada assunto escolhido.
5. **Escrever.** Uma matéria por vez, no formato do manual, com os dados lidos na fonte aberta nesta sessão. Para cada matéria, anote a tabela "dado | valor no texto | url da fonte".
6. **Checar.** Chame um `checador` por matéria (em paralelo), com o caminho do arquivo e a tabela.
7. **Calendário (só na manhã de segunda).** Em paralelo com a checagem, chame o `calendarista` com a data. Um commit separado: `atualiza calendário de proventos`.
8. **Fechar.**
   - `node scripts/revisar.mjs`: corrija todo erro; aviso, avalie.
   - `npm run indicadores` (valor de reserva da faixa do topo; o site já mostra o valor ao vivo).
   - `npm run build` sem erros nem avisos e `npm test`. Texto que derrube o build e não tenha conserto vai com `draft: true`, registrado no pull request.
   - Um commit por matéria (ex.: `adiciona matéria sobre a ata do Copom`) e um para indicadores, se mudaram.
9. **Pull request.** Push do branch. Na manhã, abra o pull request `Edição de AAAA-MM-DD` para o `main`. Na noite, se o da manhã estiver aberto, atualize esse mesmo pull request (push no branch e uma seção nova no corpo); se não, abra `Edição de AAAA-MM-DD (noite)` a partir de `edicao/AAAA-MM-DD-noite`. O corpo tem uma seção por turno com, para cada matéria: vaga, título, endereço, se está publicada ou como rascunho, a tabela final do checador e quais fatos vieram de jornal; depois, vagas vazias e o motivo, o calendário (segunda) e o resultado de build e testes. Use as ferramentas `mcp__github__` (carregue com ToolSearch); se não houver, termine com o link `https://github.com/vitorrscarv-hub/Blog-de-finan-as-/compare/main...edicao/AAAA-MM-DD?expand=1` e o corpo pronto para colar.
10. **Fim.** Se houver ferramenta de notificação, avise Vitor com o link. Responda com o link e uma linha por matéria.

Nunca faça merge, push no `main`, force push ou deploy. Se algo impedir a edição (sem acesso de escrita, nenhuma fonte abre), responda com a primeira linha "EDIÇÃO NÃO FEITA" e o motivo exato.

## Matéria indicada pontual

Assunto escolhido por Vitor (pedido direto ou tarefa agendada única), inclusive guias. Mesmo fluxo de uma matéria (passos 5, 6, 8), na editoria ou no tema que o assunto pedir. Branch `pontual/AAAA-MM-DD-assunto-curto` e pull request próprio, `Matéria indicada pontual: <assunto>`.

## Edições de outros países

Só a edição `br` está ativa. Pedido de outra edição: confira `edicoes/edicoes.json`; se não estiver ativa, não faça a pauta e aponte `edicoes/COMO-ATIVAR.md`. Se estiver, a pauta é semanal, pelo modelo `edicoes/<codigo>.md` (que substitui as vagas e as fontes do manual), com o mesmo passo a passo, branch `pauta/<codigo>/AAAA-MM-DD` e pull request próprio.

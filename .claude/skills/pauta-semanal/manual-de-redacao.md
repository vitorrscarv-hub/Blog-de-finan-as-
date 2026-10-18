# Manual de redação do blog

Vale para todos os integrantes da redação (pauteiro, repórter, checador, revisor e editor-chefe). O `CLAUDE.md` da raiz continua valendo; este manual detalha o que ele diz sobre conteúdo.

## Leitor

Investidor pessoa física com patrimônio relevante, que já conhece o básico e quer entender o que mudou e o que isso significa para a carteira dele. Não é iniciante, não é profissional do mercado.

## Fontes

Regra sem exceção: todo número, data, alíquota, nome de norma e citação precisa ter sido lido na fonte primária, numa página aberta nesta sessão.

Fontes primárias aceitas: Banco Central (bcb.gov.br, inclusive a API SGS em api.bcb.gov.br), IBGE (ibge.gov.br, agenciadenoticias.ibge.gov.br, servicodados.ibge.gov.br), Tesouro Nacional e Tesouro Direto, Receita Federal e CVM (gov.br), Anbima, B3, Diário Oficial da União, Câmara e Senado para projetos de lei.

- Jornal, portal ou site de investimento serve para achar a pauta, nunca como fonte do número.
- Se a fonte primária não abrir (bloqueio de rede, site fora do ar), o dado fica sem conferência. O texto vai com `draft: true` e o pull request diz o que faltou. Nunca preencher com o que "provavelmente" é.
- Em `fontes:` do cabeçalho, só páginas abertas de fato, com título descritivo e url completa.

## Formato

Um arquivo por texto, no formato do README ("Como publicar um texto"):

- Notícia: `src/content/noticias/AAAA-MM-DD-assunto-curto.md`, `date` igual à data da pauta, 500 a 800 palavras. Ordem: o fato, o contexto e o que muda para quem investe.
- Guia: `src/content/guias/assunto-curto.md`, com `tema` (Previdência, Renda fixa, Proteção e reserva, Fundos, Investimento no exterior ou Fundamentos), 1.200 a 1.800 palavras, intertítulos `##`, exemplos numéricos simples e marcados como ilustrativos.
- `title` direto, sem pergunta e sem dois-pontos de efeito. `description` de até 155 caracteres, que funcione como linha fina. `keywords`: até 5 termos que alguém digitaria no Google. `teaser`: até duas frases para o canal de WhatsApp, terminando em `[LINK]`. `gate: true`. `draft: false`, salvo dado sem conferência.
- Nome de arquivo só com letras minúsculas sem acento, números e hífens.

## Tom e estilo

- Pessoa experiente falando com outra. Frases de tamanho variado, específicas, com números e exemplos reais.
- Sem linguagem promocional ("imperdível", "oportunidade única", "revolucionário"), sem emojis, sem urgência artificial ("corra", "antes que acabe").
- Sem travessão (`—` ou `–`). Use vírgula, ponto ou parênteses.
- Sem frase que serviria para qualquer assunto, sem parágrafo que fecha resumindo o que acabou de dizer, sem "especialistas apontam" sem dizer quem.

## O que nunca pode sair

- Promessa de retorno ou de ganho.
- Indicação de compra ou venda de ativo, fundo ou título específico. Nada de "vale a pena", "é hora de", "aproveite", "o investidor deve". Explique o mecanismo e os pontos a considerar conforme o perfil.
- Vitor citado no corpo do texto, apresentado como economista ou assessor, ou ligado a alguma instituição financeira.
- Previsão apresentada como fato. Projeção só com a fonte (ex.: "o Boletim Focus de [data] projeta...").

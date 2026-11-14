export const SITE = {
  // Nome do blog (cabeçalho, título das páginas, RSS, Open Graph). O autor fica em `autor`.
  nome: 'Grafous',
  slogan: 'A informação que conecta os fatos.',
  descricao:
    'Economia, mercado e política no Brasil e no mundo, com o que cada fato muda para quem investe.',
  // Imagem usada quando um link do blog é compartilhado (WhatsApp, LinkedIn etc.). 1200x630.
  imagemPadrao: '/og-padrao.png',
  autor: {
    // Nome que aparece no rodapé e nos metadados. O nome completo só vai onde a lei pede identificação (política de privacidade).
    nome: 'Vitor RC',
    nomeCompleto: 'Vitor Reis de Carvalho',
    credenciais: [
      'CEA (Anbima)',
      'Pós-graduado em Finanças, Investimentos e Banking pela PUC-RS',
      'Formado em Gestão Financeira',
    ],
  },
  lead: {
    // false desliga o pop-up e libera todos os textos sem cadastro (o JSON-LD deixa de marcar conteúdo restrito).
    ativo: false,
    // Ponto da leitura em que o pop-up aparece, sorteado entre os dois valores.
    gatilhoMin: 0.3,
    gatilhoMax: 0.4,
    // 'obrigatorio': o restante do texto fica bloqueado até o cadastro.
    // 'opcional': o leitor pode fechar o pop-up e seguir lendo.
    modo: 'obrigatorio' as 'obrigatorio' | 'opcional',
    endpoint: '/api/lead',
  },
  // Tarja de cotações no topo (Ibovespa, ações do índice e dólar PTAX). Lê /api/cotacoes; a lista de papéis está em src/data/tarja.json.
  // A B3 entrega com 15 minutos de atraso; o aviso fica na própria tarja. false desliga a tarja.
  tarja: {
    ativo: true,
    endpoint: '/api/cotacoes',
    intervaloSegundos: 60,
    // Velocidade da rolagem, em pixels por segundo. Menor = mais lenta.
    velocidade: 45,
    ptaxUrl: 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes',
  },
  // Capa: quantas notícias vão na coluna "Mais notícias" (a fileira de baixo tem sempre 3) e matérias fixadas
  // numa posição dessa coluna, pelo nome do arquivo sem .md (ex.: { '2026-10-23-assunto': 3 }). Fixada não vira manchete nem entra no carrossel.
  capa: {
    maisNoticias: 3,
    fixadas: { '2026-10-26-saida-de-dolares-patrimonio-no-exterior': 1 } as Record<string, number>,
    // Manchete em carrossel com as Matérias indicadas pontuais (nome do arquivo sem .md), na ordem desta lista, até
    // `maximo`. Matéria da lista que ainda não foi publicada é ignorada. Sem nenhuma publicada, a manchete
    // volta a ser a notícia mais recente. Troca de destaque a cada `segundos` (não roda sozinho com "reduzir movimento").
    carrossel: {
      ativo: true,
      segundos: 4,
      maximo: 5,
      // Janela de tecnologia: a notícia de Tecnologia mais recente (publicada há até `dias` dias) ocupa sempre esta
      // posição do carrossel (1 = primeira), sem precisar estar em `materias`. Sem notícia recente, a janela some.
      janela: { ativo: true, editoria: 'Tecnologia', posicao: 3, dias: 7 },
      materias: [
        '2026-11-14-stf-quatro-votos-liminar-dino-fim-escala-6x1',
        '2026-11-14-focus-selic-ate-2030-juros-dois-digitos',
        '2026-11-12-pgbl-restituicao-imposto-de-renda-calculadora',
        '2026-11-11-governo-prepara-projeto-ajuste-fiscal-pisos-saude-educacao',
        '2026-11-11-servicos-setembro-recuo-0-1-ibge',
      ],
    },
  },
  // Seção "Seu patrimônio" (/patrimonio/, no menu e na capa): matérias e guias escolhidos (nome do arquivo sem .md),
  // na ordem desta lista. Os que ainda não foram publicados são ignorados. A capa mostra os `naCapa` primeiros.
  patrimonio: {
    naCapa: 3,
    materias: [
      '2026-10-26-saida-de-dolares-patrimonio-no-exterior',
      '2026-10-27-diversificacao-all-weather-volatilidade',
      '2026-10-27-juros-futuros-empresas-afetadas-emprego',
      '2026-10-27-cenario-economico-pos-eleicao',
      '2026-10-26-reeleicao-lula-mercado-queda',
    ],
    guias: ['come-cotas-tributacao-fundos-abertos'],
  },
  // Formulário "Fale com um especialista" no fim das matérias listadas em `paginas` (endereço da matéria).
  // Os contatos vão para o mesmo cadastro do pop-up (/api/lead), com a origem abaixo, e aparecem no painel.
  // Quem recebe os contatos (parceiro) aparece só na política de privacidade, nunca no formulário. false desliga o formulário em todas as páginas.
  contatoEspecialista: {
    ativo: true,
    endpoint: '/api/lead',
    origem: 'especialista-exterior',
    parceiro: 'Gradus Investimentos',
    chamada:
      'Se você pode aportar 1 mil dólares ou mais por mês para construir patrimônio no exterior, preencha o formulário e um especialista irá entrar em contato.',
    paginas: [
      '/noticias/2026-10-26-saida-de-dolares-patrimonio-no-exterior/',
      '/noticias/2026-10-27-diversificacao-all-weather-volatilidade/',
      '/noticias/2026-11-12-pgbl-restituicao-imposto-de-renda-calculadora/',
    ],
    // Frase própria de uma página; sem ela, vale a `chamada` acima.
    chamadasPorPagina: {
      '/calculadoras/pgbl/':
        'Se você quer avaliar se o PGBL cabe no seu planejamento de imposto e aposentadoria, preencha o formulário e um especialista entrará em contato.',
      '/noticias/2026-11-12-pgbl-restituicao-imposto-de-renda-calculadora/':
        'Se você quer avaliar se o PGBL cabe no seu planejamento de imposto e aposentadoria, preencha o formulário e um especialista entrará em contato.',
      '/patrimonio/':
        'Se você quer revisar como o seu patrimônio está distribuído entre Brasil e exterior, preencha o formulário e um especialista entrará em contato.',
      '/noticias/2026-10-27-diversificacao-all-weather-volatilidade/':
        'Se você está preocupado com os próximos anos da nossa economia e quer se proteger com uma diversificação mais eficiente, inspirada em modelos usados por grandes gestoras internacionais, preencha o formulário e um especialista entrará em contato.',
    } as Record<string, string>,
  },
  // Formulário de projetos de tecnologia: substitui o de especialista no fim de toda notícia de Tecnologia e capta
  // contatos para as empresas parceiras abaixo, que desenvolvem aplicativos, sites e softwares. Os parceiros aparecem
  // só na política de privacidade. Mesmo cadastro (/api/lead), com a origem própria, separada no painel.
  contatoProjetos: {
    ativo: true,
    origem: 'projeto-tecnologia',
    parceiros: ['Planni Tech', 'VRC Landing Pages'],
    titulo: 'Tem um projeto de tecnologia?',
    chamada:
      'Se você ou a sua empresa precisa de um aplicativo, um site ou um software sob medida, preencha o formulário e a equipe de desenvolvimento parceira do Grafous entrará em contato para entender o projeto.',
    consentimento: 'para que a equipe de desenvolvimento entre em contato sobre o meu projeto',
    botao: 'Quero falar sobre o meu projeto',
    ok: 'Recebemos seus dados. A equipe vai entrar em contato para entender o seu projeto.',
  },
  // Medição de audiência (painel interno). Sem cookies; só um identificador aleatório no navegador.
  // Respeita "Não rastrear" (DNT) e o Global Privacy Control. O painel mora na pasta src/pages/painel-grafous/:
  // se mudar o endereço, renomeie a pasta e ajuste `painel` aqui.
  metricas: {
    ativo: true,
    endpoint: '/api/evento',
    painel: '/painel-grafous/',
  },
};

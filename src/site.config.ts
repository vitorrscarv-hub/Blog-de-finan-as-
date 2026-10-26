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
  // numa posição dessa coluna, pelo nome do arquivo sem .md (ex.: { '2026-10-23-assunto': 3 }). Fixada não vira manchete.
  capa: {
    maisNoticias: 3,
    fixadas: { '2026-10-23-volume-puts-b3-pico-7-8-outubro': 3 } as Record<string, number>,
  },
  // Formulário "Fale com um especialista" no fim das matérias listadas em `paginas` (endereço da matéria).
  // Os contatos vão para o mesmo cadastro do pop-up (/api/lead), com a origem abaixo, e aparecem no painel.
  // Quem recebe os contatos precisa estar na política de privacidade. false desliga o formulário em todas as páginas.
  contatoEspecialista: {
    ativo: true,
    endpoint: '/api/lead',
    origem: 'especialista-exterior',
    parceiro: 'Gradus Investimentos',
    chamada:
      'Se você tem mais de 100 mil reais investidos e pode aportar 1 mil dólares ou mais por mês para construir patrimônio no exterior, preencha o formulário e um especialista irá entrar em contato.',
    paginas: ['/noticias/2026-10-26-saida-de-dolares-patrimonio-no-exterior/'],
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

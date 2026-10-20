export const SITE = {
  // Nome do blog (cabeçalho, título das páginas, RSS, Open Graph). O autor fica em `autor`.
  nome: 'Grafous',
  slogan: 'A informação que conecta os fatos.',
  descricao:
    'Conteúdo educacional sobre finanças e investimentos para quem tem patrimônio relevante.',
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
  // Medição de audiência (painel interno). Sem cookies; só um identificador aleatório no navegador.
  // Respeita "Não rastrear" (DNT) e o Global Privacy Control. O painel mora na pasta src/pages/painel-grafous/:
  // se mudar o endereço, renomeie a pasta e ajuste `painel` aqui.
  metricas: {
    ativo: true,
    endpoint: '/api/evento',
    painel: '/painel-grafous/',
  },
};

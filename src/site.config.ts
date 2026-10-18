export const SITE = {
  // Nome do blog (cabeçalho, título das páginas, RSS, Open Graph). O autor fica em `autor`.
  nome: 'InfouS',
  descricao:
    'Conteúdo educacional sobre finanças e investimentos para quem tem patrimônio relevante.',
  // Imagem usada quando um link do blog é compartilhado (WhatsApp, LinkedIn etc.). 1200x630.
  imagemPadrao: '/og-padrao.png',
  autor: {
    nome: 'Vitor Reis de Carvalho',
    credenciais: [
      'CEA (Anbima)',
      'Pós-graduado em Finanças, Investimentos e Banking pela PUC-RS',
      'Formado em Gestão Financeira',
    ],
  },
  lead: {
    // Ponto da leitura em que o pop-up aparece, sorteado entre os dois valores.
    gatilhoMin: 0.3,
    gatilhoMax: 0.4,
    // 'obrigatorio': o restante do texto fica bloqueado até o cadastro.
    // 'opcional': o leitor pode fechar o pop-up e seguir lendo.
    modo: 'obrigatorio' as 'obrigatorio' | 'opcional',
    endpoint: '/api/lead',
  },
};

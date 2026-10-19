-- Tabela de cadastros do pop-up. Aplicar com:
--   npx wrangler d1 execute blog-leads --remote --file=db/schema.sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  pagina TEXT,
  origem TEXT,
  consentimento_em TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON leads (criado_em);

-- Medição de audiência (painel interno). Uma linha por visualização de página.
-- Não guarda IP, nem user agent, nem nenhum dado que identifique a pessoa: só um identificador
-- aleatório gerado no navegador (visitante), o caminho lido e o quanto foi lido.
CREATE TABLE IF NOT EXISTS visitas (
  pv TEXT PRIMARY KEY,          -- id da visualização, gerado no navegador
  ts INTEGER NOT NULL,          -- milissegundos desde 1970 (UTC)
  visitante TEXT NOT NULL,      -- id aleatório guardado no navegador (localStorage)
  sessao TEXT NOT NULL,         -- id aleatório da aba (sessionStorage)
  caminho TEXT NOT NULL,        -- ex.: /noticias/2026-10-19-focus.../
  origem TEXT,                  -- domínio de onde veio (referência), quando é outro site
  dispositivo TEXT NOT NULL,    -- celular, tablet ou computador
  pais TEXT,                    -- país (2 letras) informado pelo Cloudflare, se houver
  novo INTEGER NOT NULL DEFAULT 0,   -- 1 na primeira visita daquele navegador
  rolagem INTEGER NOT NULL DEFAULT 0, -- maior ponto do texto atingido, em % (artigos)
  segundos INTEGER NOT NULL DEFAULT 0 -- tempo com a página visível, em segundos (artigos)
);
CREATE INDEX IF NOT EXISTS idx_visitas_ts ON visitas (ts);
CREATE INDEX IF NOT EXISTS idx_visitas_visitante ON visitas (visitante, ts);
CREATE INDEX IF NOT EXISTS idx_visitas_caminho ON visitas (caminho, ts);

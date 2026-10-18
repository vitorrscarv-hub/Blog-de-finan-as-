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

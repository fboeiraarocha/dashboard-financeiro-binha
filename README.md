# Painel Financeiro

Dashboard financeiro em vermelho, com login por senha e importação de planilhas (.xlsx/.csv).
Next.js (App Router) hospedado na Vercel, dados no Supabase.

## Como funciona

- **Login**: uma senha única. O hash fica na variável `APP_PASSWORD_HASH` (senha inicial de teste: `12345`).
  Depois que o banco estiver ligado, a senha pode ser trocada em **Conta**, e o novo hash passa a valer a partir do banco.
- **Dados fictícios**: aparecem só até a primeira planilha real ser importada. A importação grava
  `real_data_started = true` em `app_settings`, e a partir daí os fictícios nunca mais aparecem.
- **Importação**: envie a planilha, confira o resumo (totais, período, linhas ignoradas) e confirme.
  Colunas reconhecidas: `Data`, `Valor`, `Tipo` (Receita/Despesa), `Descrição`, `Categoria`,
  ou colunas separadas `Receita` e `Despesa`. Há um modelo em `/modelo.csv`.
- **Segurança**: o banco só é acessado pelo servidor. As tabelas têm RLS e só liberam acesso quando a
  requisição traz o cabeçalho `x-app-secret` com o segredo guardado em `private.app_secret`
  (schema que a API não expõe). Sem o segredo, a chave publicável não lê nem grava nada.

## Configuração

1. No Supabase, rode as migrações em `supabase/migrations/` e grave o segredo:
   `insert into private.app_secret (value) values ('<SUPABASE_APP_SECRET>');`
2. Na Vercel, defina as variáveis (veja `.env.example`):
   - `APP_PASSWORD_HASH`: gere com `npm run hash-password -- 12345`
   - `SESSION_SECRET`: `openssl rand -hex 32`
   - `SUPABASE_URL`, `SUPABASE_KEY` (publicável) e `SUPABASE_APP_SECRET`

Sem as variáveis do Supabase o painel funciona com dados fictícios e a importação mostra uma prévia sem gravar.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

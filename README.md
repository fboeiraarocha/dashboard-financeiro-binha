# Painel Financeiro

Dashboard financeiro em azul, com login por senha e importação de planilhas (.xlsx/.csv).
Next.js (App Router) hospedado na Vercel, dados no Supabase.

## Como funciona

- **Login**: uma senha única (inicial de teste: `12345`), guardada no banco com hash bcrypt.
  Troque em **Conta**. O login cria uma sessão aleatória que também fica no banco e expira em 7 dias.
- **Dados fictícios**: aparecem só até a primeira planilha real ser importada. A importação grava
  `real_data_started = true` em `app_settings`, e a partir daí os fictícios nunca mais aparecem.
- **Importação**: envie a planilha, confira o resumo (totais, período, linhas ignoradas) e confirme.
  Colunas reconhecidas: `Data`, `Valor`, `Tipo` (Receita/Despesa), `Descrição`, `Categoria`,
  ou colunas separadas `Receita` e `Despesa`. Há um modelo em `/modelo.csv`.
- **Segurança**: senha e sessões ficam no schema `private` do Supabase, que a API não expõe.
  As tabelas têm RLS e só liberam leitura e gravação quando a requisição traz um token de sessão válido
  (cookie httpOnly que o servidor repassa no cabeçalho `x-session-token`). A chave publicável sozinha
  não lê nem grava nada, por isso o app não precisa de nenhum segredo na Vercel.

## Configuração

1. No Supabase, rode as migrações de `supabase/migrations/` em ordem.
2. Na Vercel, importe o repositório e faça o deploy. Não há variáveis de ambiente obrigatórias.

## Desenvolvimento

```bash
npm install
npm run dev
```

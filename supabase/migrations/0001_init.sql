-- Dashboard financeiro: esquema inicial
create extension if not exists pgcrypto;

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  import_id uuid not null references public.imports(id) on delete cascade,
  date date not null,
  description text not null default '',
  category text not null default 'Sem categoria',
  type text not null check (type in ('receita', 'despesa')),
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions (date);
create index if not exists transactions_import_idx on public.transactions (import_id);

-- Configurações da aplicação (hash da senha, marcador de dados reais etc.)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- O acesso acontece só pelo servidor com a chave service_role.
-- RLS ligado e nenhuma policy: a chave anônima não lê nem grava nada.
alter table public.imports enable row level security;
alter table public.transactions enable row level security;
alter table public.app_settings enable row level security;

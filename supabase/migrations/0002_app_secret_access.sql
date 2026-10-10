-- Acesso pelo servidor do app usando a chave publicável + um segredo no cabeçalho x-app-secret.
-- O segredo fica num schema que a API não expõe; sem ele, a chave publicável não lê nem grava nada.
create schema if not exists private;

create table if not exists private.app_secret (
  id boolean primary key default true check (id),
  value text not null
);
revoke all on private.app_secret from public, anon, authenticated;

create or replace function private.request_authorized()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.app_secret s
    where s.value = coalesce(current_setting('request.headers', true)::json ->> 'x-app-secret', '')
  );
$$;

grant usage on schema private to anon;
revoke all on function private.request_authorized() from public;
grant execute on function private.request_authorized() to anon;

drop policy if exists app_server_all on public.imports;
create policy app_server_all on public.imports for all to anon
  using (private.request_authorized()) with check (private.request_authorized());

drop policy if exists app_server_all on public.transactions;
create policy app_server_all on public.transactions for all to anon
  using (private.request_authorized()) with check (private.request_authorized());

drop policy if exists app_server_all on public.app_settings;
create policy app_server_all on public.app_settings for all to anon
  using (private.request_authorized()) with check (private.request_authorized());

-- O valor do segredo é gravado fora das migrações:
-- insert into private.app_secret (value) values ('<SUPABASE_APP_SECRET>')
--   on conflict (id) do update set value = excluded.value;

-- Login e sessões verificados dentro do banco: o app não precisa de nenhum segredo na Vercel.
-- A senha (hash bcrypt) e as sessões ficam no schema private, que a API não expõe.
-- O navegador guarda o token da sessão num cookie httpOnly; o servidor do app o repassa
-- no cabeçalho x-session-token e as policies de RLS liberam acesso só com sessão válida.

create table if not exists private.app_password (
  id boolean primary key default true check (id),
  hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.sessions (
  token_hash text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

revoke all on private.app_password, private.sessions from public, anon, authenticated;

create or replace function private.session_token_hash()
returns text
language sql
stable
set search_path = ''
as $$
  select encode(extensions.digest(
    coalesce(current_setting('request.headers', true)::json ->> 'x-session-token', ''), 'sha256'), 'hex');
$$;

-- Usado pelas policies das tabelas (substitui a checagem do segredo fixo).
create or replace function private.request_authorized()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.sessions s
    where s.token_hash = private.session_token_hash() and s.expires_at > now()
  );
$$;
revoke all on function private.request_authorized() from public;
grant execute on function private.request_authorized() to anon;

create or replace function public.app_login(p_password text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  stored text;
  token text;
begin
  select hash into stored from private.app_password where id;
  if stored is null or p_password is null or extensions.crypt(p_password, stored) <> stored then
    perform pg_sleep(0.6);
    return null;
  end if;
  delete from private.sessions where expires_at < now();
  token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.sessions (token_hash, expires_at)
    values (encode(extensions.digest(token, 'sha256'), 'hex'), now() + interval '7 days');
  return token;
end;
$$;

create or replace function public.app_session_valid()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.request_authorized(); $$;

create or replace function public.app_logout()
returns void
language sql
volatile
security definer
set search_path = ''
as $$ delete from private.sessions where token_hash = private.session_token_hash(); $$;

create or replace function public.app_change_password(p_current text, p_new text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  stored text;
begin
  if not private.request_authorized() then return 'Sessão expirada. Entre novamente.'; end if;
  select hash into stored from private.app_password where id;
  if extensions.crypt(coalesce(p_current, ''), stored) <> stored then
    perform pg_sleep(0.6);
    return 'A senha atual está incorreta.';
  end if;
  if length(coalesce(p_new, '')) < 8 then return 'A nova senha precisa ter pelo menos 8 caracteres.'; end if;
  update private.app_password set hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now() where id;
  -- encerra as outras sessões
  delete from private.sessions where token_hash <> private.session_token_hash();
  return null;
end;
$$;

revoke all on function public.app_login(text), public.app_session_valid(), public.app_logout(),
  public.app_change_password(text, text) from public, authenticated;
grant execute on function public.app_login(text), public.app_session_valid(), public.app_logout(),
  public.app_change_password(text, text) to anon;

-- Senha inicial de teste: 12345 (troque em Conta).
insert into private.app_password (id, hash)
  values (true, extensions.crypt('12345', extensions.gen_salt('bf', 10)))
  on conflict (id) do nothing;

-- O segredo fixo antigo não é mais usado.
drop table if exists private.app_secret;

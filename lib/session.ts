import { SUPABASE_KEY, SUPABASE_URL } from "./env";

export const SESSION_COOKIE = "df_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias (o banco também expira a sessão)

const TOKEN_RE = /^[0-9a-f]{64}$/;

/** Chama uma função RPC do Supabase. Usa fetch puro para funcionar também no middleware (edge). */
export async function rpc<T>(fn: string, args: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
  };
  if (token) headers["x-session-token"] = token;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao falar com o banco (${res.status}).`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !TOKEN_RE.test(token)) return false;
  try {
    return (await rpc<boolean>("app_session_valid", {}, token)) === true;
  } catch {
    return false;
  }
}

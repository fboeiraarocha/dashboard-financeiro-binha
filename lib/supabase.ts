import "server-only";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";
import { SESSION_COOKIE } from "./session";

/** Cliente do Supabase da requisição atual, levando o token da sessão do usuário. */
export async function db(): Promise<SupabaseClient> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-session-token": token } },
  });
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await (await db()).from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await (await db())
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

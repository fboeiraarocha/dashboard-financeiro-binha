"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { SESSION_COOKIE, SESSION_MAX_AGE, rpc } from "@/lib/session";
import { db } from "@/lib/supabase";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("senha") ?? "");
  if (!password) return { error: "Digite a senha." };
  let token: string | null;
  try {
    token = await rpc<string | null>("app_login", { p_password: password });
  } catch {
    return { error: "Não foi possível conectar ao banco. Tente de novo em instantes." };
  }
  if (!token) return { error: "Senha incorreta." };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await rpc("app_logout", {}, token);
    } catch {
      // a sessão expira sozinha no banco
    }
  }
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const current = String(form.get("atual") ?? "");
  const next = String(form.get("nova") ?? "");
  const confirm = String(form.get("confirmacao") ?? "");
  if (next.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
  if (next !== confirm) return { error: "A confirmação não bate com a nova senha." };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const error = await rpc<string | null>("app_change_password", { p_current: current, p_new: next }, token);
    if (error) return { error };
  } catch {
    return { error: "Não foi possível salvar a nova senha no banco." };
  }
  return { ok: "Senha alterada. Use a nova senha no próximo acesso." };
}

export async function deleteImport(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!supabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await (await db()).from("imports").delete().eq("id", id);
  revalidatePath("/", "layout");
}

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";
import { db, setSetting } from "@/lib/supabase";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("senha") ?? "");
  if (!password) return { error: "Digite a senha." };
  if (!(await verifyPassword(password))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Senha incorreta." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return { error: "Conecte o banco de dados antes de trocar a senha." };
  const current = String(form.get("atual") ?? "");
  const next = String(form.get("nova") ?? "");
  const confirm = String(form.get("confirmacao") ?? "");
  if (!(await verifyPassword(current))) return { error: "A senha atual está incorreta." };
  if (next.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
  if (next !== confirm) return { error: "A confirmação não bate com a nova senha." };
  try {
    await setSetting("password_hash", hashPassword(next));
  } catch {
    return { error: "Não foi possível salvar a nova senha no banco." };
  }
  return { ok: "Senha alterada. Use a nova senha no próximo acesso." };
}

export async function deleteImport(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!supabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await db().from("imports").delete().eq("id", id);
  revalidatePath("/", "layout");
}

import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { supabaseConfigured } from "./env";
import { getSetting } from "./supabase";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function matches(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.trim().split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** A senha salva no banco (após uma troca) tem prioridade sobre a variável de ambiente. */
async function storedHash(): Promise<string | null> {
  if (supabaseConfigured()) {
    try {
      const fromDb = await getSetting("password_hash");
      if (fromDb) return fromDb;
    } catch {
      // banco indisponível ou tabela ainda não criada: usa a variável de ambiente
    }
  }
  return process.env.APP_PASSWORD_HASH ?? null;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await storedHash();
  if (!stored) return false;
  return matches(password, stored);
}

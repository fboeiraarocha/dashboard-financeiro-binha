export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && supabaseKey());
}

export function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(secret);
}

/** Chave service_role, ou a chave publicável junto com SUPABASE_APP_SECRET (ver migração 0002). */
export function supabaseKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.SUPABASE_APP_SECRET ? process.env.SUPABASE_KEY : undefined);
}

// URL do projeto e chave publicável do Supabase. Ambas são públicas por natureza:
// sozinhas não leem nem gravam nada, porque as tabelas só liberam acesso com uma
// sessão válida criada pelo login (ver supabase/migrations/0003). Podem ser
// sobrescritas pelas variáveis SUPABASE_URL e SUPABASE_KEY.
export const SUPABASE_URL = process.env.SUPABASE_URL || "https://ismncislyrjpipwxrhzr.supabase.co";
export const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_f_x8xX5sp5WvBvvek7k_6w_T9S5zqwT";

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

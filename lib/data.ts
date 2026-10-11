import "server-only";
import { demoTransactions } from "./demo";
import { supabaseConfigured } from "./env";
import { db, getSetting } from "./supabase";
import type { DataMode, Transaction } from "./types";

export const REAL_DATA_FLAG = "real_data_started";

export type LoadedData = {
  mode: DataMode;
  dbConfigured: boolean;
  dbError: string | null;
  transactions: Transaction[];
};

/**
 * Enquanto nenhuma planilha real foi importada, mostra dados fictícios.
 * Depois da primeira importação o marcador fica gravado no banco e os
 * fictícios nunca mais aparecem, mesmo que todas as importações sejam apagadas.
 */
export async function loadData(): Promise<LoadedData> {
  if (!supabaseConfigured()) {
    return { mode: "demo", dbConfigured: false, dbError: null, transactions: demoTransactions() };
  }
  try {
    const started = (await getSetting(REAL_DATA_FLAG)) === "true";
    if (!started) {
      return { mode: "demo", dbConfigured: true, dbError: null, transactions: demoTransactions() };
    }
    return { mode: "real", dbConfigured: true, dbError: null, transactions: await fetchAllTransactions() };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { mode: "demo", dbConfigured: true, dbError: message, transactions: demoTransactions() };
  }
}

async function fetchAllTransactions(): Promise<Transaction[]> {
  const pageSize = 1000;
  const out: Transaction[] = [];
  for (let from = 0; ; from += pageSize) {
    const client = await db();
    const { data, error } = await client
      .from("transactions")
      .select("date, description, category, type, amount")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    for (const r of data ?? []) {
      out.push({ ...r, amount: Number(r.amount) } as Transaction);
    }
    if (!data || data.length < pageSize) break;
  }
  return out;
}

export type ImportRecord = { id: string; file_name: string; row_count: number; created_at: string };

export async function listImports(): Promise<ImportRecord[]> {
  if (!supabaseConfigured()) return [];
  const { data, error } = await (await db())
    .from("imports")
    .select("id, file_name, row_count, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return data ?? [];
}

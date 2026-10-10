import type { Transaction } from "./types";

export const PERIODS = [
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "12m", label: "12 meses" },
  { id: "ano", label: "Este ano" },
  { id: "tudo", label: "Tudo" },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];

export function parsePeriod(value: string | undefined): PeriodId {
  return (PERIODS.find((p) => p.id === value)?.id ?? "12m") as PeriodId;
}

type Range = { start: string; end: string } | null; // inclusivo, AAAA-MM-DD

const monthKey = (iso: string) => iso.slice(0, 7);
const pad = (n: number) => String(n).padStart(2, "0");
const firstOfMonth = (y: number, m0: number) => {
  const d = new Date(Date.UTC(y, m0, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`;
};

function ranges(period: PeriodId, anchor: string): { current: Range; previous: Range } {
  if (period === "tudo") return { current: null, previous: null };
  const [y, m] = anchor.split("-").map(Number);
  const end = `${anchor.slice(0, 7)}-31`;
  if (period === "ano") {
    return {
      current: { start: `${y}-01-01`, end },
      previous: { start: `${y - 1}-01-01`, end: `${y - 1}-${anchor.slice(5, 7)}-31` },
    };
  }
  const n = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const start = firstOfMonth(y, m - n);
  const prevStart = firstOfMonth(y, m - 2 * n);
  const prevEnd = `${firstOfMonth(y, m - n - 1).slice(0, 7)}-31`;
  return { current: { start, end }, previous: { start: prevStart, end: prevEnd } };
}

const within = (r: Range) => (t: Transaction) => !r || (t.date >= r.start && t.date <= r.end);

type Totals = { receitas: number; despesas: number; saldo: number; margem: number | null; count: number };

function totals(list: Transaction[]): Totals {
  let receitas = 0;
  let despesas = 0;
  for (const t of list) {
    if (t.type === "receita") receitas += t.amount;
    else despesas += t.amount;
  }
  const saldo = receitas - despesas;
  return { receitas, despesas, saldo, margem: receitas > 0 ? saldo / receitas : null, count: list.length };
}

export type MonthPoint = { month: string; receitas: number; despesas: number; saldo: number };
export type CategoryShare = { category: string; total: number; share: number };

export type Dashboard = {
  anchor: string | null;
  current: Totals;
  previous: Totals | null;
  months: MonthPoint[];
  expenseCategories: CategoryShare[];
  incomeCategories: CategoryShare[];
  recent: Transaction[];
};

function categoryShares(list: Transaction[], type: Transaction["type"], top: number): CategoryShare[] {
  const map = new Map<string, number>();
  let sum = 0;
  for (const t of list) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    sum += t.amount;
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((acc, [, v]) => acc + v, 0);
  if (rest > 0) head.push(["Outras", rest]);
  return head.map(([category, total]) => ({ category, total, share: sum > 0 ? total / sum : 0 }));
}

export function buildDashboard(all: Transaction[], period: PeriodId): Dashboard {
  const anchor = all.reduce<string | null>((max, t) => (!max || t.date > max ? t.date : max), null);
  if (!anchor) {
    const empty = totals([]);
    return { anchor, current: empty, previous: null, months: [], expenseCategories: [], incomeCategories: [], recent: [] };
  }
  const earliest = all.reduce((min, t) => (t.date < min ? t.date : min), anchor);
  const r = ranges(period, anchor);
  const current = all.filter(within(r.current));
  // Só compara com o período anterior quando os dados cobrem esse período inteiro.
  const previous = r.previous && earliest <= r.previous.start ? all.filter(within(r.previous)) : null;

  const byMonth = new Map<string, MonthPoint>();
  for (const t of current) {
    const k = monthKey(t.date);
    const p = byMonth.get(k) ?? { month: k, receitas: 0, despesas: 0, saldo: 0 };
    if (t.type === "receita") p.receitas += t.amount;
    else p.despesas += t.amount;
    p.saldo = p.receitas - p.despesas;
    byMonth.set(k, p);
  }
  const months = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));

  const recent = [...current].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const prevTotals = previous && previous.length > 0 ? totals(previous) : null;

  return {
    anchor,
    current: totals(current),
    previous: prevTotals,
    months,
    expenseCategories: categoryShares(current, "despesa", 6),
    incomeCategories: categoryShares(current, "receita", 4),
    recent,
  };
}

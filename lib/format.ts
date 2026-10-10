const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

export const formatBRL = (v: number) => brl.format(v);
export const formatBRLCompact = (v: number) => brlCompact.format(v);
export const formatPct = (v: number) => pct.format(v);

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-03" -> "mar/26" */
export function formatMonth(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
}

/** "2026-03-15" -> "15/03/2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

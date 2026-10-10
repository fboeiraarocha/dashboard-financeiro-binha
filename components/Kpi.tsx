import { formatBRL, formatPct } from "@/lib/format";

type Props = {
  label: string;
  value: number | null;
  previous?: number | null;
  kind: "money" | "percent";
  /** true quando subir é bom (receita, saldo); false quando subir é ruim (despesa) */
  higherIsGood: boolean;
  swatch?: string;
  hero?: boolean;
};

export function Kpi({ label, value, previous, kind, higherIsGood, swatch, hero }: Props) {
  const fmt = (v: number) => (kind === "money" ? formatBRL(v) : formatPct(v));
  let delta: React.ReactNode = <span>Sem período anterior para comparar</span>;
  if (value !== null && previous !== null && previous !== undefined) {
    const diff = kind === "money" ? (previous !== 0 ? (value - previous) / Math.abs(previous) : null) : value - previous;
    if (diff !== null && Number.isFinite(diff)) {
      const up = diff >= 0;
      const good = up === higherIsGood;
      const text = kind === "money" ? formatPct(Math.abs(diff)) : `${(Math.abs(diff) * 100).toFixed(1).replace(".", ",")} p.p.`;
      delta = (
        <>
          <span className={`delta ${up ? "up" : "down"} ${good ? "good" : "bad"}`}>
            {up ? "▲" : "▼"} {text}
          </span>
          <span>vs. período anterior</span>
        </>
      );
    }
  }
  return (
    <div className={`card kpi${hero ? " kpi-hero" : ""}`}>
      <div className="kpi-label">
        {swatch && <span className="kpi-dot" style={{ background: swatch }} aria-hidden />}
        {label}
      </div>
      <div className="kpi-value num">{value === null ? "—" : fmt(value)}</div>
      <div className="kpi-delta">{delta}</div>
    </div>
  );
}

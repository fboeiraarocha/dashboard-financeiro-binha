import type { CategoryShare } from "@/lib/aggregate";
import { formatBRL, formatPct } from "@/lib/format";

export function CategoryBars({ data }: { data: CategoryShare[] }) {
  if (data.length === 0) return <div className="empty">Sem despesas no período.</div>;
  const max = Math.max(...data.map((d) => d.total));
  return (
    <ul className="bars">
      {data.map((d) => (
        <li key={d.category}>
          <div className="bar-row">
            <span className="name">{d.category}</span>
            <span className="val num">
              {formatBRL(d.total)} <span className="muted">· {formatPct(d.share)}</span>
            </span>
          </div>
          <div className="bar-track" aria-hidden>
            <div className={`bar-fill${d.category === "Outras" ? " muted" : ""}`} style={{ width: `${(d.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

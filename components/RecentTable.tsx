import { formatBRL, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function RecentTable({ rows }: { rows: Transaction[] }) {
  if (rows.length === 0) return <div className="empty">Nenhum lançamento no período.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Tipo</th>
            <th className="right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.date}-${i}`}>
              <td className="num muted">{formatDate(r.date)}</td>
              <td className="desc" title={r.description}>{r.description || <span className="muted">—</span>}</td>
              <td><span className="pill">{r.category}</span></td>
              <td className="muted">{r.type === "receita" ? "Receita" : "Despesa"}</td>
              <td className={`right num ${r.type === "receita" ? "amount-in" : "amount-out"}`}>
                {r.type === "receita" ? "+" : "−"} {formatBRL(r.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

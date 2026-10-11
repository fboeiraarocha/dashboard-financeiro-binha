"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import type { MonthPoint } from "@/lib/aggregate";
import { formatBRL, formatBRLCompact, formatMonth } from "@/lib/format";

const INCOME = "#4f8cff";
const EXPENSE = "#6f7f9f";

function Tip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as MonthPoint;
  return (
    <div className="tip num">
      <div className="tip-title">{formatMonth(String(label))}</div>
      <div className="tip-row">
        <span><i className="swatch" style={{ background: INCOME }} />Receitas</span>
        <span>{formatBRL(p.receitas)}</span>
      </div>
      <div className="tip-row">
        <span><i className="swatch" style={{ background: EXPENSE }} />Despesas</span>
        <span>{formatBRL(p.despesas)}</span>
      </div>
      <div className="tip-sep" />
      <div className="tip-row">
        <span>Saldo</span>
        <span style={{ color: p.saldo >= 0 ? "var(--good)" : "var(--bad)" }}>{formatBRL(p.saldo)}</span>
      </div>
    </div>
  );
}

export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  if (data.length === 0) return <div className="empty">Nenhum lançamento no período.</div>;
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} barGap={2} barCategoryGap={data.length > 12 ? "18%" : "28%"} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#1a253c" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tickLine={false}
            axisLine={{ stroke: "#1e2a43" }}
            tick={{ fill: "#7f8cab", fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickFormatter={(v: number) => formatBRLCompact(v)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#7f8cab", fontSize: 12 }}
            width={72}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="receitas" name="Receitas" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="despesas" name="Despesas" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

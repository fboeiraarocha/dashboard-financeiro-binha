import Link from "next/link";
import { CategoryBars } from "@/components/CategoryBars";
import { DataBanner } from "@/components/DataBanner";
import { Kpi } from "@/components/Kpi";
import { MonthlyChart } from "@/components/MonthlyChart";
import { RecentTable } from "@/components/RecentTable";
import { PERIODS, buildDashboard, parsePeriod } from "@/lib/aggregate";
import { loadData } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const period = parsePeriod((await searchParams).periodo);
  const data = await loadData();
  const d = buildDashboard(data.transactions, period);
  const prev = d.previous;

  return (
    <main>
      <DataBanner data={data} />

      <div className="page-head">
        <div>
          <h1>Visão geral</h1>
          <p>
            {d.current.count.toLocaleString("pt-BR")} lançamentos
            {d.anchor && <> · dados até {formatDate(d.anchor)}</>}
          </p>
        </div>
        <nav className="segmented" aria-label="Período">
          {PERIODS.map((p) => (
            <Link key={p.id} href={p.id === "12m" ? "/" : `/?periodo=${p.id}`} aria-current={p.id === period ? "true" : undefined} scroll={false}>
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid-kpi" aria-label="Indicadores">
        <Kpi label="Saldo do período" value={d.current.saldo} previous={prev?.saldo} kind="money" higherIsGood hero />
        <Kpi label="Receitas" value={d.current.receitas} previous={prev?.receitas} kind="money" higherIsGood swatch="var(--series-income)" />
        <Kpi label="Despesas" value={d.current.despesas} previous={prev?.despesas} kind="money" higherIsGood={false} swatch="var(--series-expense)" />
        <Kpi label="Margem" value={d.current.margem} previous={prev?.margem} kind="percent" higherIsGood />
      </section>

      <section className="grid-main">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Receitas e despesas por mês</h2>
              <p className="card-sub">Passe o mouse sobre um mês para ver o saldo</p>
            </div>
            <div className="legend">
              <span><i className="swatch" style={{ background: "var(--series-income)" }} />Receitas</span>
              <span><i className="swatch" style={{ background: "var(--series-expense)" }} />Despesas</span>
            </div>
          </div>
          <MonthlyChart data={d.months} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Para onde vai o dinheiro</h2>
              <p className="card-sub">Despesas por categoria no período</p>
            </div>
          </div>
          <CategoryBars data={d.expenseCategories} />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Últimos lançamentos</h2>
            <p className="card-sub">Os 10 mais recentes do período</p>
          </div>
        </div>
        <RecentTable rows={d.recent} />
      </section>
    </main>
  );
}

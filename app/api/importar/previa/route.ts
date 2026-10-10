import { NextResponse } from "next/server";
import { readUpload } from "@/lib/import";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { parsed } = await readUpload(req);
    const receitas = parsed.rows.filter((r) => r.type === "receita").reduce((a, r) => a + r.amount, 0);
    const despesas = parsed.rows.filter((r) => r.type === "despesa").reduce((a, r) => a + r.amount, 0);
    const dates = parsed.rows.map((r) => r.date).sort();
    return NextResponse.json({
      count: parsed.rows.length,
      totalLines: parsed.totalLines,
      receitas,
      despesas,
      firstDate: dates[0] ?? null,
      lastDate: dates[dates.length - 1] ?? null,
      columns: parsed.columns,
      issues: parsed.issues.slice(0, 50),
      issueCount: parsed.issues.length,
      sample: parsed.rows.slice(0, 8),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Não foi possível ler o arquivo." }, { status: 400 });
  }
}

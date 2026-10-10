import "server-only";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { Transaction, TxType } from "./types";

export type ParseIssue = { line: number; message: string };
export type ParseResult = {
  rows: Transaction[];
  issues: ParseIssue[];
  columns: Record<Field, string | null>;
  totalLines: number;
};

type Field = "date" | "description" | "category" | "type" | "amount" | "income" | "expense";
type Cell = string | number | Date | boolean | null;

export const MAX_ROWS = 20000;

const ALIASES: Record<Field, string[]> = {
  date: ["data", "date", "dt", "datalancamento", "datadelancamento", "datapagamento", "datadepagamento", "competencia", "vencimento", "datamovimento"],
  description: ["descricao", "description", "historico", "lancamento", "detalhe", "detalhes", "nome", "item", "memo"],
  category: ["categoria", "category", "grupo", "classificacao", "centrodecusto", "conta", "planodecontas"],
  type: ["tipo", "type", "natureza", "movimento", "operacao", "entradasaida", "es"],
  amount: ["valor", "amount", "value", "total", "quantia", "valorrs", "montante", "valorr"],
  income: ["receita", "receitas", "entrada", "entradas", "credito", "creditos"],
  expense: ["despesa", "despesas", "saida", "saidas", "debito", "debitos"],
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function detectColumns(header: Cell[]): Record<Field, number> {
  const found = { date: -1, description: -1, category: -1, type: -1, amount: -1, income: -1, expense: -1 } as Record<Field, number>;
  header.forEach((h, i) => {
    const key = normalize(String(h ?? ""));
    if (!key) return;
    for (const field of Object.keys(ALIASES) as Field[]) {
      if (found[field] === -1 && ALIASES[field].includes(key)) {
        found[field] = i;
        return;
      }
    }
  });
  return found;
}

const usable = (c: Record<Field, number>) => c.date >= 0 && (c.amount >= 0 || c.income >= 0 || c.expense >= 0);

export function parseAmount(v: Cell): number | null {
  if (v === null || v === "" || typeof v === "boolean") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return null;
  let s = v.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/r\$|brl|\s/gi, "");
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return negative ? -n : n;
}

const pad = (n: number) => String(n).padStart(2, "0");

function validDate(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > last) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseDate(v: Cell): string | null {
  if (v === null || v === "" || typeof v === "boolean") return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return validDate(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  }
  if (typeof v === "number") {
    // Número serial do Excel (dias desde 30/12/1899)
    if (v < 1 || v > 120000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return validDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return validDate(y, +m[2], +m[1]);
  }
  if (/^\d+(\.\d+)?$/.test(s)) return parseDate(Number(s));
  return null;
}

export function parseType(v: Cell): TxType | null {
  const s = normalize(String(v ?? ""));
  if (!s) return null;
  if (["receita", "receitas", "entrada", "entradas", "credito", "c", "e", "in", "income", "revenue", "recebimento"].includes(s)) return "receita";
  if (["despesa", "despesas", "saida", "saidas", "debito", "d", "s", "out", "expense", "pagamento", "custo"].includes(s)) return "despesa";
  return null;
}

function cellValue(v: ExcelJS.CellValue): Cell {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v instanceof Date) return v;
  if (typeof v === "object") {
    if ("result" in v) return cellValue(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text);
    if ("error" in v) return null;
  }
  return String(v);
}

async function readXlsx(buffer: ArrayBuffer): Promise<Cell[][][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb.worksheets.map((ws) => {
    const rows: Cell[][] = [];
    ws.eachRow({ includeEmpty: true }, (row, n) => {
      const values: Cell[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        values[col - 1] = cellValue(cell.value);
      });
      rows[n - 1] = values;
    });
    return Array.from(rows, (r) => r ?? []);
  });
}

function readCsv(buffer: ArrayBuffer): Cell[][] {
  let text = new TextDecoder("utf-8").decode(buffer);
  if (text.includes("�")) text = new TextDecoder("windows-1252").decode(buffer);
  text = text.replace(/^﻿/, "");
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy", delimitersToGuess: [";", ",", "\t", "|"] });
  return parsed.data;
}

export async function parseSpreadsheet(fileName: string, buffer: ArrayBuffer): Promise<ParseResult> {
  const ext = fileName.toLowerCase().split(".").pop();
  let sheets: Cell[][][];
  if (ext === "xlsx" || ext === "xlsm") sheets = await readXlsx(buffer);
  else if (ext === "csv" || ext === "txt" || ext === "tsv") sheets = [readCsv(buffer)];
  else if (ext === "xls") throw new Error("Arquivos .xls antigos não são suportados. Salve como .xlsx ou .csv e tente de novo.");
  else throw new Error("Formato não reconhecido. Envie um arquivo .xlsx ou .csv.");

  // Procura, em cada aba, uma linha de cabeçalho nas primeiras 15 linhas.
  for (const rows of sheets) {
    for (let h = 0; h < Math.min(rows.length, 15); h++) {
      const cols = detectColumns(rows[h] ?? []);
      if (usable(cols)) return extract(rows, h, cols);
    }
  }
  throw new Error(
    "Não encontrei as colunas obrigatórias. A planilha precisa de uma coluna de Data e uma de Valor (ou colunas Receita/Despesa). Baixe o modelo para ver o formato.",
  );
}

function extract(rows: Cell[][], headerIndex: number, cols: Record<Field, number>): ParseResult {
  const header = rows[headerIndex];
  const name = (i: number) => (i >= 0 ? String(header[i] ?? "").trim() : null);
  const result: ParseResult = {
    rows: [],
    issues: [],
    columns: {
      date: name(cols.date),
      description: name(cols.description),
      category: name(cols.category),
      type: name(cols.type),
      amount: name(cols.amount),
      income: name(cols.income),
      expense: name(cols.expense),
    },
    totalLines: 0,
  };

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const line = i + 1;
    if (r.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;
    result.totalLines++;
    const issue = (message: string) => {
      if (result.issues.length < 200) result.issues.push({ line, message });
    };

    const date = parseDate(r[cols.date] ?? null);
    if (!date) {
      issue(`Data inválida: "${String(r[cols.date] ?? "")}"`);
      continue;
    }

    const description = cols.description >= 0 ? String(r[cols.description] ?? "").trim().slice(0, 300) : "";
    const category = (cols.category >= 0 ? String(r[cols.category] ?? "").trim() : "").slice(0, 100) || "Sem categoria";
    const explicitType = cols.type >= 0 ? parseType(r[cols.type] ?? null) : null;

    const entries: { type: TxType; amount: number }[] = [];
    if (cols.amount >= 0) {
      const amount = parseAmount(r[cols.amount] ?? null);
      if (amount === null) {
        issue(`Valor inválido: "${String(r[cols.amount] ?? "")}"`);
        continue;
      }
      if (amount === 0) continue;
      const type = explicitType ?? (amount < 0 ? "despesa" : "receita");
      entries.push({ type, amount: Math.abs(amount) });
    } else {
      const inc = cols.income >= 0 ? parseAmount(r[cols.income] ?? null) : null;
      const exp = cols.expense >= 0 ? parseAmount(r[cols.expense] ?? null) : null;
      if (inc) entries.push({ type: "receita", amount: Math.abs(inc) });
      if (exp) entries.push({ type: "despesa", amount: Math.abs(exp) });
      if (entries.length === 0) {
        issue("Linha sem valor de receita nem de despesa");
        continue;
      }
    }

    for (const e of entries) {
      if (e.amount > 1e11) {
        issue("Valor alto demais");
        continue;
      }
      result.rows.push({ date, description, category, type: e.type, amount: Math.round(e.amount * 100) / 100 });
    }
    if (result.rows.length > MAX_ROWS) {
      throw new Error(`A planilha tem mais de ${MAX_ROWS.toLocaleString("pt-BR")} lançamentos. Divida em arquivos menores.`);
    }
  }
  return result;
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

type Preview = {
  count: number;
  totalLines: number;
  receitas: number;
  despesas: number;
  firstDate: string | null;
  lastDate: string | null;
  issues: { line: number; message: string }[];
  issueCount: number;
  sample: Transaction[];
};

async function send(url: string, file: File) {
  const body = new FormData();
  body.append("arquivo", file);
  const res = await fetch(url, { method: "POST", body });
  const json = await res.json().catch(() => ({ error: "Resposta inesperada do servidor." }));
  if (!res.ok) throw new Error(json.error ?? "Falha na requisição.");
  return json;
}

export function ImportClient({ enabled, firstImport }: { enabled: boolean; firstImport: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [drag, setDrag] = useState(false);

  async function choose(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(null);
    setError(null);
    setDone(null);
    setBusy("preview");
    try {
      setPreview(await send("/api/importar/previa", f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function commit() {
    if (!file) return;
    setBusy("commit");
    setError(null);
    try {
      const r = await send("/api/importar/confirmar", file);
      setDone(`${r.count.toLocaleString("pt-BR")} lançamentos importados de ${file.name}.`);
      setFile(null);
      setPreview(null);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setError(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <h2 style={{ marginBottom: 14 }}>Enviar arquivo</h2>
      {!enabled && (
        <p className="form-error">O banco de dados ainda não está conectado. Você pode conferir a leitura da planilha, mas a gravação fica liberada depois dessa etapa.</p>
      )}

      <label
        className={`dropzone${drag ? " drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choose(e.dataTransfer.files?.[0]);
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="var(--blue-400)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <strong>{file ? file.name : "Arraste a planilha aqui ou clique para escolher"}</strong>
        <span className="muted">.xlsx ou .csv, até 4 MB</span>
        <input
          ref={input}
          type="file"
          accept=".xlsx,.xlsm,.csv,.txt"
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </label>

      {busy === "preview" && <p className="muted" style={{ marginTop: 14 }}>Lendo a planilha…</p>}
      {error && <p className="form-error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
      {done && <p className="form-ok" role="status" style={{ marginTop: 14 }}>{done} O painel já mostra os novos dados.</p>}

      {preview && (
        <div>
          <div className="stats">
            <div className="stat"><div className="k">Lançamentos</div><div className="v num">{preview.count.toLocaleString("pt-BR")}</div></div>
            <div className="stat"><div className="k">Receitas</div><div className="v num">{formatBRL(preview.receitas)}</div></div>
            <div className="stat"><div className="k">Despesas</div><div className="v num">{formatBRL(preview.despesas)}</div></div>
            <div className="stat">
              <div className="k">Período</div>
              <div className="v num" style={{ fontSize: 14, marginTop: 6 }}>
                {preview.firstDate ? `${formatDate(preview.firstDate)} a ${formatDate(preview.lastDate!)}` : "—"}
              </div>
            </div>
          </div>

          {preview.issueCount > 0 && (
            <div className="issues">
              <strong>{preview.issueCount} linha(s) serão ignoradas:</strong>
              <ul>
                {preview.issues.map((i) => (
                  <li key={`${i.line}-${i.message}`}>Linha {i.line}: {i.message}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.sample.length > 0 && (
            <div className="table-wrap" style={{ margin: "16px 0 0", border: "1px solid var(--border)", borderRadius: 10 }}>
              <table>
                <thead>
                  <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="right">Valor</th></tr>
                </thead>
                <tbody>
                  {preview.sample.map((r, i) => (
                    <tr key={i}>
                      <td className="num muted">{formatDate(r.date)}</td>
                      <td className="desc">{r.description || "—"}</td>
                      <td><span className="pill">{r.category}</span></td>
                      <td className="right num">{r.type === "receita" ? "+" : "−"} {formatBRL(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {firstImport && enabled && preview.count > 0 && (
            <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
              Esta é a primeira importação: ao confirmar, os dados fictícios são desativados de forma permanente.
            </p>
          )}

          <div className="actions">
            <button className="btn btn-primary" onClick={commit} disabled={!enabled || preview.count === 0 || busy !== null}>
              {busy === "commit" ? "Importando…" : `Importar ${preview.count.toLocaleString("pt-BR")} lançamentos`}
            </button>
            <button className="btn btn-ghost" onClick={reset} disabled={busy !== null}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

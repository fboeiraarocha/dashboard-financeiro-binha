import { deleteImport } from "@/app/actions";
import { listImports, loadData } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { ImportClient } from "./ImportClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Importar planilha · Painel Financeiro" };

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function ImportPage() {
  const configured = supabaseConfigured();
  const [imports, data] = await Promise.all([listImports(), loadData()]);

  return (
    <main>
      <div className="page-head">
        <div>
          <h1>Importar planilha</h1>
          <p>Envie um arquivo .xlsx ou .csv. Você confere um resumo antes de gravar.</p>
        </div>
      </div>

      <div className="grid-import">
        <div className="card">
          <ImportClient enabled={configured} firstImport={data.mode === "demo"} />
        </div>

        <aside className="card">
          <h2>Formato esperado</h2>
          <p className="card-sub" style={{ marginBottom: 14 }}>Uma linha por lançamento, com cabeçalho na primeira linha.</p>
          <ol className="steps">
            <li><code>Data</code> no formato 31/12/2026 ou data do Excel <span className="muted">(obrigatória)</span></li>
            <li><code>Valor</code> como 1.234,56 <span className="muted">(obrigatório)</span></li>
            <li><code>Tipo</code> Receita ou Despesa. Sem essa coluna, valores negativos viram despesa.</li>
            <li><code>Descrição</code> e <code>Categoria</code> são opcionais.</li>
            <li>Também aceito colunas separadas <code>Receita</code> e <code>Despesa</code> no lugar de Valor.</li>
          </ol>
          <div className="actions">
            <a className="btn btn-sm" href="/modelo.csv" download="modelo-dashboard-financeiro.csv">Baixar modelo</a>
          </div>
        </aside>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <h2>Histórico de importações</h2>
            <p className="card-sub">Excluir uma importação remove os lançamentos que vieram dela</p>
          </div>
        </div>
        {imports.length === 0 ? (
          <div className="empty">Nenhuma planilha importada ainda.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Importado em</th>
                  <th className="right">Lançamentos</th>
                  <th className="right"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td className="desc" title={imp.file_name}>{imp.file_name}</td>
                    <td className="muted num">{dateTime.format(new Date(imp.created_at))}</td>
                    <td className="right num">{imp.row_count.toLocaleString("pt-BR")}</td>
                    <td className="right">
                      <form action={deleteImport}>
                        <input type="hidden" name="id" value={imp.id} />
                        <button className="btn btn-sm btn-danger">Excluir</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

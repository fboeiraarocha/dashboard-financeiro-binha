import Link from "next/link";
import type { LoadedData } from "@/lib/data";

export function DataBanner({ data }: { data: Pick<LoadedData, "mode" | "dbConfigured" | "dbError"> }) {
  if (data.dbError) {
    return (
      <div className="banner banner-warn" role="status">
        <span className="tag">Banco</span>
        <p>
          <strong>Não consegui ler o banco de dados.</strong> Confira se a migração do Supabase foi aplicada. Mostrando dados fictícios por enquanto.
        </p>
      </div>
    );
  }
  if (data.mode !== "demo") return null;
  return (
    <div className="banner" role="status">
      <span className="tag">Dados fictícios</span>
      <p>
        <strong>Estes números são de exemplo.</strong>{" "}
        {data.dbConfigured
          ? "Assim que você importar a primeira planilha real, os dados fictícios somem para sempre."
          : "O banco de dados ainda não está conectado, então a importação fica disponível depois dessa etapa."}
      </p>
      <Link href="/importar" className="btn btn-primary btn-sm">Importar planilha</Link>
    </div>
  );
}

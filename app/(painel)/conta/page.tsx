import { supabaseConfigured } from "@/lib/env";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conta · Painel Financeiro" };

export default function AccountPage() {
  return (
    <main>
      <div className="page-head">
        <div>
          <h1>Conta</h1>
          <p>Troque a senha de acesso ao painel.</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 440 }}>
        <h2 style={{ marginBottom: 14 }}>Alterar senha</h2>
        {supabaseConfigured() ? (
          <PasswordForm />
        ) : (
          <p className="muted">Disponível depois que o banco de dados estiver conectado.</p>
        )}
      </div>
    </main>
  );
}

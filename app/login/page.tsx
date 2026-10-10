import { LoginForm } from "./LoginForm";
import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "Entrar · Painel Financeiro" };

export default function LoginPage() {
  return (
    <main className="login-wrap">
      <div className="card login-card">
        <BrandMark size={36} />
        <h1>Painel Financeiro</h1>
        <p className="lead">Entre com a senha de acesso para ver os dados.</p>
        <LoginForm />
      </div>
    </main>
  );
}

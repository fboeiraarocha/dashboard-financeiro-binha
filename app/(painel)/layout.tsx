import Link from "next/link";
import { logout } from "@/app/actions";
import { BrandMark } from "@/components/BrandMark";
import { NavLinks } from "@/components/NavLinks";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <BrandMark />
          Painel Financeiro
        </Link>
        <NavLinks />
        <div className="topbar-end">
          <form action={logout}>
            <button className="btn btn-ghost btn-sm">Sair</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}

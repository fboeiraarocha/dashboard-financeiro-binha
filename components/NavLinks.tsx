"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Visão geral" },
  { href: "/importar", label: "Importar planilha" },
  { href: "/conta", label: "Conta" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Principal">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

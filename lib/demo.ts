import type { Transaction } from "./types";

// Gerador determinístico para que os dados fictícios sejam sempre os mesmos.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const EXPENSES: { category: string; base: number; items: string[] }[] = [
  { category: "Folha de pagamento", base: 38000, items: ["Salários", "Encargos trabalhistas"] },
  { category: "Fornecedores", base: 21000, items: ["Matéria-prima", "Embalagens", "Frete de compras"] },
  { category: "Aluguel", base: 9500, items: ["Aluguel do escritório"] },
  { category: "Impostos", base: 12500, items: ["Simples Nacional", "ISS"] },
  { category: "Marketing", base: 7000, items: ["Anúncios online", "Agência de conteúdo"] },
  { category: "Software", base: 2800, items: ["Licenças SaaS", "Hospedagem"] },
  { category: "Energia e água", base: 1900, items: ["Conta de energia", "Conta de água"] },
  { category: "Viagens", base: 2400, items: ["Passagens", "Hospedagem de viagem"] },
];

const INCOME: { category: string; base: number; items: string[] }[] = [
  { category: "Vendas", base: 82000, items: ["Vendas loja online", "Vendas no atacado", "Vendas balcão"] },
  { category: "Serviços", base: 24000, items: ["Consultoria", "Manutenção mensal"] },
  { category: "Outras receitas", base: 2500, items: ["Rendimentos financeiros"] },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function demoTransactions(today = new Date()): Transaction[] {
  const rand = rng(20261010);
  const out: Transaction[] = [];
  const months = 26;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    const isCurrent = i === 0;
    const maxDay = isCurrent ? Math.max(1, today.getDate()) : lastDay;
    const growth = 1 + (months - i) * 0.012;
    const season = 1 + 0.12 * Math.sin(((m - 3) / 12) * 2 * Math.PI);

    const push = (
      groups: typeof EXPENSES,
      type: Transaction["type"],
      factor: number,
    ) => {
      for (const g of groups) {
        const share = g.base / g.items.length;
        for (const item of g.items) {
          const day = 1 + Math.floor(rand() * maxDay);
          const noise = 0.82 + rand() * 0.36;
          const amount = Math.round(share * noise * factor * (isCurrent ? maxDay / lastDay : 1) * 100) / 100;
          out.push({ date: `${y}-${pad(m)}-${pad(day)}`, description: item, category: g.category, type, amount });
        }
      }
    };
    push(INCOME, "receita", growth * season);
    push(EXPENSES, "despesa", 1 + (months - i) * 0.008);
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

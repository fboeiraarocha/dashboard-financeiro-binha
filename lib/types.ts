export type TxType = "receita" | "despesa";

export type Transaction = {
  date: string; // AAAA-MM-DD
  description: string;
  category: string;
  type: TxType;
  amount: number; // sempre positivo; o tipo define o sinal
};

export type DataMode = "demo" | "real";

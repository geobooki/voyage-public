export type ExpenseSplit = { expenseId: string; amounts: Record<string, number> };
export type SettlementPayment = { id: string; expenseId?: string; fromId: string; toId: string; currency: string; amount: number; date: string };
export type SettlementRecords = { splits: ExpenseSplit[]; payments: SettlementPayment[] };

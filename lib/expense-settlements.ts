import type { Expense, Traveler } from "@/types/trip";
import type { SettlementRecords } from "./settlement-records";
import { calculateSettlements } from "./settlement";
export function expenseSettlements(expenses: Expense[], travelers: Traveler[], records: SettlementRecords) {
  const paymentsByExpense = new Map<string, typeof records.payments>();
  records.payments.forEach((payment) => { if (payment.expenseId) { const list = paymentsByExpense.get(payment.expenseId) || []; list.push(payment); paymentsByExpense.set(payment.expenseId, list); } });
  const splitsByExpense = new Map<string, (typeof records.splits)[number]>();
  records.splits.forEach((split) => { if (!splitsByExpense.has(split.expenseId)) splitsByExpense.set(split.expenseId, split); });
  return [...expenses].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map((expense) => {
    const payments = paymentsByExpense.get(expense.id) || [];
    const split = splitsByExpense.get(expense.id), splits = split ? [split] : [];
    const initial = calculateSettlements([expense], travelers, { splits, payments: [] });
    const remaining = calculateSettlements([expense], travelers, { splits, payments });
    const transfers = remaining.groups.flatMap((group) => group.transfers.map((transfer) => ({ ...transfer, currency: group.currency })));
    const valid = initial.excluded.length === 0 && remaining.invalidPayments.length === 0 && payments.every((payment) => payment.currency.toUpperCase() === expense.currency.toUpperCase() && [expense.payerId, ...(expense.participantIds || [])].includes(payment.fromId) && [expense.payerId, ...(expense.participantIds || [])].includes(payment.toId));
    return { expense, payments, transfers, valid, complete: valid && transfers.length === 0, partial: payments.length > 0 && transfers.length > 0, balances: remaining.groups[0]?.balances || [] };
  });
}

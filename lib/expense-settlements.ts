import type { Expense, Traveler } from "@/types/trip";
import type { SettlementRecords } from "./settlement-records";
import { calculateSettlements } from "./settlement";
export function expenseSettlements(expenses: Expense[], travelers: Traveler[], records: SettlementRecords) {
  return [...expenses].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map((expense) => {
    const payments = records.payments.filter((payment) => payment.expenseId === expense.id);
    const initial = calculateSettlements([expense], travelers, { splits: records.splits, payments: [] });
    const remaining = calculateSettlements([expense], travelers, { splits: records.splits, payments });
    const transfers = remaining.groups.flatMap((group) => group.transfers.map((transfer) => ({ ...transfer, currency: group.currency })));
    const valid = initial.excluded.length === 0 && remaining.invalidPayments.length === 0 && payments.every((payment) => payment.currency.toUpperCase() === expense.currency.toUpperCase() && [expense.payerId, ...(expense.participantIds || [])].includes(payment.fromId) && [expense.payerId, ...(expense.participantIds || [])].includes(payment.toId));
    return { expense, payments, transfers, valid, complete: valid && transfers.length === 0, partial: payments.length > 0 && transfers.length > 0, balances: remaining.groups[0]?.balances || [] };
  });
}

import type { Expense, Traveler } from "@/types/trip";

import type { SettlementRecords } from "./settlement-records";

export const currencyDigits = (currency: string) => {
  try { return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2; }
  catch { return 2; }
};
export type SettlementGroup = { currency: string; digits: number; total: number; count: number; balances: { id: string; name: string; paid: number; owed: number; balance: number }[]; transfers: { fromId: string; toId: string; from: string; to: string; amount: number }[] };
export function calculateSettlements(expenses: Expense[], travelers: Traveler[], records: SettlementRecords = { splits: [], payments: [] }) {
  const splitsByExpense = new Map<string, (typeof records.splits)[number]>();
  records.splits.forEach((split) => { if (!splitsByExpense.has(split.expenseId)) splitsByExpense.set(split.expenseId, split); });
  const people = new Map(travelers.map((person) => [person.id, person]));
  const excluded: { expense: Expense; reason: "payer" | "participants" | "amount" | "split" }[] = [];
  const groups = new Map<string, { digits: number; total: number; count: number; paid: Map<string, number>; owed: Map<string, number> }>();
  for (const expense of expenses) {
    const currency = (expense.currency || "KRW").trim().toUpperCase() || "KRW";
    const digits = currencyDigits(currency);
    const [coefficient, exponent = "0"] = String(Math.abs(expense.amount)).split("e");
    const units = Math.sign(expense.amount) * Math.round(Number(coefficient + "e" + (Number(exponent) + digits)));
    if (!Number.isFinite(expense.amount) || !Number.isSafeInteger(units)) { excluded.push({ expense, reason: "amount" }); continue; }
    if (!expense.payerId || !people.has(expense.payerId)) { excluded.push({ expense, reason: "payer" }); continue; }
    const participants = [...new Set(expense.participantIds || [])];
    if (!participants.length || participants.some((id) => !people.has(id))) { excluded.push({ expense, reason: "participants" }); continue; }
    const split = splitsByExpense.get(expense.id);
    const factor = 10 ** digits;
    const amounts = split ? participants.map((id) => split.amounts[id]) : [];
    const shareUnits = amounts.map((amount) => Math.round(amount * factor));
    if (split && (Object.keys(split.amounts).some((id) => !participants.includes(id)) || amounts.some((amount, index) => !Number.isFinite(amount) || !Number.isSafeInteger(shareUnits[index]) || Math.abs(amount * factor - shareUnits[index]) > 0.000001 || (units >= 0 ? amount < 0 : amount > 0)) || shareUnits.reduce((sum, amount) => sum + amount, 0) !== units)) { excluded.push({ expense, reason: "split" }); continue; }
    const group = groups.get(currency) || { digits, total: 0, count: 0, paid: new Map(), owed: new Map() };
    group.total += units; group.count++;
    group.paid.set(expense.payerId, (group.paid.get(expense.payerId) || 0) + units);
    const base = Math.floor(Math.abs(units) / participants.length), remainder = Math.abs(units) % participants.length;
    participants.forEach((id, index) => group.owed.set(id, (group.owed.get(id) || 0) + (split ? shareUnits[index] : Math.sign(units) * (base + (index < remainder ? 1 : 0)))));
    groups.set(currency, group);
  }
  const adjustments = new Map<string, Map<string, number>>();
  const invalidPayments: string[] = [];
  for (const payment of records.payments) {
    const currency = payment.currency.toUpperCase(), digits = currencyDigits(currency), units = Math.round(payment.amount * 10 ** digits);
    if (!people.has(payment.fromId) || !people.has(payment.toId) || payment.fromId === payment.toId || !Number.isFinite(payment.amount) || !Number.isSafeInteger(units) || Math.abs(payment.amount * 10 ** digits - units) > 0.000001 || units <= 0) { invalidPayments.push(payment.id); continue; }
    if (!groups.has(currency)) groups.set(currency, { digits, total: 0, count: 0, paid: new Map(), owed: new Map() });
    const values = adjustments.get(currency) || new Map<string, number>();
    values.set(payment.fromId, (values.get(payment.fromId) || 0) + units);
    values.set(payment.toId, (values.get(payment.toId) || 0) - units);
    adjustments.set(currency, values);
  }
  const result: SettlementGroup[] = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([currency, group]) => {
    const factor = 10 ** group.digits;
    const balances = travelers.map((person) => {
      const paid = group.paid.get(person.id) || 0, owed = group.owed.get(person.id) || 0;
      return { ...person, paid, owed, balance: paid - owed + (adjustments.get(currency)?.get(person.id) || 0) };
    });
    const debtors = balances.filter((person) => person.balance < 0).map((person) => ({ ...person, remaining: -person.balance }));
    const creditors = balances.filter((person) => person.balance > 0).map((person) => ({ ...person, remaining: person.balance }));
    const transfers: SettlementGroup["transfers"] = [];
    let debtor = 0, creditor = 0;
    while (debtor < debtors.length && creditor < creditors.length) {
      const from = debtors[debtor], to = creditors[creditor], amount = Math.min(from.remaining, to.remaining);
      transfers.push({ fromId: from.id, toId: to.id, from: from.name, to: to.name, amount: amount / factor });
      from.remaining -= amount; to.remaining -= amount;
      if (!from.remaining) debtor++;
      if (!to.remaining) creditor++;
    }
    return { currency, digits: group.digits, total: group.total / factor, count: group.count, balances: balances.map((person) => ({ ...person, paid: person.paid / factor, owed: person.owed / factor, balance: person.balance / factor })), transfers };
  });
  return { groups: result, excluded, invalidPayments, includedCount: result.reduce((sum, group) => sum + group.count, 0) };
}

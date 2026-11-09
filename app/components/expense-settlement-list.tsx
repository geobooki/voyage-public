"use client";
import { useState } from "react";
import { ExpenseParticipantFilter } from "./expense-participant-filter";
import { filterByParticipant } from "@/lib/expense-filters";
import { expenseSettlements } from "@/lib/expense-settlements";
import type { SettlementRecords } from "@/lib/settlement-records";
import type { Expense, Traveler } from "@/types/trip";
import { ExpenseSplitEditor, SettlementTransfer } from "./settlement-controls";
type Props = { expenses: Expense[]; travelers: Traveler[]; records: SettlementRecords; disabled: boolean; ko: boolean; mutate: (payload: Record<string, unknown>, remove?: boolean) => Promise<void> };
export function ExpenseSettlementList({ expenses, travelers, records, disabled, ko, mutate }: Props) {
  const [filter, setFilter] = useState("all");
  const effectiveFilter = filter.startsWith("person:") && !travelers.some((person) => `person:${person.id}` === filter) ? "all" : filter;
  const items = expenseSettlements(filterByParticipant(expenses, travelers, effectiveFilter), travelers, records);
  const active = items.filter((item) => !item.complete), completed = items.filter((item) => item.complete);
  const render = (item: (typeof items)[number]) => <section key={item.expense.id} className="min-w-0 rounded-xl border border-[var(--color-border)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h4 className="break-words text-sm font-semibold">{item.expense.name || item.expense.category}</h4><p className="mt-1 text-xs muted">{item.expense.date} · {item.expense.amount.toLocaleString()} {item.expense.currency}</p></div><span className="shrink-0 text-xs text-[var(--color-primary)]">{item.complete ? (ko ? "정산완료" : "Settled") : item.partial ? (ko ? "부분정산" : "Partly settled") : (ko ? "미정산" : "Unsettled")}</span></div>
    {!item.valid && <p className="mt-2 text-xs text-[var(--color-danger)]">{ko ? "결제자·분담자·분담액을 확인해 주세요." : "Review payer, participants and shares."}</p>}
    <details className="mt-3"><summary className="cursor-pointer text-sm">{ko ? "부분정산·분담 상세" : "Payment and share details"}</summary>
    {item.valid && <div className="mt-2 space-y-2">{item.balances.filter((person) => item.expense.participantIds?.includes(person.id) || person.id === item.expense.payerId).map((person) => { const paid = item.payments.filter((payment) => payment.fromId === person.id).reduce((sum, payment) => sum + payment.amount, 0); return <p key={person.id} className="break-words text-xs">{person.name} · {ko ? "분담 " : "Share "}{person.owed.toLocaleString()} · {ko ? "정산 보냄 " : "Sent "}{paid.toLocaleString()} · {ko ? "남은 차액 " : "Remaining "}{Math.abs(person.balance).toLocaleString()} {item.expense.currency}{person.id === item.expense.payerId ? (ko ? " (결제자)" : " (payer)") : ""}</p>; })}</div>}
    {item.valid && item.transfers.length > 0 && <div className="mt-3 space-y-2">{item.transfers.map((transfer) => <SettlementTransfer key={transfer.currency + transfer.fromId + transfer.toId} {...transfer} expenseId={item.expense.id} disabled={disabled} mutate={mutate} ko={ko}/>)}</div>}
    <div className="mt-3"><ExpenseSplitEditor key={JSON.stringify(records.splits.find((split) => split.expenseId === item.expense.id)) + item.expense.participantIds?.join(",")} expense={item.expense} travelers={travelers} split={records.splits.find((split) => split.expenseId === item.expense.id)} disabled={disabled} mutate={mutate} ko={ko}/></div>
    </details>
  </section>;
  return <section aria-label={ko ? "지출별 정산내역" : "Settlement by expense"} className="min-w-0 space-y-3"><h3 className="text-base font-semibold">{ko ? "지출별 정산내역" : "Settlement by expense"}</h3><ExpenseParticipantFilter travelers={travelers} value={effectiveFilter} onChange={setFilter} ko={ko}/><p className="text-xs muted">{ko ? "각 지출의 참여자별 정산을 확인해요. 완료된 지출은 아래 완료내역으로 이동해요." : "Track payments per expense. Settled expenses move into history."}</p>{records.payments.some((payment) => !payment.expenseId) && <p className="rounded-lg bg-[var(--color-background)] p-3 text-xs">{ko ? "기존 전체 정산 기록은 특정 지출에 연결되지 않아 지출별 완료로 표시하지 않아요. 중복 기록하지 않도록 하단 기록을 확인해 주세요." : "Earlier overall payments are not assigned to expenses. Review history before adding payments."}</p>}{active.map(render)}{!items.length && <p className="text-sm muted">{ko ? "이 조건에 해당하는 지출이 없어요." : "No expenses match this filter."}</p>}{!active.length && items.length > 0 && <p className="text-sm">{ko ? "미정산 지출이 없어요." : "No unsettled expenses."}</p>}{completed.length > 0 && <details className="rounded-xl border border-[var(--color-border)] p-3"><summary className="cursor-pointer text-sm">{ko ? `정산완료 지출 (${completed.length}건)` : `Settled expenses (${completed.length})`}</summary><div className="mt-3 space-y-3">{completed.map(render)}</div></details>}</section>;
}

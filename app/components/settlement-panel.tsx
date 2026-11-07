"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";
import { calculateSettlements } from "@/lib/settlement";
import type { Expense } from "@/types/trip";

export function SettlementPanel({ tripId, onEditExpense }: { tripId: string; onEditExpense?: (expense: Expense) => void }) {
  const { state } = useTripData();
  const { language } = useLanguage();
  const ko = language === "ko";
  const result = useMemo(() => calculateSettlements(state.expenses, state.travelers), [state.expenses, state.travelers]);
  const format = (amount: number, digits: number) => amount.toLocaleString(ko ? "ko-KR" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const reason = { payer: ko ? "결제자 확인 필요" : "Payer missing", participants: ko ? "참여자 확인 필요" : "Participants missing", amount: ko ? "금액 확인 필요" : "Invalid amount" };
  return <div className="min-w-0 space-y-4">
    <p className="text-xs muted">{ko ? "선택한 참여자끼리 균등 분담하고 결제한 금액을 차감해 계산해요. 통화별로 따로 정산하며 소수점 이하는 통화의 최소 단위로 나눠요." : "Split each expense among its selected participants and offset payments, separately by currency."}</p>
    <p className="text-sm">{ko ? `전체 ${state.expenses.length}건 중 ${result.includedCount}건 계산` : `${result.includedCount} of ${state.expenses.length} expenses calculated`}</p>
    {!state.travelers.length && <Link href={`/trips/${tripId}/before/budget#expense-travelers`} className="block text-sm text-[var(--color-primary)]">{ko ? "여행자를 먼저 추가해 주세요 →" : "Add travelers first →"}</Link>}
    {result.excluded.length > 0 && <section className="rounded-xl border border-[var(--color-warning)] p-3" aria-label={ko ? "정산 전 확인" : "Needs attention"}>
      <h3 className="text-sm font-semibold">{ko ? `정산 전 확인 · ${result.excluded.length}건` : `${result.excluded.length} expenses need attention`}</h3>
      <p className="mt-1 text-xs muted">{ko ? "아래 항목은 계산에서 제외했어요. 결제자와 참여자를 지정해야 전체 정산이 정확해져요." : "These expenses are excluded until their details are corrected."}</p>
      <div className="mt-2 space-y-2">{result.excluded.map(({ expense, reason: code }) => <div key={expense.id} className="min-w-0 rounded-lg bg-[var(--color-background)] p-3"><p className="break-words text-sm">{expense.name || expense.category} · {expense.currency} {expense.amount.toLocaleString()}</p><div className="mt-1 flex flex-wrap items-center justify-between gap-2"><p className="text-xs muted">{expense.date} · {reason[code]}</p>{onEditExpense ? <button type="button" onClick={() => onEditExpense(expense)} className="min-h-9 text-xs text-[var(--color-primary)]">{ko ? "지출 수정" : "Edit expense"}</button> : <Link href={`/trips/${tripId}/before/budget?expense=${encodeURIComponent(expense.id)}`} className="py-2 text-xs text-[var(--color-primary)]">{ko ? "지출 수정 →" : "Edit expense →"}</Link>}</div></div>)}</div>
    </section>}
    {result.groups.map((group) => <section key={group.currency} className="min-w-0 rounded-xl border border-[var(--color-border)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{group.currency} {ko ? "정산" : "settlement"}</h3><p className="text-xs muted">{group.count}{ko ? "건 · 합계 " : " expenses · "}{format(group.total, group.digits)} {group.currency}</p></div>
      <h4 className="mt-4 text-sm font-semibold">{ko ? "누가 누구에게 보내나요?" : "Who pays whom?"}</h4>
      <div className="mt-2 space-y-2">{group.transfers.length ? group.transfers.map((transfer) => <div key={transfer.fromId + ":" + transfer.toId} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--color-surface-muted)] p-3"><p className="min-w-0 break-words text-sm">{transfer.from} <span aria-hidden="true">→</span> {transfer.to}</p><strong className="break-all text-sm text-[var(--color-primary)]">{format(transfer.amount, group.digits)} {group.currency}</strong></div>) : <p className="text-sm muted">{ko ? "계산된 내역에서는 보낼 금액이 없어요." : "No transfers needed for the calculated expenses."}</p>}</div>
      <details className="mt-4"><summary className="cursor-pointer text-xs font-medium">{ko ? "여행자별 결제·분담 내역" : "Paid and owed by traveler"}</summary><div className="mt-2 space-y-2">{group.balances.map((person) => <div key={person.id} className="min-w-0 rounded-lg bg-[var(--color-background)] p-3"><p className="break-words text-sm font-medium">{person.name}</p><p className="mt-1 text-xs muted">{ko ? "결제 " : "Paid "}{format(person.paid, group.digits)} · {ko ? "분담 " : "Share "}{format(person.owed, group.digits)} {group.currency}</p><p className="mt-1 text-xs text-[var(--color-primary)]">{person.balance > 0 ? (ko ? "받을 금액 " : "Receive ") : person.balance < 0 ? (ko ? "보낼 금액 " : "Send ") : (ko ? "차액 " : "Balance ")}{format(Math.abs(person.balance), group.digits)} {group.currency}</p></div>)}</div></details>
    </section>)}
    {!state.expenses.length && <p className="rounded-xl bg-[var(--color-background)] p-4 text-sm muted">{ko ? "지출을 기록하면 여기서 바로 정산할 수 있어요." : "Record expenses to calculate a settlement."}</p>}
  </div>;
}

"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";
import { calculateSettlements } from "@/lib/settlement";
import { useSettlementRecords } from "@/lib/use-settlement-records";
import { ExpenseSettlementList } from "./expense-settlement-list";
import type { Expense } from "@/types/trip";

export function SettlementPanel({ tripId, onEditExpense }: { tripId: string; onEditExpense?: (expense: Expense) => void }) {
  const { state } = useTripData();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { records, loading, error: loadError, mutate, refresh } = useSettlementRecords(tripId);
  const [busyId, setBusyId] = useState(""); const [error, setError] = useState("");
  const result = useMemo(() => calculateSettlements(state.expenses, state.travelers, records), [state.expenses, state.travelers, records]);
  const undo = async (id: string) => { if (busyId) return; setBusyId(id); setError(""); try { await mutate({ id }, true); } catch (caught) { setError(caught instanceof Error ? caught.message : "저장 오류"); } finally { setBusyId(""); } };
  const format = (amount: number, digits: number) => amount.toLocaleString(ko ? "ko-KR" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const reason = { split: ko ? "분담액 합계·참여자 확인 필요" : "Review custom shares", payer: ko ? "결제자 확인 필요" : "Payer missing", participants: ko ? "참여자 확인 필요" : "Participants missing", amount: ko ? "금액 확인 필요" : "Invalid amount" };
  return <div className="min-w-0 space-y-4">
    {loading && <p role="status" className="text-xs muted">{ko ? "정산 기록 불러오는 중…" : "Loading settlements…"}</p>}
    {loadError && <div role="alert" className="rounded-xl border border-[var(--color-warning)] p-3 text-xs"><p>{loadError}</p>{loadError.includes("settlement-records.sql") && <p className="mt-2"><a href="https://github.com/geobooki/voyage-public/blob/main/supabase/settlement-records.sql" target="_blank" rel="noreferrer" className="underline">{ko ? "정산 테이블 SQL 열기 → Supabase SQL Editor에서 실행 후 다시 불러오기" : "Open SQL → run in Supabase SQL Editor, then retry"}</a></p>}<p className="mt-1">{ko ? "아래 금액에는 저장된 정산 기록이 반영되지 않았을 수 있어요." : "Balances may not include saved records."}</p><button type="button" onClick={() => void refresh()} className="mt-2 underline">{ko ? "다시 불러오기" : "Retry"}</button></div>}
    <p className="text-xs muted">{ko ? "기본은 균등 분담이에요. 상세에서 직접 분담액을 정하고 실제로 보낸 금액을 기록할 수 있어요. 기록은 송금 실행이 아니에요. 통화별로 따로 정산하며 소수점 이하는 통화의 최소 단위로 나눠요." : "Split each expense among its selected participants and offset payments, separately by currency."}</p>
    <p className="text-sm">{ko ? `전체 ${state.expenses.length}건 중 ${result.includedCount}건 계산` : `${result.includedCount} of ${state.expenses.length} expenses calculated`}</p>
    {!state.travelers.length && <Link href={`/trips/${tripId}/before/budget#expense-travelers`} className="block text-sm text-[var(--color-primary)]">{ko ? "여행자를 먼저 추가해 주세요 →" : "Add travelers first →"}</Link>}
    {result.excluded.length > 0 && <section className="rounded-xl border border-[var(--color-warning)] p-3" aria-label={ko ? "정산 전 확인" : "Needs attention"}>
      <h3 className="text-sm font-semibold">{ko ? `정산 전 확인 · ${result.excluded.length}건` : `${result.excluded.length} expenses need attention`}</h3>
      <p className="mt-1 text-xs muted">{ko ? "아래 항목은 계산에서 제외했어요. 결제자와 참여자를 지정해야 전체 정산이 정확해져요." : "These expenses are excluded until their details are corrected."}</p>
      <div className="mt-2 space-y-2">{result.excluded.map(({ expense, reason: code }) => <div key={expense.id} className="min-w-0 rounded-lg bg-[var(--color-background)] p-3"><p className="break-words text-sm">{expense.name || expense.category} · {expense.currency} {expense.amount.toLocaleString()}</p><div className="mt-1 flex flex-wrap items-center justify-between gap-2"><p className="text-xs muted">{expense.date} · {reason[code]}</p>{onEditExpense ? <button type="button" onClick={() => onEditExpense(expense)} className="min-h-9 text-xs text-[var(--color-primary)]">{ko ? "지출 수정" : "Edit expense"}</button> : <Link href={`/trips/${tripId}/before/budget?expense=${encodeURIComponent(expense.id)}`} className="py-2 text-xs text-[var(--color-primary)]">{ko ? "지출 수정 →" : "Edit expense →"}</Link>}</div></div>)}</div>
    </section>}
    <ExpenseSettlementList expenses={state.expenses} travelers={state.travelers} records={records} disabled={loading || Boolean(loadError)} ko={ko} mutate={mutate}/>
    <details><summary className="cursor-pointer text-sm">{ko ? "전체 차액 요약" : "Overall net balance"}</summary>
    {!loading && !loadError && result.includedCount > 0 && !result.groups.some((group) => group.transfers.length) && <p role="status" className="rounded-xl bg-[var(--color-surface-muted)] p-4 text-sm">{ko ? "남은 정산금액이 없어요." : "No outstanding settlement balance."}</p>}
    {result.groups.filter((group) => group.transfers.length > 0).map((group) => <section key={group.currency} className="min-w-0 rounded-xl border border-[var(--color-border)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{group.currency} {ko ? "남은 정산" : "Outstanding settlement"}</h3><p className="text-xs muted">{group.count}{ko ? "건 · 지출합계 " : " expenses · Spent "}{format(group.total, group.digits)} {group.currency}</p></div>
      <h4 className="mt-4 text-sm font-semibold">{ko ? "누가 누구에게 보내나요?" : "Who pays whom?"}</h4>
      <div className="mt-2 space-y-2">{group.transfers.length ? group.transfers.map((transfer) => <p key={transfer.fromId + transfer.toId} className="rounded-lg bg-[var(--color-background)] p-3 text-sm">{transfer.from} → {transfer.to} · {format(transfer.amount, group.digits)} {group.currency}</p>) : <p className="text-sm muted">{ko ? "계산된 내역에서는 보낼 금액이 없어요." : "No transfers needed for the calculated expenses."}</p>}</div>
      <details className="mt-4"><summary className="cursor-pointer text-xs font-medium">{ko ? "여행자별 결제·분담 내역" : "Paid and owed by traveler"}</summary><div className="mt-2 space-y-2">{group.balances.map((person) => <div key={person.id} className="min-w-0 rounded-lg bg-[var(--color-background)] p-3"><p className="break-words text-sm font-medium">{person.name}</p><p className="mt-1 text-xs muted">{ko ? "결제 " : "Paid "}{format(person.paid, group.digits)} · {ko ? "분담 " : "Share "}{format(person.owed, group.digits)} {group.currency}</p><p className="mt-1 text-xs text-[var(--color-primary)]">{person.balance > 0 ? (ko ? "받을 금액 " : "Receive ") : person.balance < 0 ? (ko ? "보낼 금액 " : "Send ") : (ko ? "차액 " : "Balance ")}{format(Math.abs(person.balance), group.digits)} {group.currency}</p></div>)}</div></details>
    </section>)}
    </details>
    {records.payments.length > 0 && <details className="rounded-xl border border-[var(--color-border)] p-3"><summary className="cursor-pointer text-sm">{ko ? `완료·부분정산 기록 보기 (${records.payments.length}건)` : `View payment history (${records.payments.length})`}</summary><p className="mt-2 text-xs muted">{ko ? "현재 정산내역에서 제외된 금액이에요. 체크를 해제하면 취소하고 잔액에 다시 반영해요." : "These payments have already been deducted. Uncheck to undo and restore the balance."}</p><div className="mt-3 space-y-2">{records.payments.map((payment) => <label key={payment.id} className="flex min-h-10 items-start gap-2 rounded-lg bg-[var(--color-background)] p-3 text-xs"><input type="checkbox" checked disabled={Boolean(busyId) || loading || Boolean(loadError)} onChange={() => void undo(payment.id)}/><span className="min-w-0 break-words">{state.travelers.find((person) => person.id === payment.fromId)?.name || "삭제된 여행자"} → {state.travelers.find((person) => person.id === payment.toId)?.name || "삭제된 여행자"} · {payment.amount.toLocaleString()} {payment.currency}<span className="mt-1 block">{payment.expenseId ? state.expenses.find((expense) => expense.id === payment.expenseId)?.name || (ko ? "연결 지출 삭제됨" : "Deleted expense") : (ko ? "전체 정산 · 지출 미연결" : "Overall payment · unassigned")}</span><span className="mt-1 block muted">{new Date(payment.date).toLocaleString(ko ? "ko-KR" : "en-US")}</span></span></label>)}</div>{result.invalidPayments.length > 0 && <p className="mt-2 text-xs text-[var(--color-danger)]">{ko ? "여행자가 없거나 금액이 잘못된 기록은 계산에서 제외했어요. 해당 기록을 취소해 주세요." : "Invalid payment records are excluded. Please undo them."}</p>}</details>}
    {error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}
    {!state.expenses.length && <p className="rounded-xl bg-[var(--color-background)] p-4 text-sm muted">{ko ? "지출을 기록하면 여기서 바로 정산할 수 있어요." : "Record expenses to calculate a settlement."}</p>}
  </div>;
}

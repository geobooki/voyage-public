"use client";
import { FormEvent, useRef, useState } from "react";
import { MoneyField } from "./money-field";
import type { Expense, Traveler } from "@/types/trip";
import type { ExpenseSplit } from "@/lib/settlement-records";
type Mutate = (payload: Record<string, unknown>, remove?: boolean) => Promise<void>;
const control = "mt-1 min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm";
export function SettlementTransfer({ fromId, toId, from, to, amount, currency, disabled, mutate, ko, expenseId }: { fromId: string; toId: string; from: string; to: string; amount: number; currency: string; disabled: boolean; mutate: Mutate; ko: boolean; expenseId?: string }) {
  const [partial, setPartial] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const pending = useRef<string | null>(null); const lock = useRef(false);
  const record = async (value: number) => {
    if (lock.current || disabled) return;
    if (!Number.isFinite(value) || value <= 0 || value > amount) { setError(ko ? "남은 정산금액 이내로 입력하세요." : "Enter a positive amount within the balance."); return; }
    lock.current = true; setBusy(true); setError("");
    pending.current ||= crypto.randomUUID();
    try { await mutate({ kind: "payment", id: pending.current, expenseId, fromId, toId, currency, amount: value, date: new Date().toISOString() }); pending.current = null; setPartial(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "저장 오류"); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="min-w-0 rounded-xl bg-[var(--color-surface-muted)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-words text-sm">{from} → {to}</p><strong className="text-sm text-[var(--color-primary)]">{amount.toLocaleString()} {currency}</strong></div><label className="mt-3 flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" disabled={disabled || busy} checked={false} onChange={() => void record(amount)}/>{ko ? "정산완료" : "Mark settled"}</label><details className="mt-2"><summary className="cursor-pointer text-xs">{ko ? "상세 · 부분정산" : "Details · partial payment"}</summary><form className="mt-2 flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void record(Number(partial)); }}><label className="min-w-0 flex-1 text-xs">{ko ? "이번에 보낸 금액" : "Amount sent"}<MoneyField required value={partial} onChange={(value) => { setPartial(value); pending.current = null; }} className={control}/></label><button disabled={disabled || busy} className="shrink-0 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50">{busy ? "…" : ko ? "기록" : "Record"}</button></form></details>{error && <p role="alert" className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}</div>;
}
export function ExpenseSplitEditor({ expense, travelers, split, mutate, disabled, ko }: { expense: Expense; travelers: Traveler[]; split?: ExpenseSplit; mutate: Mutate; disabled: boolean; ko: boolean }) {
  const people = travelers.filter((person) => expense.participantIds?.includes(person.id));
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(people.map((person) => [person.id, split ? String(split.amounts[person.id] ?? "") : ""])));
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); if (busy) return;
    const amounts = Object.fromEntries(people.map((person) => [person.id, Number(values[person.id])]));
    if (people.some((person) => !values[person.id]?.trim() || !Number.isFinite(amounts[person.id]))) { setError(ko ? "모든 분담액을 입력하세요." : "Enter all shares."); return; }
    setBusy(true); setError(""); try { await mutate({ kind: "split", id: expense.id, amounts }); } catch (caught) { setError(caught instanceof Error ? caught.message : "저장 오류"); } finally { setBusy(false); }
  };
  const reset = async () => { setBusy(true); setError(""); try { await mutate({ id: expense.id }, true); } catch (caught) { setError(caught instanceof Error ? caught.message : "저장 오류"); } finally { setBusy(false); } };
  return <details className="rounded-xl border border-[var(--color-border)] p-3"><summary className="cursor-pointer break-words text-sm">{ko ? "상세 · 분담금액 · " : "Details · shares · "}{expense.name || expense.category} · {expense.amount.toLocaleString()} {expense.currency} · {split ? (ko ? "직접 분담" : "Custom") : (ko ? "균등 분담" : "Equal")}</summary><p className="mt-2 text-xs muted">{ko ? "실제 부담할 금액을 입력하세요. 합계는 지출 금액과 같아야 해요." : "Enter each person's share. The sum must equal the expense."}</p><form onSubmit={save} className="mt-3 space-y-3"><fieldset disabled={disabled || busy} className="grid min-w-0 grid-cols-2 gap-2">{people.map((person) => <label key={person.id} className="min-w-0 text-xs">{person.name}<input required type="number" step="any" inputMode="decimal" value={values[person.id] ?? ""} onChange={(event) => setValues({ ...values, [person.id]: event.target.value })} className={control}/></label>)}</fieldset><p className="text-xs muted">{ko ? "입력 합계 " : "Total "}{Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0).toLocaleString()} / {expense.amount.toLocaleString()} {expense.currency}</p><div className="flex flex-wrap gap-2"><button disabled={disabled || busy || !people.length} className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm text-white disabled:opacity-50">{ko ? "분담액 저장" : "Save shares"}</button>{split && <button type="button" disabled={disabled || busy} onClick={() => void reset()} className="rounded-xl border px-3 py-2 text-sm">{ko ? "균등 분담으로 복구" : "Reset equal split"}</button>}</div>{error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}</form></details>;
}

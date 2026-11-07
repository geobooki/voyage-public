"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";
import { MoneyField } from "./money-field";

const control = "min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";
const now = () => { const date = new Date(); return { date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, time: date.toTimeString().slice(0, 5) }; };

export function QuickExpenseForm({ tripId, defaultCurrency, onClose, onSaved }: { tripId: string; defaultCurrency: string; onClose: () => void; onSaved?: (date: string) => void }) {
  const { state, saveExpenseEntry } = useTripData();
  const { language } = useLanguage(); const ko = language === "ko";
  const [form, setForm] = useState(() => ({ name: "", amount: "", currency: defaultCurrency, category: "", memo: "", paymentMethod: "카드", payerId: "", participantIds: [] as string[], ...now() }));
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null); const initialized = useRef(false); const busy = useRef(false);
  const dialogRef = useRef<HTMLElement>(null); const key = `voyage:expense-defaults:${tripId}`;
  const categories = [...new Set([...state.expenseCategories, ...state.budgetCategories])];
  useEffect(() => {
    if (initialized.current || !state.travelers.length) return;
    initialized.current = true;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      const ids = new Set(state.travelers.map((person) => person.id));
      if (stored && typeof stored === "object") setForm((current) => ({ ...current, payerId: ids.has(stored.payerId) ? stored.payerId : "", participantIds: Array.isArray(stored.participantIds) ? [...new Set<string>(stored.participantIds.filter((id: unknown): id is string => typeof id === "string" && ids.has(id)))] : [] }));
    } catch { /* Storage is optional. */ }
  }, [key, state.travelers]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; amountRef.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy.current) return;
    if (!form.name.trim() || !form.amount || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) { setError(ko ? "이름과 0보다 큰 금액을 입력하세요." : "Enter a name and a positive amount."); return; }
    const keepAdding = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "continue";
    busy.current = true; setSaving(true); setError(""); setSaved(false);
    try {
      const ids = new Set(state.travelers.map((person) => person.id));
      const payerId = ids.has(form.payerId) ? form.payerId : undefined;
      const participantIds = form.participantIds.filter((id) => ids.has(id));
      await saveExpenseEntry({ ...form, name: form.name.trim(), amount: Number(form.amount), category: form.category || "기타", memo: form.memo.trim(), payerId, participantIds });
      try { localStorage.setItem(key, JSON.stringify({ payerId, participantIds })); } catch { /* Saving expenses does not depend on storage. */ }
      onSaved?.(form.date);
      if (keepAdding) { setForm((current) => ({ ...current, name: "", amount: "", memo: "", ...now(), payerId: payerId || "", participantIds })); setSaved(true); requestAnimationFrame(() => amountRef.current?.focus()); } else onClose();
    } catch (caught) { setError(caught instanceof Error ? caught.message : (ko ? "저장하지 못했어요. 다시 시도해주세요." : "Could not save. Please retry.")); }
    finally { busy.current = false; setSaving(false); }
  };
  const payer = state.travelers.find((person) => person.id === form.payerId)?.name;
  const participants = state.travelers.filter((person) => form.participantIds.includes(person.id)).map((person) => person.name).join(", ");
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-3 py-4"><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="quick-expense-title" className="card max-h-[88dvh] w-full max-w-md overflow-y-auto p-4 sm:p-6" onKeyDown={(event) => {
    if (event.key === "Escape" && !busy.current) onClose();
    if (event.key !== "Tab") return;
    const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, a[href]') || []).filter((node) => node.getClientRects().length);
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><div className="flex items-center justify-between gap-3"><h2 id="quick-expense-title" className="text-lg">{ko ? "지출 빠르게 추가" : "Quick expense"}</h2><button type="button" disabled={saving} onClick={onClose} aria-label={ko ? "닫기" : "Close"} className="grid size-10 place-items-center rounded-xl text-xl">×</button></div>
    <form onSubmit={submit} className="mt-3 space-y-3"><fieldset disabled={saving} className="min-w-0 space-y-3">
      <div className="grid grid-cols-2 gap-2"><label className="min-w-0 text-xs">{ko ? "금액 *" : "Amount *"}<MoneyField inputRef={amountRef} autoFocus ariaLabel={ko ? "빠른 지출 금액" : "Quick expense amount"} required inputMode="numeric" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} className={`mt-1 ${control}`} /></label><label className="min-w-0 text-xs">{ko ? "통화" : "Currency"}<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className={`mt-1 ${control}`}>{[...new Set([defaultCurrency, form.currency, "KRW", "USD", state.exchange.to])].filter(Boolean).map((currency) => <option key={currency}>{currency}</option>)}</select></label></div>
      <label className="block text-xs">{ko ? "지출 이름 *" : "Expense name *"}<input required aria-label={ko ? "빠른 지출 이름" : "Quick expense name"} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={ko ? "예: 점심 식사" : "e.g. Lunch"} className={`mt-1 ${control}`} /></label>
      <details className="rounded-xl border border-[var(--color-border)] p-3"><summary className="cursor-pointer break-words text-xs">{ko ? `결제: ${payer || "선택 안 함"} · 분담: ${participants || "선택 안 함"}` : `Paid by: ${payer || "None"} · Split: ${participants || "None"}`}</summary><div className="mt-3 space-y-3"><label className="block text-xs">{ko ? "결제자" : "Payer"}<select aria-label={ko ? "결제자" : "Payer"} value={form.payerId} onChange={(event) => setForm({ ...form, payerId: event.target.value })} className={`mt-1 ${control}`}><option value="">{ko ? "선택 안 함" : "None"}</option>{state.travelers.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><fieldset><legend className="mb-2 text-xs">{ko ? "참여자 · 분담자" : "Participants"}</legend><div className="flex flex-wrap gap-2">{state.travelers.map((person) => <label key={person.id} className="flex min-h-10 items-center gap-2 rounded-lg bg-[var(--color-background)] px-3 text-xs"><input type="checkbox" checked={form.participantIds.includes(person.id)} onChange={(event) => setForm({ ...form, participantIds: event.target.checked ? [...form.participantIds, person.id] : form.participantIds.filter((id) => id !== person.id) })}/>{person.name}</label>)}</div></fieldset>{!state.travelers.length && <a href={`/trips/${tripId}/before/budget#expense-travelers`} className="text-xs underline">{ko ? "여행자 추가하기" : "Add travelers"}</a>}</div></details>
      <p className="text-xs muted">{form.paymentMethod} · {form.date} {form.time}{ko ? " · 결제자·분담자가 없으면 정산에서 제외돼요." : " · Expenses without payer/participants are excluded from settlement."}</p>
      <details className="text-xs"><summary className="cursor-pointer">{ko ? "카테고리 · 메모 · 날짜 · 결제수단" : "Category · memo · date · payment"}</summary><div className="mt-3 space-y-3"><label className="block">{ko ? "카테고리 (선택)" : "Category (optional)"}<select className={`mt-1 ${control}`} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">{ko ? "기타" : "Other"}</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block">{ko ? "메모 (선택)" : "Memo (optional)"}<input className={`mt-1 ${control}`} value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })}/></label><div className="grid grid-cols-2 gap-2"><label>{ko ? "날짜" : "Date"}<input required type="date" className={`mt-1 ${control}`} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label><label>{ko ? "시간" : "Time"}<input required type="time" className={`mt-1 ${control}`} value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })}/></label></div><label className="block">{ko ? "결제수단" : "Payment method"}<select className={`mt-1 ${control}`} value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>{[...new Set(["카드", ...state.paymentMethods])].map((method) => <option key={method}>{method}</option>)}</select></label></div></details>
    </fieldset>{error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}{saved && <p role="status" className="text-xs">{ko ? "저장했어요. 다음 지출을 입력하세요." : "Saved. Add the next expense."}</p>}<div className="grid grid-cols-2 gap-2 pt-2"><button disabled={saving} type="submit" value="continue" className="rounded-xl border border-[var(--color-border)] px-3 py-3 text-sm disabled:opacity-50">{ko ? "저장 후 계속 추가" : "Save & add another"}</button><button disabled={saving} type="submit" value="close" className="rounded-xl bg-[var(--color-primary)] px-3 py-3 text-sm text-white disabled:opacity-50">{saving ? (ko ? "저장 중…" : "Saving…") : (ko ? "저장" : "Save")}</button></div></form>
  </section></div>;
}

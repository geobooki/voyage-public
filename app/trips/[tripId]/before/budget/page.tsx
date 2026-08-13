"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatTotals } from "@/lib/money";
import { useTripStore } from "@/lib/trip-store";

const control = "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export default function BudgetPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state, addBudget, removeBudget } = useTripStore(tripId);
  const [item, setItem] = useState({ category: "Food", amount: "", currency: "KRW" });
  const add = (event: FormEvent) => { event.preventDefault(); if (!item.amount) return; addBudget({ category: item.category, amount: Number(item.amount), currency: item.currency }); setItem({ ...item, amount: "" }); };
  const total = formatTotals(state.budget);
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-3xl"><Link href={`/trips/${tripId}/before`} className="text-sm font-bold text-[var(--color-primary)]">← Before overview</Link><p className="eyebrow mt-10 mb-3">Estimated budget</p><h1 className="text-4xl font-bold">Give every yen a purpose.</h1><p className="mt-2 muted">Plan costs before they become surprises. Totals stay separated by currency.</p><div className="card mt-9 p-6 sm:p-8"><p className="eyebrow mb-2">Estimated total</p><p className="text-4xl font-bold">{total || "—"}</p><form onSubmit={add} className="mt-7 grid gap-3 sm:grid-cols-[1fr_1fr_.7fr_auto]"><select value={item.category} onChange={(event) => setItem({ ...item, category: event.target.value })} className={control}><option>Flights</option><option>Accommodation</option><option>Transport</option><option>Food</option><option>Shopping</option><option>Activities</option><option>Other</option></select><input required type="number" value={item.amount} onChange={(event) => setItem({ ...item, amount: event.target.value })} placeholder="Estimated amount" className={control}/><select value={item.currency} onChange={(event) => setItem({ ...item, currency: event.target.value })} className={control}><option>KRW</option><option>JPY</option><option>USD</option></select><button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">Add</button></form><div className="mt-8 space-y-2">{state.budget.map((budget) => <div className="flex items-center justify-between rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm" key={budget.id}><span className="font-semibold">{budget.category}</span><span className="flex items-center gap-3"><span className="font-bold">{budget.currency ?? "KRW"} {budget.amount.toLocaleString()}</span><button type="button" onClick={() => removeBudget(budget.id)} className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" aria-label={`Delete ${budget.category} budget`}>Delete</button></span></div>)}</div></div></div></main>;
}

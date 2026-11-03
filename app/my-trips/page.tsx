"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type Trip = { id: string; slug?: string; title: string; start_date?: string; end_date?: string; destination_currency?: string };
type Expense = { amount: number; currency: string; payer_id?: string; category: string; name?: string };
type RecordItem = { trip: Trip; expenses: Expense[]; travelers: { id: string; name: string }[] };

const totalByCurrency = (expenses: Expense[]) => Object.entries(expenses.reduce<Record<string, number>>((result, item) => ({ ...result, [item.currency]: (result[item.currency] || 0) + item.amount }), {})).map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`).join(" · ");

export default function MyTripsPage() {
  const { language } = useLanguage();
  const ko = language === "ko";
  const [records, setRecords] = useState<RecordItem[]>([]);
  useEffect(() => {
    void fetch("/api/trips").then((response) => response.json()).then(async (result) => {
      const trips = (result.trips || []) as Trip[];
      const next = await Promise.all(trips.map(async (trip) => {
        const response = await fetch(`/api/trips/${trip.slug || trip.id}?view=after`);
        const data = response.ok ? await response.json() : {};
        return { trip, expenses: (data.expenses || []) as Expense[], travelers: (data.travelers || []) as { id: string; name: string }[] };
      }));
      setRecords(next);
    }).catch(() => setRecords([]));
  }, []);
  return <main className="min-h-screen px-5 py-8 pb-24 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "개요" : "Overview"}</Link><p className="eyebrow mt-10 mb-3">{ko ? "내 여행 기록" : "My travel archive"}</p><h1 className="text-4xl font-bold">{ko ? "내가 다녀온 여행" : "Trips I have taken"}</h1><p className="mt-2 muted">{ko ? "여행별 지출과 정산 기록을 한곳에서 확인해요." : "Review spending and settlement records across your trips."}</p><div className="mt-8 space-y-4">{records.length ? records.map(({ trip, expenses, travelers }) => <article key={trip.id} className="card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{trip.title}</h2><p className="mt-1 text-sm muted">{trip.start_date || ""}{trip.end_date ? ` — ${trip.end_date}` : ""}</p></div><Link href={`/trips/${trip.slug || trip.id}/after`} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)]">{ko ? "여행 기록 보기" : "Open record"}</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[var(--color-background)] p-4"><p className="text-xs muted">{ko ? "전체 지출" : "Total spending"}</p><p className="mt-1 font-bold">{totalByCurrency(expenses) || "—"}</p></div><div className="rounded-xl bg-[var(--color-background)] p-4"><p className="text-xs muted">{ko ? "지출 건수" : "Expenses"}</p><p className="mt-1 font-bold">{expenses.length}{ko ? "건" : " items"}</p></div><div className="rounded-xl bg-[var(--color-background)] p-4"><p className="text-xs muted">{ko ? "동행자" : "Travelers"}</p><p className="mt-1 font-bold">{travelers.map((traveler) => traveler.name).join(", ") || "—"}</p></div></div></article>) : <div className="card p-10 text-center"><p className="font-bold">{ko ? "아직 여행 기록이 없어요." : "No travel records yet."}</p><Link href="/trips/new" className="mt-4 inline-block rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{ko ? "새 여행 만들기" : "Create a trip"}</Link></div>}</div></div></main>;
}

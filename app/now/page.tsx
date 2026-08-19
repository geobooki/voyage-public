"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { selectCurrentOrSoonTrip } from "@/lib/trip-selection";
import { useLanguage } from "@/lib/i18n";

type Trip = { id: string; slug?: string; title: string; city?: string; start_date?: string; end_date?: string; status?: string };
type Detail = { checklist?: { checked?: boolean }[]; schedule?: { id: string; date: string; time?: string; title: string; completed?: boolean }[]; reservations?: { id: string; type: string; title: string; date?: string; end_date?: string; time?: string; airline?: string; terminal?: string; reservation_number?: string; location?: string }[] };

const isFlight = (type: string) => type.toLowerCase().includes("flight");
const isStay = (type: string) => ["stay", "hotel", "accommodation"].some((name) => type.toLowerCase().includes(name));

export default function NowPage() {
  const { language } = useLanguage();
  const ko = language === "ko";
  const [trip, setTrip] = useState<Trip>();
  const [detail, setDetail] = useState<Detail>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void fetch("/api/trips")
      .then((response) => (response.ok ? response.json() : { trips: [] }))
      .then(async (result) => {
        const candidates = (Array.isArray(result.trips) ? result.trips : []) as Trip[];
        const selected = selectCurrentOrSoonTrip<Trip>(candidates);
        setTrip(selected);
        if (selected) {
          const response = await fetch(`/api/trips/${selected.slug || selected.id}`);
          if (response.ok) setDetail(await response.json());
        }
      })
      .catch(() => setTrip(undefined))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <main className="grid min-h-screen place-items-center px-6"><p className="muted">{ko ? "여행을 불러오는 중이에요." : "Loading your trip…"}</p></main>;
  if (!trip) return <main className="grid min-h-screen place-items-center px-6"><div className="card max-w-md p-8 text-center"><p className="eyebrow mb-3">{ko ? "지금 여행" : "Now"}</p><h1 className="text-2xl font-bold">{ko ? "지금 진행 중인 여행이 없어요." : "No current trip yet."}</h1><p className="mt-2 text-sm muted">{ko ? "7일 이내 시작하는 여행을 추가하면 여기에 보여요." : "Add a trip starting within seven days to see it here."}</p><Link href="/trips/new" className="mt-6 inline-flex rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{ko ? "여행 추가" : "Add a trip"}</Link></div></main>;
  const checked = detail.checklist?.filter((item) => item.checked).length || 0;
  const total = detail.checklist?.length || 0;
  const readiness = total ? Math.round((checked / total) * 100) : 0;
  const flights = detail.reservations?.filter((item) => isFlight(item.type)) || [];
  const stays = detail.reservations?.filter((item) => isStay(item.type)) || [];
  const schedule = [...(detail.schedule || [])].filter((item) => !item.completed).sort((a, b) => `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`)).slice(0, 4);
  const href = `/trips/${trip.slug || trip.id}`;
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-5xl"><p className="eyebrow mb-3">{ko ? "지금 여행" : "Now"}</p><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-bold">{trip.title}</h1><p className="mt-2 muted">{trip.city || ""}{trip.city && trip.start_date ? " · " : ""}{trip.start_date || "날짜 미정"}{trip.end_date ? ` — ${trip.end_date}` : ""}</p></div><Link href={href} className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{ko ? "여행 열기 →" : "Open trip →"}</Link></div><section className="mt-8 grid gap-4 md:grid-cols-[1.1fr_.9fr]"><article className="card p-6"><div className="flex items-center justify-between"><div><p className="eyebrow mb-2">{ko ? "여행 준비 현황" : "Readiness"}</p><p className="text-3xl font-bold">{readiness}%</p></div><span className="status-pill">{ko ? "곧 만나요" : "Coming soon"}</span></div><div className="mt-5 h-3 rounded-full bg-[var(--color-surface-muted)]"><div className="h-3 rounded-full bg-[var(--color-accent)]" style={{ width: `${readiness}%` }} /></div><p className="mt-2 text-xs muted">{checked} / {total} {ko ? "준비 완료" : "items ready"}</p></article><article className="surface-subtle p-6"><p className="eyebrow mb-2">{ko ? "다가오는 일정" : "Next plans"}</p>{schedule.length ? <div className="space-y-3">{schedule.map((item) => <div key={item.id} className="flex gap-3"><span className="w-20 shrink-0 text-xs font-bold text-[var(--color-primary)]">{item.date}<br />{item.time || "—"}</span><span className="text-sm font-semibold">{item.title}</span></div>)}</div> : <p className="text-sm muted">{ko ? "아직 등록된 일정이 없어요." : "No plans added yet."}</p>}</article></section><section className="mt-5 grid gap-4 md:grid-cols-2"><article className="card p-6"><p className="eyebrow mb-2">{ko ? "항공편" : "Flight"}</p>{flights.length ? flights.map((item) => <div key={item.id}><h2 className="font-bold">{item.airline || item.title}</h2><p className="mt-2 text-sm muted">{item.date || "날짜 미정"}{item.time ? ` · ${item.time}` : ""}{item.terminal ? ` · ${item.terminal}` : ""}</p></div>) : <p className="text-sm muted">{ko ? "등록된 항공편이 없어요." : "No flight added yet."}</p>}</article><article className="card p-6"><p className="eyebrow mb-2">{ko ? "숙박" : "Stay"}</p>{stays.length ? stays.map((item) => <div key={item.id}><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm muted">{item.date || "날짜 미정"}{item.end_date ? ` — ${item.end_date}` : ""}{item.reservation_number ? ` · ${item.reservation_number}` : ""}</p><p className="mt-1 text-xs muted">{item.location || (ko ? "주소 미정" : "Address pending")}</p></div>) : <p className="text-sm muted">{ko ? "등록된 숙박이 없어요." : "No stay added yet."}</p>}</article></section></div></main>;
}

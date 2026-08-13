"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOKYO_TRIP_ID } from "@/lib/trip-id";

type TripCard = { id: string; title: string; country?: string; city?: string; startDate?: string; endDate?: string; status: string; color: string; emoji: string };
const defaults: TripCard[] = [
  { id: "tokyo", title: "Tokyo, Japan", startDate: "2026-09-10", endDate: "2026-09-15", status: "Planning", color: "bg-[var(--color-trip-tokyo)]", emoji: "🗼" },
  { id: "jeju", title: "Jeju, South Korea", startDate: "2026-06-03", endDate: "2026-06-06", status: "Completed", color: "bg-[var(--color-trip-jeju)]", emoji: "🌊" },
  { id: "lisbon", title: "Lisbon, Portugal", startDate: "2026-04-17", endDate: "2026-04-22", status: "Completed", color: "bg-[var(--color-trip-lisbon)]", emoji: "🚋" },
];
const dates = (trip: TripCard) => trip.startDate && trip.endDate ? `${trip.startDate} — ${trip.endDate}` : "Dates to be planned";

export default function TripsPage() {
  const [trips, setTrips] = useState(defaults);
  useEffect(() => { const load = async () => { try {
    const saved = JSON.parse(window.localStorage.getItem("voyage:trips") || "[]");
    const localTrips = saved.filter((item: TripCard) => !defaults.some((base) => base.id === item.id)).map((item: TripCard) => ({ ...item, title: item.title || `${item.city}, ${item.country}`, color: "bg-[var(--color-surface-muted)]", emoji: "✦" }));
    const response = await fetch("/api/trips");
    const result = response.ok ? await response.json() : null;
    const remoteTrips = result?.trips?.map((item: Record<string, unknown>) => ({ id: String(item.id) === TOKYO_TRIP_ID ? "tokyo" : String(item.id), title: String(item.title), country: String(item.country ?? ""), city: String(item.city ?? ""), startDate: String(item.start_date ?? ""), endDate: String(item.end_date ?? ""), status: String(item.status ?? "planning"), color: "bg-[var(--color-surface-muted)]", emoji: "✦" })) ?? [];
    const merged = [...defaults, ...remoteTrips, ...localTrips];
    setTrips(merged.filter((trip, index, list) => list.findIndex((candidate) => candidate.id === trip.id) === index));
  } catch { /* keep defaults */ } }; void load(); }, []);
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-5xl"><div className="mb-12 flex items-end justify-between"><div><Link href="/" className="text-sm font-bold text-[var(--color-primary)]">← Overview</Link><p className="eyebrow mt-8 mb-3">Your journeys</p><h1 className="text-4xl font-bold">My trips</h1><p className="mt-2 muted">Every place has a story worth keeping.</p></div><Link href="/trips/new" className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">+ New trip</Link></div><div className="grid gap-5 md:grid-cols-2">{trips.map((trip) => <Link key={trip.id} href={`/trips/${trip.id}`} className="card overflow-hidden transition-transform hover:-translate-y-1"><div className={`grid h-40 place-items-center ${trip.color} text-6xl`}>{trip.emoji}</div><div className="p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{trip.title}</h2><span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">{trip.status}</span></div><p className="mt-2 text-sm muted">{dates(trip)}</p><div className="mt-6 flex gap-5 border-t border-[var(--color-border)] pt-4 text-xs muted"><span>Explore places</span><span>Track expenses</span></div></div></Link>)}<Link href="/trips/new" className="flex min-h-80 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[var(--color-border)] text-center hover:border-[var(--color-primary)]"><span className="mb-3 text-3xl text-[var(--color-primary)]">＋</span><p className="font-bold">Start a new journey</p><p className="mt-1 text-sm muted">Your next story begins here.</p></Link></div></div></main>;
}

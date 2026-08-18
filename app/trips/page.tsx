"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type TripCard = {
  id: string; slug?: string; title: string; country?: string; city?: string;
  startDate?: string; endDate?: string; destinationCurrency?: string;
  status: string; color: string; emoji: string;
};
type TripDraft = Pick<TripCard, "title" | "country" | "city" | "startDate" | "endDate" | "destinationCurrency">;
const currencies = ["JPY", "VND", "USD", "EUR", "THB", "TWD", "CNY", "GBP", "AUD", "CAD", "SGD", "HKD"];
const dates = (trip: TripCard) => trip.startDate && trip.endDate ? trip.startDate + " — " + trip.endDate : "날짜를 정해 주세요";
const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";

export default function TripsPage() {
  const { t, language } = useLanguage(); const ko = language === "ko";
  const [trips, setTrips] = useState<TripCard[]>([]); const [editing, setEditing] = useState<TripCard | null>(null);
  const [draft, setDraft] = useState<TripDraft>({ title: "", country: "", city: "", startDate: "", endDate: "", destinationCurrency: "JPY" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { const load = async () => { try {
    const saved = JSON.parse(window.localStorage.getItem("voyage:trips") || "[]");
    const localTrips = saved.map((item: TripCard) => ({ ...item, title: item.title || (item.city + ", " + item.country), color: "bg-[var(--color-surface-muted)]", emoji: "✦" }));
    const response = await fetch("/api/trips"); const result = response.ok ? await response.json() : null;
    const remoteTrips = result?.trips?.map((item: Record<string, unknown>) => ({ id: String(item.id), slug: item.slug ? String(item.slug) : undefined, title: String(item.title), country: String(item.country ?? ""), city: String(item.city ?? ""), startDate: String(item.start_date ?? ""), endDate: String(item.end_date ?? ""), destinationCurrency: String(item.destination_currency ?? "JPY"), status: String(item.status ?? "planning"), color: "bg-[var(--color-surface-muted)]", emoji: "✦" })) ?? [];
    setTrips([...remoteTrips, ...localTrips].filter((trip, index, list) => list.findIndex((candidate) => candidate.id === trip.id) === index));
  } catch { setTrips([]); } }; void load(); }, []);
  const openEdit = (trip: TripCard) => { setEditing(trip); setDraft({ title: trip.title, country: trip.country || "", city: trip.city || "", startDate: trip.startDate || "", endDate: trip.endDate || "", destinationCurrency: trip.destinationCurrency || "JPY" }); setError(""); };
  const closeEdit = () => { if (!saving) { setEditing(null); setError(""); } };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!editing || !draft.title.trim()) return; setSaving(true); setError("");
    const response = await fetch("/api/trips/" + (editing.slug || editing.id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    if (!response.ok && !editing.id.startsWith("local-")) { const result = await response.json().catch(() => ({})); setError(result.error || "저장하지 못했습니다."); setSaving(false); return; }
    const updated = { ...editing, ...draft, title: draft.title.trim() };
    setTrips((current) => current.map((trip) => trip.id === editing.id ? updated : trip));
    const local = JSON.parse(window.localStorage.getItem("voyage:trips") || "[]");
    window.localStorage.setItem("voyage:trips", JSON.stringify(local.map((item: TripCard) => item.id === editing.id ? { ...item, ...draft, title: draft.title.trim() } : item)));
    setEditing(null); setSaving(false);
  };
  const remove = async () => { if (!editing) return; const confirmed = window.confirm(ko ? "이 여행을 삭제할까요? 일정과 기록도 함께 삭제됩니다." : "Delete this trip? Its plans and records will also be deleted."); if (!confirmed) return; setSaving(true); setError("");
    const response = await fetch("/api/trips/" + (editing.slug || editing.id), { method: "DELETE" });
    if (!response.ok && !editing.id.startsWith("local-")) { setError("삭제하지 못했습니다."); setSaving(false); return; }
    setTrips((current) => current.filter((trip) => trip.id !== editing.id));
    const local = JSON.parse(window.localStorage.getItem("voyage:trips") || "[]");
    window.localStorage.setItem("voyage:trips", JSON.stringify(local.filter((item: TripCard) => item.id !== editing.id)));
    setEditing(null); setSaving(false);
  };
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-5xl"><div className="mb-12 flex items-end justify-between"><div><Link href="/" className="text-sm font-bold text-[var(--color-primary)]">← {t("overview")}</Link><p className="eyebrow mt-8 mb-3">{t("myJourneys")}</p><h1 className="text-4xl font-bold">{t("myTrips")}</h1><p className="mt-2 muted">{ko ? "모든 여행을 한 곳에서 관리하세요." : "Manage every trip in one place."}</p></div><Link href="/trips/new" className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">+ {t("newTrip")}</Link></div><div className="grid gap-5 md:grid-cols-2">{trips.map((trip) => <article key={trip.id} className="card overflow-hidden transition-transform hover:-translate-y-1"><Link href={"/trips/" + (trip.slug || trip.id)}><div className={"grid h-40 place-items-center " + trip.color + " text-6xl"}>{trip.emoji}</div><div className="p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{trip.title}</h2><span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">{trip.status.toLowerCase() === "completed" ? t("completed") : t("planning")}</span></div><p className="mt-2 text-sm muted">{dates(trip)}</p><div className="mt-6 flex gap-5 border-t border-[var(--color-border)] pt-4 text-xs muted"><span>{ko ? "장소 기록" : "Places"}</span><span>{ko ? "지출 관리" : "Expenses"}</span></div></div></Link><div className="border-t border-[var(--color-border)] px-6 py-4"><button type="button" onClick={() => openEdit(trip)} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-primary)]">{ko ? "수정" : "Edit"}</button></div></article>)}<Link href="/trips/new" className="flex min-h-80 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[var(--color-border)] text-center hover:border-[var(--color-primary)]"><span className="mb-3 text-3xl text-[var(--color-primary)]">＋</span><p className="font-bold">{ko ? "새 여행을 시작하세요" : "Start a new journey"}</p><p className="mt-1 text-sm muted">{ko ? "다음 이야기가 여기서 시작됩니다." : "Your next story starts here."}</p></Link></div></div>{editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5" role="dialog" aria-modal="true"><div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow mb-2">{ko ? "여행 관리" : "Trip management"}</p><h2 className="text-2xl font-bold">{ko ? "여행 정보 수정" : "Edit trip"}</h2></div><button type="button" onClick={closeEdit} className="text-2xl" aria-label="닫기">×</button></div><form onSubmit={save} className="mt-6 space-y-4"><label className="block text-sm font-bold">{ko ? "여행 제목" : "Trip title"}<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={"mt-2 " + control}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">{ko ? "국가" : "Country"}<input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} className={"mt-2 " + control}/></label><label className="text-sm font-bold">{ko ? "도시/장소" : "City / place"}<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} className={"mt-2 " + control}/></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">{ko ? "시작일" : "Start date"}<input required type="date" lang="ko-KR" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className={"mt-2 " + control}/></label><label className="text-sm font-bold">{ko ? "종료일" : "End date"}<input required type="date" lang="ko-KR" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} className={"mt-2 " + control}/></label></div><label className="block text-sm font-bold">{ko ? "도착 통화" : "Destination currency"}<select value={draft.destinationCurrency} onChange={(event) => setDraft({ ...draft, destinationCurrency: event.target.value })} className={"mt-2 " + control}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>{error && <p className="rounded-xl bg-[var(--color-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">{error}</p>}<div className="mt-6 flex gap-3 border-t border-[var(--color-border)] pt-5"><button type="button" onClick={() => void remove()} disabled={saving} className="rounded-xl border border-[var(--color-danger)] px-4 py-3 text-sm font-bold text-[var(--color-danger)] disabled:opacity-50">{ko ? "삭제" : "Delete"}</button><button disabled={saving} className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? (ko ? "저장 중…" : "Saving…") : (ko ? "저장" : "Save")}</button></div></form></div></div>}</main>;
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DateField } from "@/app/components/date-field";

const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";

export default function EditTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", country: "", city: "", startDate: "", endDate: "", destinationCurrency: "JPY" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetch(`/api/trips/${tripId}`).then((response) => response.json()).then((data) => { const item = data.trip; if (item) setForm({ title: String(item.title ?? ""), country: String(item.country ?? ""), city: String(item.city ?? ""), startDate: String(item.start_date ?? ""), endDate: String(item.end_date ?? ""), destinationCurrency: String(item.destination_currency ?? "JPY") }); }).catch(() => setError("여행 정보를 불러오지 못했습니다.")); }, [tripId]);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(""); const response = await fetch(`/api/trips/${tripId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (!response.ok) { const result = await response.json(); setError(result.error || "저장하지 못했습니다."); setSaving(false); return; } router.push(`/trips/${tripId}`); };
  const remove = async () => { if (!window.confirm("이 여행을 삭제할까요? 관련 일정과 기록도 함께 삭제됩니다.")) return; const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE" }); if (!response.ok) { setError("삭제하지 못했습니다."); return; } router.push("/trips"); };
  return <main className="min-h-screen px-5 py-8 pb-24 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-2xl"><Link href={`/trips/${tripId}`} className="text-sm font-bold text-[var(--color-primary)]">← 여행 개요</Link><div className="card mt-8 p-7 sm:p-10"><p className="eyebrow mb-3">여행 관리</p><h1 className="text-3xl font-bold">여행 정보 수정</h1><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-bold">여행 이름<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`mt-2 ${control}`}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">국가<input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={`mt-2 ${control}`}/></label><label className="text-sm font-bold">도시<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`mt-2 ${control}`}/></label></div><div className="grid gap-4 sm:grid-cols-2"><DateField label="시작일" required value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })}/><DateField label="종료일" required value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })}/></div><label className="block text-sm font-bold">도착 통화<select value={form.destinationCurrency} onChange={(e) => setForm({ ...form, destinationCurrency: e.target.value })} className={`mt-2 ${control}`}>{["JPY", "USD", "EUR", "VND", "THB", "TWD", "CNY", "GBP", "AUD", "CAD", "SGD", "HKD"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>{error && <p className="rounded-xl bg-[var(--color-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">{error}</p>}<button disabled={saving} className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "저장 중…" : "변경사항 저장"}</button></form><button type="button" onClick={remove} className="mt-5 w-full rounded-xl border border-[var(--color-danger)] py-3 text-sm font-bold text-[var(--color-danger)]">여행 삭제</button></div></div></main>;
}

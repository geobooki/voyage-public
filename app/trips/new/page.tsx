"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { DateField } from "@/app/components/date-field";
import { readPackingDefaults } from "@/lib/packing-defaults";

const control =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";

export default function NewTripPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: "",
    country: "",
    city: "",
    destinationCurrency: "JPY",
    tripType: "international" as "domestic" | "international",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not create trip.");
      const local = JSON.parse(
        window.localStorage.getItem("voyage:trips") || "[]",
      );
      const trip = {
        ...form,
        id: result.trip?.id || `local-${Date.now()}`,
        slug: result.trip?.slug,
        status: "Planning",
      };
      window.localStorage.setItem(
        "voyage:trips",
        JSON.stringify([
          ...local.filter((item: { id: string }) => item.id !== trip.id),
          trip,
        ]),
      );
      const defaults = readPackingDefaults()[form.tripType];
      const tripId = result.trip?.id || trip.id;
      const category = "기본 준비물";
      if (tripId) {
        window.localStorage.setItem(`voyage:trip:${tripId}`, JSON.stringify({ packingCategories: [{ id: `default-${form.tripType}`, name: category, color: "#FEF3C7" }], packing: defaults.map((name, index) => ({ id: `default-${index}`, name, category, checked: false })) }));
        if (result.configured) {
          await fetch(`/api/trips/${tripId}/checklist-categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: category, color: "#FEF3C7", kind: "packing" }) });
          await Promise.all(defaults.map((name) => fetch(`/api/trips/${tripId}/checklist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category, kind: "packing", checked: false }) })));
        }
      }
      router.push("/trips");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create trip.",
      );
      setSaving(false);
    }
  };
  return (
    <main className="min-h-screen px-5 py-8 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/trips"
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← {t("myTrips")}
        </Link>
        <div className="card mt-10 p-7 sm:p-10">
          <p className="eyebrow mb-3">{t("newChapter")}</p>
          <h1 className="text-3xl font-bold">{t("whereGoing")}</h1>
          <p className="mt-2 muted">
            여행의 기본 정보를 입력하세요. 나중에 세부 내용을 추가할 수
            있습니다.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-6">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                {t("tripName")}
              </span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 도쿄 가을 여행"
                className={control}
              />
            </label>
            <fieldset><legend className="mb-2 block text-sm font-bold">여행 유형</legend><div className="grid grid-cols-2 gap-3"><label className={`rounded-xl border px-4 py-3 text-sm font-bold ${form.tripType === "domestic" ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)]" : "border-[var(--color-border)]"}`}><input type="radio" name="tripType" value="domestic" checked={form.tripType === "domestic"} onChange={() => setForm({ ...form, tripType: "domestic" })} className="mr-2"/>국내</label><label className={`rounded-xl border px-4 py-3 text-sm font-bold ${form.tripType === "international" ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)]" : "border-[var(--color-border)]"}`}><input type="radio" name="tripType" value="international" checked={form.tripType === "international"} onChange={() => setForm({ ...form, tripType: "international" })} className="mr-2"/>국외</label></div><p className="mt-1 text-xs muted">기본 준비물 목록을 자동으로 추가합니다.</p></fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold">
                  {t("country")}
                </span>
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="대한민국"
                  className={control}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-bold">
                  {t("city")}
                </span>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="서울"
                  className={control}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">도착 통화</span>
              <select value={form.destinationCurrency} onChange={(e) => setForm({ ...form, destinationCurrency: e.target.value })} className={control}>
                {['JPY', 'USD', 'EUR', 'VND', 'THB', 'TWD', 'CNY', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD'].map((currency) => <option key={currency}>{currency}</option>)}
              </select>
              <span className="mt-1 block text-xs muted">지도 기능을 준비 중이라 경도·위도는 지금 입력하지 않습니다.</span>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <DateField
                required
                label={t("startDate")}
                value={form.startDate}
                onChange={(value) => setForm({ ...form, startDate: value })}
              />
              <DateField
                required
                label={t("endDate")}
                value={form.endDate}
                onChange={(value) => setForm({ ...form, endDate: value })}
              />
            </div>
            {error && (
              <p className="rounded-xl bg-[var(--color-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">
                {error}
              </p>
            )}
            <button
              disabled={saving}
              className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? t("creating") : t("create")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

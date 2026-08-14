"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { DateField } from "@/app/components/date-field";

const control =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";

export default function NewTripPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: "",
    country: "",
    city: "",
    latitude: "",
    longitude: "",
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
        status: "Planning",
      };
      window.localStorage.setItem(
        "voyage:trips",
        JSON.stringify([
          ...local.filter((item: { id: string }) => item.id !== trip.id),
          trip,
        ]),
      );
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
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold">
                  Latitude <span className="font-normal muted">(선택)</span>
                </span>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  placeholder="37.5665"
                  className={control}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-bold">
                  Longitude <span className="font-normal muted">(선택)</span>
                </span>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  placeholder="126.9780"
                  className={control}
                />
              </label>
            </div>
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

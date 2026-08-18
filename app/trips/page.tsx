"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type TripCard = {
  id: string;
  slug?: string;
  title: string;
  country?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  color: string;
  emoji: string;
};
const dates = (trip: TripCard) =>
  trip.startDate && trip.endDate
    ? `${trip.startDate} — ${trip.endDate}`
    : "날짜를 정해 주세요";

export default function TripsPage() {
  const { t, language } = useLanguage();
  const ko = language === "ko";
  const [trips, setTrips] = useState<TripCard[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const saved = JSON.parse(
          window.localStorage.getItem("voyage:trips") || "[]",
        );
        const localTrips = saved
          .map((item: TripCard) => ({
            ...item,
            title: item.title || `${item.city}, ${item.country}`,
            color: "bg-[var(--color-surface-muted)]",
            emoji: "✦",
          }));
        const response = await fetch("/api/trips");
        const result = response.ok ? await response.json() : null;
        const remoteTrips =
          result?.trips?.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            slug: item.slug ? String(item.slug) : undefined,
            title: String(item.title),
            country: String(item.country ?? ""),
            city: String(item.city ?? ""),
            startDate: String(item.start_date ?? ""),
            endDate: String(item.end_date ?? ""),
            status: String(item.status ?? "planning"),
            color: "bg-[var(--color-surface-muted)]",
            emoji: "✦",
          })) ?? [];
        setTrips(
          [...remoteTrips, ...localTrips].filter(
            (trip, index, list) =>
              list.findIndex((candidate) => candidate.id === trip.id) === index,
          ),
        );
      } catch {
        setTrips([]);
      }
    };
    void load();
  }, []);
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-[var(--color-primary)]"
            >
              ← {t("overview")}
            </Link>
            <p className="eyebrow mt-8 mb-3">{t("myJourneys")}</p>
            <h1 className="text-4xl font-bold">{t("myTrips")}</h1>
            <p className="mt-2 muted">
              {ko
                ? "모든 여행을 한 곳에서 관리하세요."
                : "Manage every trip in one place."}
            </p>
          </div>
          <Link
            href="/trips/new"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white"
          >
            + {t("newTrip")}
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.slug || trip.id}`}
              className="card overflow-hidden transition-transform hover:-translate-y-1"
            >
              <div
                className={`grid h-40 place-items-center ${trip.color} text-6xl`}
              >
                {trip.emoji}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{trip.title}</h2>
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">
                    {trip.status.toLowerCase() === "completed"
                      ? t("completed")
                      : t("planning")}
                  </span>
                </div>
                <p className="mt-2 text-sm muted">{dates(trip)}</p>
                <div className="mt-6 flex gap-5 border-t border-[var(--color-border)] pt-4 text-xs muted">
                  <span>{ko ? "장소 기록" : "Places"}</span>
                  <span>{ko ? "지출 관리" : "Expenses"}</span>
                </div>
              </div>
            </Link>
          ))}
          <Link
            href="/trips/new"
            className="flex min-h-80 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[var(--color-border)] text-center hover:border-[var(--color-primary)]"
          >
            <span className="mb-3 text-3xl text-[var(--color-primary)]">
              ＋
            </span>
            <p className="font-bold">
              {ko ? "새 여행을 시작하세요" : "Start a new journey"}
            </p>
            <p className="mt-1 text-sm muted">
              {ko
                ? "다음 이야기가 여기서 시작됩니다."
                : "Your next story starts here."}
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

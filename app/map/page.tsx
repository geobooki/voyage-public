"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOKYO_TRIP_ID } from "@/lib/trip-id";

type ArchiveTrip = {
  id: string;
  title: string;
  city?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  emoji: string;
  latitude?: number;
  longitude?: number;
  total?: number;
  places?: number;
  restaurants?: number;
  activities?: number;
  rating?: number;
};
const defaults: ArchiveTrip[] = [
  {
    id: "tokyo",
    title: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    startDate: "2026-09-10",
    endDate: "2026-09-15",
    status: "planning",
    emoji: "🗼",
    latitude: 35.6762,
    longitude: 139.6503,
    total: 2500,
    places: 3,
    restaurants: 1,
    activities: 1,
    rating: 0,
  },
  {
    id: "lisbon",
    title: "Lisbon, Portugal",
    city: "Lisbon",
    country: "Portugal",
    startDate: "2026-04-17",
    endDate: "2026-04-22",
    status: "completed",
    emoji: "🚋",
    latitude: 38.7223,
    longitude: -9.1393,
    total: 234000,
    places: 12,
    restaurants: 8,
    activities: 3,
    rating: 5,
  },
];

const markerPosition = (trip: ArchiveTrip, index: number) =>
  trip.latitude != null && trip.longitude != null
    ? {
        left: `${6 + ((trip.longitude + 180) / 360) * 88}%`,
        top: `${6 + ((80 - trip.latitude) / 140) * 88}%`,
      }
    : { left: `${20 + (index % 4) * 22}%`, top: `${28 + (index % 3) * 24}%` };
const summaryFrom = (
  data: Record<string, unknown>,
): Pick<
  ArchiveTrip,
  "total" | "places" | "restaurants" | "activities" | "rating"
> => {
  const places = Array.isArray(data.places)
    ? (data.places as Record<string, unknown>[])
    : [];
  const expenses = Array.isArray(data.expenses)
    ? (data.expenses as Record<string, unknown>[])
    : [];
  const review = data.review as Record<string, unknown> | null;
  return {
    total: expenses.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    places: places.length,
    restaurants: places.filter((item) =>
      ["Restaurant", "Cafe"].includes(String(item.type)),
    ).length,
    activities: places.filter((item) => String(item.type) === "Activity")
      .length,
    rating: review?.rating ? Number(review.rating) : 0,
  };
};

export default function MapPage() {
  const [trips, setTrips] = useState(defaults);
  useEffect(() => {
    const load = async () => {
      try {
        const local = JSON.parse(
          window.localStorage.getItem("voyage:trips") || "[]",
        );
        const response = await fetch("/api/trips");
        const result = response.ok ? await response.json() : null;
        const remote =
          result?.trips?.map(
            (item: Record<string, unknown>, index: number) => ({
              id: String(item.id) === TOKYO_TRIP_ID ? "tokyo" : String(item.id),
              title: String(item.title),
              city: String(item.city ?? ""),
              country: String(item.country ?? ""),
              startDate: String(item.start_date ?? ""),
              endDate: String(item.end_date ?? ""),
              status: String(item.status ?? "planning"),
              emoji: index % 2 ? "🌊" : "✦",
              latitude:
                item.latitude == null ? undefined : Number(item.latitude),
              longitude:
                item.longitude == null ? undefined : Number(item.longitude),
            }),
          ) ?? [];
        const localMapped = local.map((item: ArchiveTrip) => ({
          ...item,
          emoji: item.emoji || "✦",
        }));
        const byId = new Map<string, ArchiveTrip>();
        [...defaults, ...remote, ...localMapped].forEach((trip) =>
          byId.set(trip.id, trip),
        );
        const enriched = await Promise.all(
          [...byId.values()].map(async (trip) => {
            try {
              const detailResponse = await fetch(`/api/trips/${trip.id}`);
              if (detailResponse.ok)
                return { ...trip, ...summaryFrom(await detailResponse.json()) };
              const saved = JSON.parse(
                window.localStorage.getItem(`voyage:trip:${trip.id}`) || "null",
              );
              return saved ? { ...trip, ...summaryFrom(saved) } : trip;
            } catch {
              return trip;
            }
          }),
        );
        setTrips(enriched);
      } catch {
        /* use defaults */
      }
    };
    void load();
  }, []);
  const completed = trips.filter(
    (trip) => trip.status.toLowerCase() === "completed",
  ).length;
  return (
    <main className="min-h-screen px-5 py-8 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← Overview
        </Link>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Travel archive</p>
            <h1 className="text-4xl font-bold">Your world, in stories.</h1>
            <p className="mt-2 muted">
              {completed} completed trips · {trips.length} journeys in your
              archive
            </p>
          </div>
          <Link
            href="/trips/new"
            className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white"
          >
            + New trip
          </Link>
        </div>
        <div className="card relative mt-10 min-h-[430px] overflow-hidden bg-[var(--color-map-surface)] p-8">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(var(--color-map-dot) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          {trips.slice(0, 8).map((trip, index) => {
            const position = markerPosition(trip, index);
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                style={position}
                className="absolute z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[var(--color-primary)] text-xs shadow-lg"
                aria-label={`Open ${trip.title}`}
              >
                {index + 1}
              </Link>
            );
          })}
          <div className="relative grid min-h-[365px] place-items-center text-center">
            <div>
              <div className="mb-5 text-7xl">🌍</div>
              <p className="text-xl font-bold">Every pin holds a memory.</p>
              <p className="mt-2 text-sm muted">
                Click a pin to revisit the trip.
              </p>
            </div>
          </div>
        </div>
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow mb-2">Your journeys</p>
              <h2 className="text-xl font-bold">Travel Archive</h2>
            </div>
            <Link
              href="/trips"
              className="text-sm font-bold text-[var(--color-primary)]"
            >
              View trips →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {trips.map((trip) => (
              <Link
                href={`/trips/${trip.id}`}
                className="card p-5"
                key={trip.id}
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--color-surface-muted)] text-2xl">
                    {trip.emoji}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">{trip.title}</p>
                    <p className="mt-1 text-xs muted">
                      {trip.startDate || "Dates to be planned"}
                      {trip.endDate ? ` — ${trip.endDate}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">
                    {trip.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-4 text-xs muted sm:grid-cols-4">
                  <span>¥{(trip.total ?? 0).toLocaleString()}</span>
                  <span>{trip.places ?? 0} places</span>
                  <span>{trip.restaurants ?? 0} food</span>
                  <span>
                    {trip.rating ? `${"★".repeat(trip.rating)}` : "No rating"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

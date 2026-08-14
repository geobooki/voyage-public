"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTripData } from "@/lib/trip-context";

export default function WeatherPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state } = useTripData();
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/trips/${tripId}/during`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← During the trip
        </Link>
        <p className="eyebrow mt-10 mb-3">Trip weather</p>
        <h1 className="text-4xl font-bold">Pack for the days ahead.</h1>
        <p className="mt-2 muted">
          Each forecast is paired with that day’s itinerary.
        </p>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {state.weather.map((day) => {
            const daySchedule = state.schedule
              .filter((item) => item.date === day.date)
              .sort((a, b) => a.time.localeCompare(b.time));
            return (
              <article className="card p-6" key={day.date}>
                <p className="text-xs font-bold muted">{day.date}</p>
                <div className="mt-5 flex items-end justify-between">
                  <span className="text-4xl">{day.icon}</span>
                  <span className="text-3xl font-bold">
                    {day.temperature}°C
                  </span>
                </div>
                <p className="mt-2 text-sm muted">{day.condition}</p>
                <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                  <p className="eyebrow mb-3">Day plan</p>
                  {daySchedule.length ? (
                    <div className="space-y-2">
                      {daySchedule.map((item) => (
                        <div key={item.id} className="flex gap-3 text-sm">
                          <span className="w-11 font-bold text-[var(--color-primary)]">
                            {item.time || "—"}
                          </span>
                          <span className="muted">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm muted">No schedule for this day.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {!state.weather.length && (
          <div className="card mt-5 p-6 text-sm muted">
            No weather data yet. Add a weather provider when you are ready.
          </div>
        )}
        <Link
          href={`/trips/${tripId}/during/schedule`}
          className="mt-6 inline-block text-sm font-bold text-[var(--color-primary)]"
        >
          Edit itinerary →
        </Link>
      </div>
    </main>
  );
}

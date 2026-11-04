"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import type { WeatherDay } from "@/types/trip";

export default function WeatherPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state } = useTripData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const ko = language === "ko";
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ tripId: string; weather: WeatherDay[]; status: "loading" | "ready" | "error"; message?: string }>({ tripId, weather: [], status: "loading" });
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setResult({ tripId, weather: [], status: "error", message: "날씨 조회 시간이 초과됐어요. 다시 불러와 주세요." });
      controller.abort();
    }, 25000);
    setResult({ tripId, weather: [], status: "loading" });
    void authenticatedFetch(`/api/trips/${tripId}/weather/auto`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "날씨를 불러오지 못했습니다.");
        if (!controller.signal.aborted) setResult({ tripId, weather: data.weather || [], status: "ready", message: data.message });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ tripId, weather: [], status: "error", message: error instanceof Error ? error.message : "날씨를 불러오지 못했습니다." });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [tripId, user, retry]);
  const current = result.tripId === tripId ? result : { tripId, weather: [], status: "loading" as const };
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
    <div className="mx-auto max-w-5xl">
      <Link href={`/trips/${tripId}/during`} className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "여행 중" : "During the trip"}</Link>
      <p className="eyebrow mt-10 mb-3">Trip weather</p>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl font-bold">{ko ? "여행 날씨" : "Trip weather"}</h1><button type="button" disabled={current.status === "loading"} onClick={() => setRetry((value) => value + 1)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] disabled:opacity-50">{ko ? "다시 불러오기" : "Refresh"}</button></div>
      <p className="mt-2 muted">{ko ? "여행 장소와 날짜를 기준으로 날씨를 자동으로 불러와요." : "Weather loads automatically for your destination and travel dates."}</p>
      {current.status === "loading" && <p className="card mt-6 p-6 text-sm muted" role="status">{ko ? "날씨를 불러오는 중이에요…" : "Loading weather…"}</p>}
      {current.status !== "loading" && !current.weather.length && <p className="card mt-6 p-6 text-sm muted" role="status">{ko ? current.message || "해당 날짜의 날씨가 아직 제공되지 않아요." : current.status === "error" ? "Could not load weather. Please try again." : "Weather is not available for these dates yet."}</p>}
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {current.weather.map((day) => {
          const schedule = state.schedule.filter((item) => item.date === day.date).sort((a, b) => a.time.localeCompare(b.time));
          return <article className="card p-6" key={day.date}>
            <p className="text-xs font-bold muted">{day.date}</p>
            <div className="mt-5 flex items-end justify-between"><span className="text-4xl" aria-hidden="true">{day.icon}</span><div><p className="text-xs muted">{ko ? "최고 기온" : "High"}</p><span className="text-3xl font-bold">{day.temperature}°C</span></div></div>
            <p className="mt-2 text-sm muted">{day.condition}</p>
            <div className="mt-6 border-t border-[var(--color-border)] pt-4"><p className="eyebrow mb-3">{ko ? "이날의 일정" : "Day plan"}</p>
              {schedule.length ? <div className="space-y-2">{schedule.map((item) => <div key={item.id} className="flex gap-3 text-sm"><span className="w-11 font-bold text-[var(--color-primary)]">{item.time?.slice(0, 5) || "—"}</span><span className="muted">{item.title}</span></div>)}</div> : <p className="text-sm muted">{ko ? "등록된 일정이 없어요." : "No schedule for this day."}</p>}
            </div>
          </article>;
        })}
      </div>
      <p className="mt-5 text-xs muted">{ko ? "날씨 제공: " : "Weather by "}<a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">Open-Meteo</a></p>
      <Link href={`/trips/${tripId}/during/schedule`} className="mt-6 inline-block text-sm font-bold text-[var(--color-primary)]">{ko ? "일정 수정 →" : "Edit itinerary →"}</Link>
    </div>
  </main>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useTripStore } from "@/lib/trip-store";

type DashboardTrip = { id: string; title: string; city?: string; country?: string; start_date?: string; end_date?: string; status?: string };

function DashboardCard({
  section,
  children,
  className = "",
}: {
  section: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article data-section={section} className={`card ${className}`}>
      {children}
    </article>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const ko = language === "ko";
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  useEffect(() => { void fetch("/api/trips").then((response) => response.ok ? response.json() : { trips: [] }).then((result) => setTrips(Array.isArray(result.trips) ? result.trips : [])).catch(() => setTrips([])); }, []);
  const nextTrip = [...trips].filter((trip) => trip.status !== "completed" && (!trip.start_date || trip.start_date >= new Date().toISOString().slice(0, 10))).sort((a, b) => String(a.start_date || "9999").localeCompare(String(b.start_date || "9999")))[0];
  const { state } = useTripStore(nextTrip?.id || "dashboard");
  const accountHref = user ? "/account" : "/auth";
  const checked = state.packing.filter((item) => item.checked).length;
  const totalPacking = state.packing.length;
  const readiness = totalPacking
    ? Math.round((checked / totalPacking) * 100)
    : 0;
  const upcoming = state.schedule.filter((item) => !item.completed).slice(0, 3);
  const estimated = state.budget.reduce((sum, item) => sum + item.amount, 0);
  const tripTitle = nextTrip ? `${nextTrip.city || nextTrip.country || nextTrip.title}` : "새로운 여행을 시작해요";
  const tripDates = nextTrip?.start_date ? `${nextTrip.start_date}${nextTrip.end_date ? ` — ${nextTrip.end_date}` : ""}` : "여행을 추가하면 일정과 준비 현황이 표시됩니다.";
  return (
    <main
      data-section="home-dashboard"
      className="min-h-screen px-5 py-6 sm:px-8 lg:px-12 lg:py-10"
    >
      <header
        data-section="home-header"
        className="mb-10 flex items-start justify-between"
      >
        <div>
          <p className="eyebrow mb-3">
            {ko ? "2026년 9월 3일 목요일" : "Thursday, September 3, 2026"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {ko ? "좋은 아침이에요, 민지" : "Good morning, Minji"}{" "}
            <span aria-hidden>✦</span>
          </h1>
          <p className="mt-2 muted">
            {ko
              ? "오늘도 여행의 추억을 만들어 볼까요?"
              : "Ready to make some memories?"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            aria-label="설정"
            className="grid size-10 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            ⚙
          </Link>
          <Link
            href={accountHref}
            aria-label={user ? "계정 설정" : "로그인"}
            className="grid size-10 place-items-center rounded-full bg-[var(--color-avatar)] text-xs font-bold lg:hidden"
          >
            {user?.email?.slice(0, 2).toUpperCase() || "MJ"}
          </Link>
        </div>
      </header>
      <section
        data-section="home-top-summary"
        className="mb-7 grid gap-5 md:grid-cols-3"
      >
        <DashboardCard
          section="next-adventure"
          className="overflow-hidden bg-[var(--color-primary)] p-6 text-white sm:p-8 md:col-span-2"
        >
          <p className="text-sm font-semibold text-white/70">
            {ko ? "다음 여행" : "Next adventure"}
          </p>
          <h2 className="mt-2 text-3xl font-bold">{tripTitle}</h2>
          <p className="mt-2 text-sm text-white/80">
            {tripDates}
          </p>
          <div className="mt-8 rounded-2xl bg-white/10 p-4">
            <p className="text-xs font-bold text-white/70">
              {ko ? "여행 준비 현황" : "Trip readiness"}
            </p>
            <div className="mt-3 h-2 rounded-full bg-white/20">
              <div
                className="h-2 rounded-full bg-[var(--color-accent)]"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/70">
              {readiness}% {ko ? "완료" : "ready"}
            </p>
          </div>
          <Link
            href={nextTrip ? `/trips/${nextTrip.id}` : "/trips/new"}
            className="mt-5 inline-flex rounded-xl bg-[var(--color-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-primary)]"
          >
            여행 열기 →
          </Link>
        </DashboardCard>
        <DashboardCard section="year-summary" className="p-6">
          <p className="eyebrow">{ko ? "올해" : "This year"}</p>
          <p className="mt-4 text-4xl font-bold">4</p>
          <p className="mt-1 text-sm muted">
            {ko ? `${trips.filter((trip) => trip.status === "completed").length}개의 완료한 여행` : `${trips.filter((trip) => trip.status === "completed").length} trips completed`}
          </p>
          <div className="mt-7 flex gap-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <span
                key={item}
                className={`h-2 flex-1 rounded-full ${item < 5 ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
              />
            ))}
          </div>
        </DashboardCard>
      </section>
      <section
        data-section="home-content-grid"
        className="grid gap-7 xl:grid-cols-[1.45fr_1fr]"
      >
        <DashboardCard section="upcoming-schedule" className="p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-2">
                {ko ? "다가오는 여행" : "Upcoming trip"}
              </p>
              <h2 className="text-xl font-bold">
                {nextTrip ? (ko ? `${tripTitle} 일정` : `${tripTitle} itinerary`) : (ko ? "여행 일정" : "Your itinerary")}
              </h2>
            </div>
            <Link
              href={nextTrip ? `/trips/${nextTrip.id}/during/schedule` : "/trips"}
              className="text-sm font-bold text-[var(--color-primary)]"
            >
              전체 보기 →
            </Link>
          </div>
          {upcoming.length ? (
            upcoming.map((item) => (
              <div
                data-section="upcoming-schedule-item"
                key={item.id}
                className="flex items-center gap-4 border-t border-[var(--color-border)] py-4"
              >
                <span className="w-24 text-xs font-bold muted">
                  {item.date}
                  <br />
                  {item.time}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs muted">{item.type}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm muted">아직 예정된 일정이 없습니다.</p>
          )}
        </DashboardCard>
        <div data-section="home-side-cards" className="space-y-5">
          <DashboardCard section="packing-summary" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow mb-2">여행 전</p>
                <h2 className="text-xl font-bold">준비물 체크리스트</h2>
              </div>
              <span className="text-sm font-bold text-[var(--color-primary)]">
                {checked} / {totalPacking}
              </span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-[var(--color-surface-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--color-accent)]"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <Link
              href={nextTrip ? `/trips/${nextTrip.id}/before` : "/trips"}
              className="mt-4 block text-center text-sm font-bold text-[var(--color-primary)]"
            >
              체크리스트 관리 →
            </Link>
          </DashboardCard>
          <DashboardCard
            section="budget-summary"
            className="flex items-center justify-between p-6"
          >
            <div>
              <p className="eyebrow mb-2">여행 예산</p>
              <p className="text-2xl font-bold">
                ₩{estimated.toLocaleString("ko-KR")}
              </p>
              <p className="mt-1 text-xs muted">여행 예상 총액</p>
            </div>
            <Link
              href={nextTrip ? `/trips/${nextTrip.id}/before/budget` : "/trips"}
              className="grid size-14 place-items-center rounded-full border-[7px] border-[var(--color-accent)] text-xs font-bold"
            >
              예산
            </Link>
          </DashboardCard>
        </div>
      </section>
    </main>
  );
}

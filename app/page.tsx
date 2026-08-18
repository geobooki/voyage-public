"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useTripStore } from "@/lib/trip-store";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context";
import type { DashboardItem } from "@/types/trip";

const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";

type DashboardTrip = {
  id: string;
  slug?: string;
  title: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
};

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

function DashboardPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export default function Home() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const ko = language === "ko";
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  useEffect(() => {
    void fetch("/api/trips")
      .then((response) => (response.ok ? response.json() : { trips: [] }))
      .then((result) =>
        setTrips(Array.isArray(result.trips) ? result.trips : []),
      )
      .catch(() => setTrips([]));
  }, []);
  const nextTrip = [...trips]
    .filter(
      (trip) =>
        trip.status !== "completed" &&
        (!trip.start_date ||
          trip.start_date >= new Date().toISOString().slice(0, 10)),
    )
    .sort((a, b) =>
      String(a.start_date || "9999").localeCompare(
        String(b.start_date || "9999"),
      ),
    )[0];
  const tripStore = useTripStore(nextTrip?.id || "dashboard");
  const { state } = tripStore;
  const accountHref = user ? "/account" : "/auth";
  const checked = state.packing.filter((item) => item.checked).length;
  const totalPacking = state.packing.length;
  const readiness = totalPacking
    ? Math.round((checked / totalPacking) * 100)
    : 0;
  const estimated = state.budget.reduce((sum, item) => sum + item.amount, 0);
  const tripTitle = nextTrip?.title || "새로운 여행을 시작해요";
  const tripDates = nextTrip?.start_date
    ? `${nextTrip.start_date}${nextTrip.end_date ? ` — ${nextTrip.end_date}` : ""}`
    : "여행을 추가하면 일정과 준비 현황이 표시됩니다.";
  const itineraryDays = Object.entries(
    state.schedule.reduce<Record<string, typeof state.schedule>>((days, item) => {
      (days[item.date] ||= []).push(item);
      return days;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));
  return (
    <DashboardProvider store={tripStore}>
      <DashboardContent
        ko={ko}
        trips={trips}
        nextTrip={nextTrip}
        tripTitle={tripTitle}
        tripDates={tripDates}
        checked={checked}
        totalPacking={totalPacking}
        readiness={readiness}
        estimated={estimated}
        itineraryDays={itineraryDays}
        accountHref={accountHref}
        userEmail={user?.email}
      />
    </DashboardProvider>
  );
}

function DashboardContent({
  ko,
  trips,
  nextTrip,
  tripTitle,
  tripDates,
  checked,
  totalPacking,
  readiness,
  estimated,
  itineraryDays,
  accountHref,
  userEmail,
}: {
  ko: boolean;
  trips: DashboardTrip[];
  nextTrip?: DashboardTrip;
  tripTitle: string;
  tripDates: string;
  checked: number;
  totalPacking: number;
  readiness: number;
  estimated: number;
  itineraryDays: [string, { id: string; date: string; title: string; time: string; type: string; completed: boolean }[]][];
  accountHref: string;
  userEmail?: string;
}) {
  const { state, addDashboardItem, removeDashboardItem } = useDashboard();
  const upcoming = state.schedule.filter((item) => !item.completed).slice(0, 3);
  const [draft, setDraft] = useState<{ kind: DashboardItem["kind"]; title: string; detail: string; url: string }>({ kind: "do", title: "", detail: "", url: "" });
  const saveDashboardItem = (event: React.FormEvent) => { event.preventDefault(); if (!draft.title.trim()) return; addDashboardItem({ ...draft, title: draft.title.trim(), detail: draft.detail.trim() || undefined, url: draft.url.trim() || undefined }); setDraft({ ...draft, title: "", detail: "", url: "" }); };
  const flights = state.reservations.filter((item) => item.type.toLowerCase().includes("flight"));
  const stays = state.reservations.filter((item) => ["stay", "hotel", "accommodation"].some((type) => item.type.toLowerCase().includes(type)));
  const wishes = (kind: DashboardItem["kind"]) => state.dashboardItems.filter((item) => item.kind === kind);
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
            aria-label={userEmail ? "계정 설정" : "로그인"}
            className="grid size-10 place-items-center rounded-full bg-[var(--color-avatar)] text-xs font-bold lg:hidden"
          >
            {userEmail?.slice(0, 2).toUpperCase() || "MJ"}
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
          <p className="mt-2 text-sm text-white/80">{tripDates}</p>
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
            href={
              nextTrip ? `/trips/${nextTrip.slug || nextTrip.id}` : "/trips/new"
            }
            className="mt-5 inline-flex rounded-xl bg-[var(--color-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-primary)]"
          >
            여행 열기 →
          </Link>
        </DashboardCard>
        <DashboardCard section="year-summary" className="p-6">
          <p className="eyebrow">{ko ? "올해" : "This year"}</p>
          <p className="mt-4 text-4xl font-bold">4</p>
          <p className="mt-1 text-sm muted">
            {ko
              ? `${trips.filter((trip) => trip.status === "completed").length}개의 완료한 여행`
              : `${trips.filter((trip) => trip.status === "completed").length} trips completed`}
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
                {nextTrip
                  ? ko
                    ? `${tripTitle} 일정`
                    : `${tripTitle} itinerary`
                  : ko
                    ? "여행 일정"
                    : "Your itinerary"}
              </h2>
            </div>
            <Link
              href={
                nextTrip
                  ? `/trips/${nextTrip.slug || nextTrip.id}/during/schedule`
                  : "/trips"
              }
              className="text-sm font-bold text-[var(--color-primary)]"
            >
              전체 보기 →
            </Link>
          </div>
          {itineraryDays.length ? itineraryDays.slice(0, 4).map(([date, items]) => (
            <div key={date} className="border-t border-[var(--color-border)] py-4">
              <p className="mb-3 text-sm font-bold text-[var(--color-primary)]">{date}</p>
              <div className="space-y-2">{items.map((item) => <div data-section="daily-itinerary-item" key={item.id} className="flex items-center gap-3"><span className="w-14 text-xs font-bold muted">{item.time || "—"}</span><span className="flex-1 text-sm font-semibold">{item.title}</span><span className="text-xs muted">{item.type}</span></div>)}</div>
            </div>
          )) : (
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
      <DashboardPanel className="mt-7 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow mb-2">{ko ? "여행 한눈에 보기" : "Trip at a glance"}</p><h2 className="text-xl font-bold">{ko ? "항공·숙박 정보" : "Flights and stays"}</h2></div><span className="text-xs muted">{nextTrip ? tripDates : ""}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-[var(--color-background)] p-4"><p className="text-xs font-bold muted">{ko ? "항공편" : "Flights"}</p>{flights.length ? flights.map((item) => <div key={item.id} className="mt-3"><p className="font-bold">{item.title}</p><p className="text-xs muted">{item.date || "날짜 미정"}{item.time ? ` · ${item.time}` : ""}{item.location ? ` · ${item.location}` : ""}</p></div>) : <p className="mt-3 text-sm muted">{ko ? "항공편을 예약에 추가하면 여기에 보여요." : "Add a flight reservation to show it here."}</p>}</div><div className="rounded-2xl bg-[var(--color-background)] p-4"><p className="text-xs font-bold muted">{ko ? "숙박" : "Stays"}</p>{stays.length ? stays.map((item) => <div key={item.id} className="mt-3"><p className="font-bold">{item.title}</p><p className="text-xs muted">{item.date || "날짜 미정"}{item.location ? ` · ${item.location}` : ""}</p></div>) : <p className="mt-3 text-sm muted">{ko ? "숙박 예약을 추가하면 여기에 보여요." : "Add a stay reservation to show it here."}</p>}</div></div>
      </DashboardPanel>
      <DashboardPanel className="mt-7 p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{ko ? "여행 아이디어" : "Trip ideas"}</p><h2 className="text-xl font-bold">{ko ? "하고 싶은 것 · 먹고 싶은 것 · 기념품" : "Things to do, eat, and bring home"}</h2></div></div><div className="mt-5 grid gap-4 md:grid-cols-3">{(["do", "eat", "souvenir"] as const).map((kind) => <div key={kind} className="rounded-2xl bg-[var(--color-background)] p-4"><p className="text-xs font-bold muted">{kind === "do" ? (ko ? "하고 싶은 것" : "Things to do") : kind === "eat" ? (ko ? "먹고 싶은 것" : "Places to eat") : (ko ? "추천 기념품" : "Souvenirs")}</p>{wishes(kind).map((item) => <div key={item.id} className="mt-3 flex items-start gap-2"><div className="flex-1"><p className="text-sm font-bold">{item.title}</p>{item.detail && <p className="mt-1 text-xs muted">{item.detail}</p>}</div><button type="button" onClick={() => removeDashboardItem(item.id)} className="text-xs text-[var(--color-danger)]">×</button></div>)}{!wishes(kind).length && <p className="mt-3 text-xs muted">{ko ? "아직 추가된 항목이 없어요." : "Nothing added yet."}</p>}</div>)}</div><form onSubmit={saveDashboardItem} className="mt-5 grid gap-2 border-t border-[var(--color-border)] pt-5 md:grid-cols-[auto_1fr_1fr_auto]"><select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as DashboardItem["kind"] })} className={control}><option value="do">{ko ? "하고 싶은 것" : "To do"}</option><option value="eat">{ko ? "먹고 싶은 것" : "To eat"}</option><option value="souvenir">{ko ? "추천 기념품" : "Souvenir"}</option><option value="tip">{ko ? "여행 링크" : "Travel link"}</option></select><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={ko ? "이름 또는 제목" : "Name or title"} className={control}/><input value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} placeholder={ko ? "메모 (선택)" : "Note (optional)"} className={control}/><button className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{ko ? "추가" : "Add"}</button>{draft.kind === "tip" && <input type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://..." className={"md:col-span-3 " + control}/>}</form></DashboardPanel>
      <DashboardPanel className="mt-7 p-6 sm:p-8">
        <p className="eyebrow mb-2">{ko ? "여행 팁 링크" : "Travel tips"}</p>
        <h2 className="text-xl font-bold">{ko ? "블로그와 유튜브" : "Blogs and YouTube"}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {wishes("tip").map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[var(--color-background)] px-3 py-3"><div className="flex-1"><a href={item.url || "#"} target="_blank" rel="noreferrer" className="text-sm font-bold text-[var(--color-primary)]">{item.title} ↗</a>{item.detail && <p className="mt-1 text-xs muted">{item.detail}</p>}</div><button type="button" onClick={() => removeDashboardItem(item.id)} className="text-xs text-[var(--color-danger)]">×</button></div>)}
          {!wishes("tip").length && <p className="text-sm muted">{ko ? "위 입력창에서 블로그나 유튜브 링크를 추가하세요." : "Add a blog or YouTube link using the form above."}</p>}
        </div>
      </DashboardPanel>
    </main>
  );
}

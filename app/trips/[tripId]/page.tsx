"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatTotals } from "@/lib/money";
import { TripDataProvider, useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";

type TripMeta = { title: string; dates: string; startDate: string; endDate: string; status: string };

function TripPageContent() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { state } = useTripData();
  const [trip, setTrip] = useState<TripMeta>({
    title: "여행 정보를 불러오는 중…",
    dates: "날짜를 정해 주세요",
    status: "planning",
    startDate: "",
    endDate: "",
  });
  const [showOtherPhases, setShowOtherPhases] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const local = JSON.parse(
          window.localStorage.getItem("voyage:trips") || "[]",
        ).find((item: { id: string }) => item.id === tripId);
        if (local)
          setTrip({
            title: local.title || `${local.city}, ${local.country}`,
            dates: `${local.startDate} — ${local.endDate}`,
            startDate: local.startDate || "",
            endDate: local.endDate || "",
            status: String(local.status || "planning").toLowerCase(),
          });
        const response = await fetch(`/api/trips/${tripId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.trip)
            setTrip({
              title: String(result.trip.title),
              dates: `${String(result.trip.start_date ?? "Dates to be planned")} — ${String(result.trip.end_date ?? "")}`,
              startDate: String(result.trip.start_date ?? ""),
              endDate: String(result.trip.end_date ?? ""),
              status: String(result.trip.status ?? "planning"),
            });
        }
      } catch {
        /* fallback title */
      }
    };
    void load();
  }, [tripId]);
  const completeTrip = async () => {
    setSavingStatus(true);
    setTrip((current) => ({ ...current, status: "completed" }));
    try {
      const trips = JSON.parse(
        window.localStorage.getItem("voyage:trips") || "[]",
      );
      window.localStorage.setItem(
        "voyage:trips",
        JSON.stringify(
          trips.map((item: { id: string }) =>
            item.id === tripId ? { ...item, status: "Completed" } : item,
          ),
        ),
      );
      await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    } finally {
      setSavingStatus(false);
    }
  };
  const packed = state.packing.length
    ? Math.round(
        (state.packing.filter((item) => item.checked).length /
          state.packing.length) *
          100,
      )
    : 0;
  const total = formatTotals(state.expenses);
  const plannedTotal = formatTotals(state.budget);
  const sections = ko
    ? [
        {
          key: "before",
          label: "여행 전",
          title: "준비하기",
          text: `준비물 ${packed}% 완료`,
          emoji: "◌",
        },
        {
          key: "during",
          label: "여행 중",
          title: "추억 만들기",
          text: `일정 ${state.schedule.length}개 · 장소 ${state.places.length}곳`,
          emoji: "✦",
        },
        {
          key: "after",
          label: "여행 후",
          title: "기록 남기기",
          text: total || "아직 지출 없음",
          emoji: "♡",
        },
      ]
    : [
        {
          key: "before",
          label: "Before",
          title: "Get ready",
          text: `${packed}% packing complete`,
          emoji: "◌",
        },
        {
          key: "during",
          label: "During",
          title: "Make memories",
          text: `${state.schedule.length} plans · ${state.places.length} places`,
          emoji: "✦",
        },
        {
          key: "after",
          label: "After",
          title: "Keep the story",
          text: `${total || "No spend yet"}`,
          emoji: "♡",
        },
      ];
  const today = new Date().toISOString().slice(0, 10);
  const isCompleted = trip.status.toLowerCase() === "completed";
  const phaseKey = isCompleted
    ? "after"
    : trip.startDate && trip.startDate <= today && (!trip.endDate || trip.endDate >= today)
      ? "during"
      : trip.endDate && trip.endDate < today
        ? "after"
        : "before";
  const visibleSections = showOtherPhases
    ? sections
    : sections.filter((section) => section.key === phaseKey);
  const beforeCards = [
    {
      key: "packing",
      href: `/trips/${tripId}/before/packing`,
      label: ko ? "준비물" : "Packing list",
      title: ko ? "준비물을 꼼꼼히 챙겨요" : "Pack with confidence",
      text: ko
        ? `${state.packing.filter((item) => item.checked).length} / ${state.packing.length}개 완료`
        : `${state.packing.filter((item) => item.checked).length} / ${state.packing.length} complete`,
      emoji: "✓",
    },
    {
      key: "budget",
      href: `/trips/${tripId}/before/budget`,
      label: ko ? "예산" : "Budget",
      title: ko ? "환전과 예산을 정리해요" : "Plan your travel money",
      text: plannedTotal || (ko ? "아직 예산이 없어요" : "No budget items yet"),
      emoji: "₩",
    },
    {
      key: "reservations",
      href: `/trips/${tripId}/before/reservations`,
      label: ko ? "예약" : "Reservations",
      title: ko ? "예약 정보를 모아둬요" : "Keep bookings together",
      text: ko
        ? `${state.reservations.length}건 저장됨`
        : `${state.reservations.length} saved`,
      emoji: "▣",
    },
  ];
  const flights = state.reservations.filter((item) => {
    const type = item.type.toLowerCase();
    return type.includes("flight") || type.includes("air") || Boolean(item.airline);
  });
  const stays = state.reservations.filter((item) => ["stay", "hotel", "accommodation"].some((type) => item.type.toLowerCase().includes(type)));
  const dateLabel = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" }) : "—";
  const nightsBetween = (from?: string, to?: string) => from && to ? Math.max(0, Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000)) : 0;
  return (
    <main
      data-section="trip-overview"
      className="min-h-screen px-5 py-8 sm:px-10 lg:px-20 lg:py-12"
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/trips"
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← {ko ? "내 여행" : "My trips"}
        </Link>
        <nav
          aria-label={ko ? "여행 메뉴" : "Trip navigation"}
          className="mt-6 -mx-5 overflow-x-auto border-y border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:-mx-10 sm:px-10 lg:-mx-20 lg:px-20"
        >
          <div className="mx-auto flex max-w-6xl gap-5 whitespace-nowrap text-sm font-bold">
            <Link href={`/trips/${tripId}`} className="text-[var(--color-primary)]">
              {ko ? "개요" : "Overview"}
            </Link>
            <Link href={`/trips/${tripId}/before`} className="muted">
              {ko ? "준비" : "Preparation"}
            </Link>
            <Link href={`/trips/${tripId}/before/packing`} className="muted">
              {ko ? "준비물 목록" : "Packing list"}
            </Link>
            <Link href={`/trips/${tripId}/before/budget`} className="muted">
              {ko ? "예산·환전" : "Budget & exchange"}
            </Link>
            <Link href={`/trips/${tripId}/before/reservations`} className="muted">
              {ko ? "예약" : "Reservations"}
            </Link>
          </div>
        </nav>
        <div
          data-section="trip-heading"
          className="mt-8 flex flex-wrap items-end justify-between gap-5"
        >
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-3">
              {isCompleted
                ? ko
                  ? "여행 기록"
                  : "Travel archive"
                : ko
                  ? "다음 여행"
                  : "Your next adventure"}
            </p>
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-4xl font-bold">{trip.title}</h1>
              <span className="flex flex-col items-center gap-1">
                <Link href={`/trips/${tripId}/edit`} aria-label={ko ? "여행 수정" : "Edit trip"} className="grid size-8 place-items-center rounded-full border border-[var(--color-border)] text-sm">✎</Link>
                {!isCompleted && <button onClick={completeTrip} disabled={savingStatus} className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold disabled:opacity-60">{savingStatus ? "…" : ko ? "완료" : "Done"}</button>}
              </span>
            </div>
            <p className="mt-2 muted">{trip.dates}</p>
          </div>
        </div>
        <section data-section="trip-reservation-summary" className="mt-7 grid gap-4 md:grid-cols-2">
          <article className="card p-5">
            <p className="eyebrow mb-2">{ko ? "항공편" : "Flight"}</p>
            {flights.length ? flights.map((item) => <div key={item.id}><h2 className="font-bold">{item.airline || item.title}</h2><p className="mt-2 text-sm muted">{dateLabel(item.date)}{item.time ? ` · ${item.time}` : ""}{item.terminal ? ` · ${item.terminal}` : ""}</p><p className="mt-1 text-xs muted">{item.location || (ko ? "터미널 미정" : "Terminal pending")}</p></div>) : <p className="text-sm muted">{ko ? "항공편 예약을 추가하면 표시돼요." : "Add a flight reservation to see it here."}</p>}
          </article>
          <article className="card p-5">
            <p className="eyebrow mb-2">{ko ? "숙박" : "Stay"}</p>
            {stays.length ? stays.map((item) => <div key={item.id}><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm muted">{nightsBetween(item.date, item.endDate || trip.endDate)}{ko ? "박" : " nights"} · {dateLabel(item.date)} — {dateLabel(item.endDate || trip.endDate)}{item.reservationNumber ? ` · ${ko ? "예약번호" : "No."} ${item.reservationNumber}` : ""}</p><p className="mt-1 text-xs muted">{item.location || (ko ? "주소 미정" : "Address pending")}</p></div>) : <p className="text-sm muted">{ko ? "숙박 예약을 추가하면 표시돼요." : "Add a stay reservation to see it here."}</p>}
          </article>
        </section>
        {phaseKey === "before" ? (
          <section data-section="before-focus" className="mt-10 grid gap-5 md:grid-cols-2">
            {beforeCards.map((item, index) => (
              <Link
                key={item.key}
                href={item.href}
                className={`card p-8 transition hover:-translate-y-1 ${index === 0 ? "bg-[var(--color-primary)] text-white md:col-span-2" : ""}`}
              >
                <span className={`grid size-14 place-items-center rounded-2xl text-2xl ${index === 0 ? "bg-white/15 text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-primary)]"}`}>
                  {item.emoji}
                </span>
                <p className={`eyebrow mt-8 ${index === 0 ? "text-white/70" : ""}`}>{item.label}</p>
                <h2 className="mt-2 text-3xl font-bold">{item.title}</h2>
                <p className={`mt-3 text-base ${index === 0 ? "text-white/80" : "muted"}`}>{item.text}</p>
                <span className={`mt-8 block text-sm font-bold ${index === 0 ? "text-white" : "text-[var(--color-primary)]"}`}>
                  {ko ? "관리하러 가기 →" : "Open →"}
                </span>
              </Link>
            ))}
          </section>
        ) : (
          <>
            <div data-section="trip-phases" className="mt-10 grid gap-5 md:grid-cols-3">
              {visibleSections.map((item) => (
                <Link key={item.key} href={`/trips/${tripId}/${item.key}`} className="card p-7 hover:-translate-y-1">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--color-surface-muted)] text-xl text-[var(--color-primary)]">{item.emoji}</span>
                  <p className="eyebrow mt-8">{item.label}</p>
                  <h2 className="mt-2 text-2xl font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm muted">{item.text}</p>
                  <span className="mt-8 block text-sm font-bold text-[var(--color-primary)]">{ko ? "열기 →" : "Open section →"}</span>
                </Link>
              ))}
            </div>
            <button type="button" onClick={() => setShowOtherPhases((value) => !value)} className="mt-4 text-sm font-bold text-[var(--color-primary)]">
              {showOtherPhases ? (ko ? "다른 단계 접기" : "Hide other phases") : (ko ? "다른 단계 보기" : "Show other phases")}
            </button>
          </>
        )}
        <section data-section="trip-snapshot" className="card mt-7 p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow mb-3">
                {ko ? "여행 한눈에 보기" : "Trip snapshot"}
              </p>
              <h2 className="text-2xl font-bold">
                {ko
                  ? "매일 조금씩 더 준비돼요."
                  : "A little more ready every day."}
              </h2>
            </div>
            <span className="text-sm font-bold text-[var(--color-primary)]">
              {packed}% {ko ? "완료" : "ready"}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              [String(state.places.length), "장소"],
              [total || "—", "지출"],
              [
                String(state.schedule.filter((item) => item.completed).length),
                "완료 일정",
              ],
            ].map(([value, label]) => (
              <div
                data-section="trip-snapshot-metric"
                key={label}
                className="rounded-2xl bg-[var(--color-background)] p-4"
              >
                <p className="text-xl font-bold">{value}</p>
                <p className="mt-1 text-xs muted">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  return <TripDataProvider tripId={tripId}><TripPageContent /></TripDataProvider>;
}

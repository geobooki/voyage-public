"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatTotals } from "@/lib/money";
import { TripDataProvider, useTripData } from "@/lib/trip-context";
import { PackingProvider, usePacking } from "@/lib/packing-context";
import { useLanguage } from "@/lib/i18n";
import { DateField } from "@/app/components/date-field";
import { AirportSelect } from "@/app/components/airport-select";
import { ReservationDocuments } from "@/app/components/reservation-documents";
import { TripScheduleCalendar } from "@/app/components/trip-schedule-calendar";

type TripMeta = { title: string; dates: string; startDate: string; endDate: string; status: string };
type QuickReservation = { title: string; type: string; date: string; endDate: string; time: string; location: string; departureLocation: string; arrivalLocation: string; departureTime: string; arrivalTime: string; airline: string; terminal: string; reservationNumber: string; memo: string; link: string };
const blankQuickReservation: QuickReservation = { title: "", type: "Flight", date: "", endDate: "", time: "", location: "", departureLocation: "", arrivalLocation: "", departureTime: "", arrivalTime: "", airline: "", terminal: "", reservationNumber: "", memo: "", link: "" };
const localDateIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function TripPageContent() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { state, addReservation, addSchedule } = useTripData();
  const { items: packingItems, categories: packingCategories, addItem } = usePacking();
  const [trip, setTrip] = useState<TripMeta>({
    title: "여행 정보를 불러오는 중…",
    dates: "날짜를 정해 주세요",
    status: "planning",
    startDate: "",
    endDate: "",
  });
  const [showOtherPhases, setShowOtherPhases] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [quickReservationOpen, setQuickReservationOpen] = useState(false);
  const [quickReservation, setQuickReservation] = useState<QuickReservation>(blankQuickReservation);
  const [quickFiles, setQuickFiles] = useState<File[]>([]);
  const [quickReservationError, setQuickReservationError] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({ date: "", time: "09:00", title: "", type: "관광", note: "" });
  const [schedulePage, setSchedulePage] = useState(0);
  const [mobileSchedulePage, setMobileSchedulePage] = useState(0);
  const [packingOpen, setPackingOpen] = useState(false);
  const [packingName, setPackingName] = useState("");
  const [packingCategory, setPackingCategory] = useState("기타");
  useEffect(() => {
    if (packingCategories.length && !packingCategories.some((item) => item.name === packingCategory))
      setPackingCategory(packingCategories[0].name);
  }, [packingCategory, packingCategories]);
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
        const response = await fetch(`/api/trips/${tripId}?view=meta`);
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
  const packed = packingItems.length
    ? Math.round(
        (packingItems.filter((item) => item.checked).length /
          packingItems.length) *
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
  const today = localDateIso(new Date());
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
        ? `${packingItems.filter((item) => item.checked).length} / ${packingItems.length}개 완료`
        : `${packingItems.filter((item) => item.checked).length} / ${packingItems.length} complete`,
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
      emoji: "🎟️",
    },
  ];
  const flights = state.reservations.filter((item) => {
    const type = item.type.toLowerCase();
    return type.includes("flight") || type.includes("air") || Boolean(item.airline);
  });
  const stays = state.reservations.filter((item) => ["stay", "hotel", "accommodation"].some((type) => item.type.toLowerCase().includes(type)));
  const otherReservations = state.reservations.filter((item) => !flights.some((flight) => flight.id === item.id) && !stays.some((stay) => stay.id === item.id));
  const todayFlights = flights.filter((item) => item.date === today);
  const dateLabel = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" }) : "—";
  const nightsBetween = (from?: string, to?: string) => from && to ? Math.max(0, Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000)) : 0;
  const openQuickReservation = (type: "Flight" | "Stay") => {
    setQuickReservation({ ...blankQuickReservation, type });
    setQuickFiles([]);
    setQuickReservationError("");
    setQuickReservationOpen(true);
  };
  const quickFlightTitle = quickReservation.departureLocation && quickReservation.arrivalLocation
    ? `${quickReservation.departureLocation.split(" · ")[0]} → ${quickReservation.arrivalLocation.split(" · ")[0]}`
    : "";
  const uploadQuickFiles = async (reservationId: string) => {
    for (const file of quickFiles) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/trips/${tripId}/reservations/${reservationId}/documents`, { method: "POST", body });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "첨부파일 업로드에 실패했어요.");
      }
    }
  };
  const saveQuickReservation = async (event: FormEvent) => {
    event.preventDefault();
    const isFlight = quickReservation.type === "Flight";
    if ((!isFlight && !quickReservation.title.trim()) || !quickReservation.date || !quickReservation.endDate || (isFlight
      ? (!quickFlightTitle || !quickReservation.departureTime || !quickReservation.arrivalTime)
      : (!quickReservation.departureTime || !quickReservation.arrivalTime))) return;
    setQuickReservationError("");
    const reservationId = addReservation({
      ...quickReservation,
      time: isFlight ? quickReservation.time : quickReservation.departureTime,
      title: isFlight ? quickFlightTitle : quickReservation.title.trim(),
      cost: 0,
    });
    try {
      await uploadQuickFiles(reservationId);
      setQuickReservationOpen(false);
      setQuickReservation(blankQuickReservation);
      setQuickFiles([]);
    } catch (error) {
      setQuickReservationError(error instanceof Error ? error.message : "첨부파일 업로드에 실패했어요.");
    }
  };
  const tripDates = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return [];
    const dates: string[] = [];
    const cursor = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);
    while (cursor <= end && dates.length < 31) {
      dates.push(localDateIso(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [trip.startDate, trip.endDate]);
  const scheduleDates = tripDates.length
    ? tripDates
    : Array.from(new Set(state.schedule.map((item) => item.date).filter(Boolean))).sort();
  const schedulePageCount = Math.max(1, Math.ceil(scheduleDates.length / 3));
  const visibleScheduleDates = scheduleDates.slice(schedulePage * 3, schedulePage * 3 + 3);
  useEffect(() => {
    setSchedulePage((current) => Math.min(current, schedulePageCount - 1));
    setMobileSchedulePage((current) => Math.min(current, Math.max(0, scheduleDates.length - 1)));
  }, [scheduleDates.length, schedulePageCount]);
  const weekdayLabel = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" });
  const openSchedule = (date: string, time = "09:00") => {
    setScheduleDraft({ date, time, title: "", type: "관광", note: "" });
    setScheduleOpen(true);
  };
  const saveSchedule = (event: FormEvent) => {
    event.preventDefault();
    if (!scheduleDraft.title.trim() || !scheduleDraft.date) return;
    addSchedule({ ...scheduleDraft, title: scheduleDraft.title.trim(), completed: false });
    setScheduleOpen(false);
  };
  const savePacking = (event: FormEvent) => {
    event.preventDefault();
    if (!packingName.trim()) return;
    addItem({ name: packingName.trim(), category: packingCategory || packingCategories[0]?.name || "기타", checked: false });
    setPackingName("");
    setPackingOpen(false);
  };
  return (
    <main
      data-section="trip-overview"
      className="relative min-h-screen px-5 py-8 sm:px-10 lg:px-20 lg:py-12"
    >
      <div className="mx-auto max-w-6xl">
        <Link href={`/trips/${tripId}`} className="mb-4 grid size-10 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl text-[var(--color-primary)] md:hidden" aria-label={ko ? "여행 개요로 이동" : "Go to trip overview"}>⌂</Link>
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
            <h1 className="text-4xl font-bold">{trip.title}</h1>
            <p className="mt-2 muted">{trip.dates}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/trips/${tripId}/edit`} aria-label={ko ? "여행 수정" : "Edit trip"} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-sm">✎</Link>
            {!isCompleted && <button onClick={completeTrip} disabled={savingStatus} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{savingStatus ? "…" : ko ? "완료" : "Done"}</button>}
          </div>
        </div>
        {phaseKey === "during" && <section data-section="trip-reservation-summary" className="mt-7 grid gap-4 md:grid-cols-3">
          {todayFlights.length > 0 && <article className="card p-5">
            <div className="flex items-start justify-between gap-3"><p className="eyebrow mb-2">{ko ? "오늘의 항공편" : "Today's flight"}</p><button type="button" onClick={() => openQuickReservation("Flight")} className="grid size-7 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold text-[var(--color-primary)]" aria-label={ko ? "항공편 예약 추가" : "Add flight reservation"}>+</button></div>
            {todayFlights.map((item) => <div key={item.id}><h2 className="font-bold">{item.airline || item.title}</h2><p className="mt-2 text-sm muted">{dateLabel(item.date)}{item.terminal ? ` · ${item.terminal}` : ""}</p><p className="mt-2 flex min-w-0 items-center gap-2 text-xs muted"><span className="min-w-0 flex-1 truncate">{item.departureLocation || item.location || "—"}{item.departureTime ? ` · ${item.departureTime}` : ""}</span><span aria-hidden="true">→</span><span className="min-w-0 flex-1 truncate text-right">{item.arrivalLocation || "—"}{item.arrivalTime ? ` · ${item.arrivalTime}` : ""}</span></p><ReservationDocuments tripId={tripId} reservationId={item.id} /></div>)}
          </article>}
          <article className="card p-5">
            <div className="flex items-start justify-between gap-3"><p className="eyebrow mb-2">{ko ? "숙박" : "Stay"}<span className="ml-2 text-xs muted">{stays.length ? `${stays.length}건` : ""}</span></p><button type="button" onClick={() => openQuickReservation("Stay")} className="grid size-7 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold text-[var(--color-primary)]" aria-label={ko ? "숙박 예약 추가" : "Add stay reservation"}>+</button></div>
            {stays.length ? stays.map((item) => <div key={item.id}><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm muted">{nightsBetween(item.date, item.endDate || trip.endDate)}{ko ? "박" : " nights"} · {dateLabel(item.date)} — {dateLabel(item.endDate || trip.endDate)}{item.reservationNumber ? ` · ${ko ? "예약번호" : "No."} ${item.reservationNumber}` : ""}</p><p className="mt-1 text-xs muted">{item.location || (ko ? "주소 미정" : "Address pending")}</p><ReservationDocuments tripId={tripId} reservationId={item.id} /></div>) : <p className="text-sm muted">{ko ? "숙박 예약을 추가하면 표시돼요." : "Add a stay reservation to see it here."}</p>}
          </article>
          <article className="card p-5">
            <div className="flex items-start justify-between gap-3"><p className="eyebrow mb-2">{ko ? "기타 예약" : "Other reservations"}</p><Link href={`/trips/${tripId}/before/reservations`} className="grid size-7 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold text-[var(--color-primary)]" aria-label={ko ? "기타 예약 관리" : "Manage other reservations"}>+</Link></div>
            {otherReservations.length ? otherReservations.map((item) => <div key={item.id}><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm muted">{item.type} · {dateLabel(item.date)}{item.location ? ` · ${item.location}` : ""}</p><ReservationDocuments tripId={tripId} reservationId={item.id} /></div>) : <p className="text-sm muted">{ko ? "투어·교통 등 기타 예약이 없어요." : "No tour or transport reservations yet."}</p>}
          </article>
        </section>}
        <section data-section="trip-schedule-board" className="card mt-7 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow mb-2">{ko ? "여행 일정" : "Trip schedule"}</p><h2 className="text-2xl font-bold">{ko ? "날짜별로 여행을 채워요." : "Build the trip day by day."}</h2><p className="mt-2 text-sm muted">{ko ? "시간을 누르면 그 시간에 일정을 추가할 수 있어요." : "Click a time to add a plan."}</p></div>
            <Link href={`/trips/${tripId}/during/schedule`} className="text-sm font-bold text-[var(--color-primary)]">{ko ? "일정 전체 보기 →" : "Open schedule →"}</Link>
          </div>
          {scheduleDates.length ? (
            <>
              <div className="mt-6 hidden items-center justify-between gap-3 md:flex">
                <button type="button" onClick={() => setSchedulePage((current) => Math.max(0, current - 1))} disabled={schedulePage === 0} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "이전 3일" : "Previous three days"}>‹</button>
                <p className="text-xs font-bold muted">{schedulePage * 3 + 1}–{Math.min((schedulePage + 1) * 3, scheduleDates.length)} / {scheduleDates.length}{ko ? "일" : " days"}</p>
                <button type="button" onClick={() => setSchedulePage((current) => Math.min(schedulePageCount - 1, current + 1))} disabled={schedulePage >= schedulePageCount - 1} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "다음 3일" : "Next three days"}>›</button>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 md:hidden">
                <button type="button" onClick={() => setMobileSchedulePage((current) => Math.max(0, current - 1))} disabled={mobileSchedulePage === 0} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "이전 날짜" : "Previous day"}>‹</button>
                <p className="text-xs font-bold muted">{mobileSchedulePage + 1} / {scheduleDates.length}{ko ? "일" : " days"}</p>
                <button type="button" onClick={() => setMobileSchedulePage((current) => Math.min(scheduleDates.length - 1, current + 1))} disabled={mobileSchedulePage >= scheduleDates.length - 1} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "다음 날짜" : "Next day"}>›</button>
              </div>
              <div className="hidden md:block">
                <TripScheduleCalendar dates={visibleScheduleDates} schedule={state.schedule} reservations={state.reservations} ko={ko} onAdd={openSchedule} />
              </div>
              <div className="md:hidden">
                <TripScheduleCalendar dates={[scheduleDates[mobileSchedulePage]]} schedule={state.schedule} reservations={state.reservations} ko={ko} onAdd={openSchedule} />
              </div>
            </>
          ) : <button type="button" onClick={() => openSchedule(trip.startDate || new Date().toISOString().slice(0, 10))} className="mt-6 w-full rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm font-bold text-[var(--color-primary)]">+ {ko ? "첫 일정 추가" : "Add your first plan"}</button>}
        </section>
        {phaseKey === "before" && <section data-section="packing-summary" className="card mt-7 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow mb-2">{ko ? "준비물" : "Packing"}</p><h2 className="text-xl font-bold">{packingItems.length ? `${packingItems.filter((item) => item.checked).length} / ${packingItems.length} ${ko ? "완료" : "complete"}` : (ko ? "아직 준비물이 없어요" : "No packing items yet")}</h2></div><div className="flex items-center gap-2"><button type="button" onClick={() => setPackingOpen(true)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)]">+ {ko ? "추가" : "Add"}</button><Link href={`/trips/${tripId}/before/packing`} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">{ko ? "자세히" : "Details"}</Link></div></div><div className="mt-4 h-2 rounded-full bg-[var(--color-background)]"><div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${packed}%` }} /></div></section>}
        {quickReservationOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5 py-6"><div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="quick-reservation-title"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow mb-2">{ko ? "예약 추가" : "Add reservation"}</p><h2 id="quick-reservation-title" className="text-2xl font-bold">{quickReservation.type === "Flight" ? (ko ? "항공편 예약" : "Flight reservation") : (ko ? "숙박 예약" : "Stay reservation")}</h2></div><button type="button" onClick={() => setQuickReservationOpen(false)} className="text-2xl" aria-label={ko ? "닫기" : "Close"}>×</button></div><form onSubmit={saveQuickReservation} className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold sm:col-span-2">{ko ? "예약 이름" : "Reservation name"}<input readOnly={quickReservation.type === "Flight"} required={quickReservation.type !== "Flight"} value={quickReservation.type === "Flight" ? quickFlightTitle : quickReservation.title} onChange={(event) => setQuickReservation({ ...quickReservation, title: event.target.value })} placeholder={quickReservation.type === "Flight" ? (ko ? "출발지와 도착지를 선택하면 자동 입력돼요" : "Select departure and arrival airports") : (ko ? "예: 다낭 호텔" : "e.g. Da Nang hotel")} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label>{quickReservation.type === "Flight" ? <><DateField label={ko ? "출발일" : "Departure date"} required value={quickReservation.date} onChange={(value) => setQuickReservation({ ...quickReservation, date: value })} /><DateField label={ko ? "도착일" : "Arrival date"} required value={quickReservation.endDate} onChange={(value) => setQuickReservation({ ...quickReservation, endDate: value })} /><AirportSelect label={ko ? "출발지" : "Departure airport"} required value={quickReservation.departureLocation} onChange={(value) => setQuickReservation({ ...quickReservation, departureLocation: value })} /><label className="text-xs font-bold">{ko ? "출발시간" : "Departure time"}<input required type="time" value={quickReservation.departureTime} onChange={(event) => setQuickReservation({ ...quickReservation, departureTime: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><AirportSelect label={ko ? "도착지" : "Arrival airport"} required value={quickReservation.arrivalLocation} onChange={(value) => setQuickReservation({ ...quickReservation, arrivalLocation: value })} /><label className="text-xs font-bold">{ko ? "도착시간" : "Arrival time"}<input required type="time" value={quickReservation.arrivalTime} onChange={(event) => setQuickReservation({ ...quickReservation, arrivalTime: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold">{ko ? "항공사" : "Airline"}<input value={quickReservation.airline} onChange={(event) => setQuickReservation({ ...quickReservation, airline: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold">{ko ? "터미널" : "Terminal"}<input value={quickReservation.terminal} onChange={(event) => setQuickReservation({ ...quickReservation, terminal: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label></> : <><DateField label={ko ? "체크인 날짜" : "Check-in date"} required value={quickReservation.date} onChange={(value) => setQuickReservation({ ...quickReservation, date: value })} /><label className="text-xs font-bold">{ko ? "체크인 시간" : "Check-in time"}<input required type="time" value={quickReservation.departureTime} onChange={(event) => setQuickReservation({ ...quickReservation, departureTime: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><DateField label={ko ? "체크아웃 날짜" : "Check-out date"} required value={quickReservation.endDate} onChange={(value) => setQuickReservation({ ...quickReservation, endDate: value })} /><label className="text-xs font-bold">{ko ? "체크아웃 시간" : "Check-out time"}<input required type="time" value={quickReservation.arrivalTime} onChange={(event) => setQuickReservation({ ...quickReservation, arrivalTime: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label></>}<label className="text-xs font-bold">{ko ? "장소" : "Location"}<input value={quickReservation.location} onChange={(event) => setQuickReservation({ ...quickReservation, location: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold">{ko ? "예약번호" : "Confirmation number"}<input value={quickReservation.reservationNumber} onChange={(event) => setQuickReservation({ ...quickReservation, reservationNumber: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold sm:col-span-2">{ko ? "첨부파일" : "Attachments"}<input type="file" multiple accept="image/*,application/pdf,.pdf" onChange={(event) => setQuickFiles(Array.from(event.target.files || []))} className="mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><span className="mt-1 block text-xs muted">{quickFiles.length ? `${quickFiles.length}개 파일 선택됨` : "사진 또는 PDF, 파일당 10MB 이하"}</span></label><label className="text-xs font-bold sm:col-span-2">{ko ? "메모" : "Memo"}<textarea value={quickReservation.memo} onChange={(event) => setQuickReservation({ ...quickReservation, memo: event.target.value })} className="mt-2 min-h-20 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label>{quickReservationError && <p className="text-sm font-semibold text-[var(--color-danger)] sm:col-span-2">{quickReservationError}</p>}<div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4 sm:col-span-2"><button type="button" onClick={() => setQuickReservationOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">{ko ? "저장" : "Save"}</button></div></form></div></div>}
        {scheduleOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5 py-6"><div className="card w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title"><div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{ko ? "일정 추가" : "Add plan"}</p><h2 id="schedule-dialog-title" className="text-xl font-bold">{scheduleDraft.date.slice(5).replace("-", "/")} · {scheduleDraft.time}</h2></div><button type="button" onClick={() => setScheduleOpen(false)} className="text-2xl">×</button></div><form onSubmit={saveSchedule} className="mt-5 space-y-3"><input required value={scheduleDraft.title} onChange={(event) => setScheduleDraft({ ...scheduleDraft, title: event.target.value })} placeholder={ko ? "무엇을 하나요?" : "What are you doing?"} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><input type="time" required value={scheduleDraft.time} onChange={(event) => setScheduleDraft({ ...scheduleDraft, time: event.target.value })} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><select value={scheduleDraft.type} onChange={(event) => setScheduleDraft({ ...scheduleDraft, type: event.target.value })} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"><option>관광</option><option>식사</option><option>활동</option><option>숙박</option><option>교통</option></select></div><input value={scheduleDraft.note} onChange={(event) => setScheduleDraft({ ...scheduleDraft, note: event.target.value })} placeholder={ko ? "메모 (선택)" : "Note (optional)"} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setScheduleOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "일정 저장" : "Save plan"}</button></div></form></div></div>}
        {packingOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5"><div className="card w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="packing-dialog-title"><div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{ko ? "준비물 추가" : "Add packing item"}</p><h2 id="packing-dialog-title" className="text-xl font-bold">{ko ? "준비물을 추가해요." : "Add a packing item."}</h2></div><button type="button" onClick={() => setPackingOpen(false)} className="text-2xl">×</button></div><form onSubmit={savePacking} className="mt-5 space-y-3"><input required value={packingName} onChange={(event) => setPackingName(event.target.value)} placeholder={ko ? "준비물 이름" : "Item name"} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><select value={packingCategory} onChange={(event) => setPackingCategory(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">{packingCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setPackingOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "추가" : "Add"}</button></div></form></div></div>}
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
  return <TripDataProvider tripId={tripId} view="overview"><PackingProvider tripId={tripId}><TripPageContent /></PackingProvider></TripDataProvider>;
}

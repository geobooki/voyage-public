"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatTotals } from "@/lib/money";
import { TripDataProvider, useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";
import { DateField } from "@/app/components/date-field";

type TripMeta = { title: string; dates: string; startDate: string; endDate: string; status: string };
type QuickReservation = { title: string; type: string; date: string; location: string; airline: string; terminal: string; reservationNumber: string; memo: string; link: string };
const blankQuickReservation: QuickReservation = { title: "", type: "Flight", date: "", location: "", airline: "", terminal: "", reservationNumber: "", memo: "", link: "" };
const localDateIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function TripPageContent() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { state, addReservation, addSchedule, addChecklist } = useTripData();
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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState({ date: "", time: "09:00", title: "", type: "관광", note: "" });
  const [packingOpen, setPackingOpen] = useState(false);
  const [packingName, setPackingName] = useState("");
  const [packingCategory, setPackingCategory] = useState("기타");
  useEffect(() => {
    if (state.packingCategories.length && !state.packingCategories.some((item) => item.name === packingCategory))
      setPackingCategory(state.packingCategories[0].name);
  }, [packingCategory, state.packingCategories]);
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
  const openQuickReservation = (type: "Flight" | "Stay") => {
    setQuickReservation({ ...blankQuickReservation, type });
    setQuickReservationOpen(true);
  };
  const saveQuickReservation = (event: FormEvent) => {
    event.preventDefault();
    if (!quickReservation.title.trim() || !quickReservation.date) return;
    addReservation({ ...quickReservation, title: quickReservation.title.trim(), cost: 0 });
    setQuickReservationOpen(false);
    setQuickReservation(blankQuickReservation);
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
    addChecklist("packing", { name: packingName.trim(), category: packingCategory || state.packingCategories[0]?.name || "기타", checked: false });
    setPackingName("");
    setPackingOpen(false);
  };
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
            <div className="flex items-start justify-between gap-3"><p className="eyebrow mb-2">{ko ? "항공편" : "Flight"}</p><button type="button" onClick={() => openQuickReservation("Flight")} className="grid size-7 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold text-[var(--color-primary)]" aria-label={ko ? "항공편 예약 추가" : "Add flight reservation"}>+</button></div>
            {flights.length ? flights.map((item) => <div key={item.id}><h2 className="font-bold">{item.airline || item.title}</h2><p className="mt-2 text-sm muted">{dateLabel(item.date)}{item.time ? ` · ${item.time}` : ""}{item.terminal ? ` · ${item.terminal}` : ""}</p><p className="mt-1 text-xs muted">{item.location || (ko ? "터미널 미정" : "Terminal pending")}</p></div>) : <p className="text-sm muted">{ko ? "항공편 예약을 추가하면 표시돼요." : "Add a flight reservation to see it here."}</p>}
          </article>
          <article className="card p-5">
            <div className="flex items-start justify-between gap-3"><p className="eyebrow mb-2">{ko ? "숙박" : "Stay"}</p><button type="button" onClick={() => openQuickReservation("Stay")} className="grid size-7 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold text-[var(--color-primary)]" aria-label={ko ? "숙박 예약 추가" : "Add stay reservation"}>+</button></div>
            {stays.length ? stays.map((item) => <div key={item.id}><h2 className="font-bold">{item.title}</h2><p className="mt-2 text-sm muted">{nightsBetween(item.date, item.endDate || trip.endDate)}{ko ? "박" : " nights"} · {dateLabel(item.date)} — {dateLabel(item.endDate || trip.endDate)}{item.reservationNumber ? ` · ${ko ? "예약번호" : "No."} ${item.reservationNumber}` : ""}</p><p className="mt-1 text-xs muted">{item.location || (ko ? "주소 미정" : "Address pending")}</p></div>) : <p className="text-sm muted">{ko ? "숙박 예약을 추가하면 표시돼요." : "Add a stay reservation to see it here."}</p>}
          </article>
        </section>
        <section data-section="trip-schedule-board" className="card mt-7 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow mb-2">{ko ? "여행 일정" : "Trip schedule"}</p><h2 className="text-2xl font-bold">{ko ? "날짜별로 여행을 채워요." : "Build the trip day by day."}</h2><p className="mt-2 text-sm muted">{ko ? "시간을 누르면 그 시간에 일정을 추가할 수 있어요." : "Click a time to add a plan."}</p></div>
            <Link href={`/trips/${tripId}/during/schedule`} className="text-sm font-bold text-[var(--color-primary)]">{ko ? "일정 전체 보기 →" : "Open schedule →"}</Link>
          </div>
          {scheduleDates.length ? <div className="mt-6 space-y-4">{scheduleDates.map((date) => { const daySchedules = state.schedule.filter((item) => item.date === date).sort((a, b) => a.time.localeCompare(b.time)); const dayReservations = state.reservations.filter((item) => item.date === date); return <section key={date} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[var(--color-primary)]">{date.slice(5).replace("-", "/")} · {weekdayLabel(date)}</p><p className="mt-1 text-xs muted">{daySchedules.length + dayReservations.length}{ko ? "개 일정·예약" : " plans & bookings"}</p></div><button type="button" onClick={() => openSchedule(date)} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-primary)]">+ {ko ? "일정" : "Plan"}</button></div><div className="mt-4 space-y-2">{dayReservations.map((item) => <div key={`reservation-${item.id}`} className="rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-surface)] p-3"><div className="flex items-start gap-3"><span className="text-base">{item.type.toLowerCase().includes("flight") || item.airline ? "✈" : item.type.toLowerCase().includes("tour") ? "✦" : "▣"}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[var(--color-primary)]">{item.time || (ko ? "예약" : "Booking")}</p><p className="mt-1 text-sm font-bold">{item.title}</p><p className="mt-1 text-xs muted">{item.type}{item.location ? ` · ${item.location}` : ""}</p></div></div></div>)}{daySchedules.map((item) => <div key={item.id} className={`rounded-xl bg-[var(--color-surface)] p-3 ${item.completed ? "opacity-60" : ""}`}><button type="button" onClick={() => openSchedule(date, item.time || "09:00")} className="flex w-full items-start gap-3 text-left"><span className="w-12 shrink-0 text-xs font-bold text-[var(--color-primary)]">{item.time || "—"}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${item.completed ? "line-through" : ""}`}>{item.title}</span><span className="mt-1 block text-xs muted">{item.type}{item.note ? ` · ${item.note}` : ""}</span></span></button></div>)}<div className="grid grid-cols-4 gap-2 pt-1">{["09:00", "12:00", "15:00", "18:00"].map((time) => <button key={time} type="button" onClick={() => openSchedule(date, time)} className="rounded-lg border border-dashed border-[var(--color-border)] px-2 py-2 text-xs muted hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">{time} +</button>)}</div></div></section>; })}</div> : <button type="button" onClick={() => openSchedule(trip.startDate || new Date().toISOString().slice(0, 10))} className="mt-6 w-full rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm font-bold text-[var(--color-primary)]">+ {ko ? "첫 일정 추가" : "Add your first plan"}</button>}
        </section>
        <section data-section="packing-summary" className="card mt-7 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow mb-2">{ko ? "준비물" : "Packing"}</p><h2 className="text-xl font-bold">{state.packing.length ? `${state.packing.filter((item) => item.checked).length} / ${state.packing.length} ${ko ? "완료" : "complete"}` : (ko ? "아직 준비물이 없어요" : "No packing items yet")}</h2></div><div className="flex items-center gap-2"><button type="button" onClick={() => setPackingOpen(true)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)]">+ {ko ? "추가" : "Add"}</button><Link href={`/trips/${tripId}/before/packing`} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">{ko ? "자세히" : "Details"}</Link></div></div><div className="mt-4 h-2 rounded-full bg-[var(--color-background)]"><div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${packed}%` }} /></div></section>
        {quickReservationOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5 py-6"><div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="quick-reservation-title"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow mb-2">{ko ? "예약 추가" : "Add reservation"}</p><h2 id="quick-reservation-title" className="text-2xl font-bold">{quickReservation.type === "Flight" ? (ko ? "항공편 예약" : "Flight reservation") : (ko ? "숙박 예약" : "Stay reservation")}</h2></div><button type="button" onClick={() => setQuickReservationOpen(false)} className="text-2xl" aria-label={ko ? "닫기" : "Close"}>×</button></div><form onSubmit={saveQuickReservation} className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold sm:col-span-2">{ko ? "예약 이름" : "Reservation name"}<input required value={quickReservation.title} onChange={(event) => setQuickReservation({ ...quickReservation, title: event.target.value })} placeholder={quickReservation.type === "Flight" ? "Vietnam Airlines" : (ko ? "예: 다낭 호텔" : "e.g. Da Nang hotel")} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><DateField label={ko ? "예약일" : "Reservation date"} required value={quickReservation.date} onChange={(value) => setQuickReservation({ ...quickReservation, date: value })} />{quickReservation.type === "Flight" && <><label className="text-xs font-bold">{ko ? "항공사" : "Airline"}<input value={quickReservation.airline} onChange={(event) => setQuickReservation({ ...quickReservation, airline: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold">{ko ? "터미널" : "Terminal"}<input value={quickReservation.terminal} onChange={(event) => setQuickReservation({ ...quickReservation, terminal: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label></>}<label className="text-xs font-bold">{ko ? "장소" : "Location"}<input value={quickReservation.location} onChange={(event) => setQuickReservation({ ...quickReservation, location: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold">{ko ? "예약번호" : "Confirmation number"}<input value={quickReservation.reservationNumber} onChange={(event) => setQuickReservation({ ...quickReservation, reservationNumber: event.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold sm:col-span-2">{ko ? "메모" : "Memo"}<textarea value={quickReservation.memo} onChange={(event) => setQuickReservation({ ...quickReservation, memo: event.target.value })} className="mt-2 min-h-20 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /></label><div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4 sm:col-span-2"><button type="button" onClick={() => setQuickReservationOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">{ko ? "저장" : "Save"}</button></div></form></div></div>}
        {scheduleOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5 py-6"><div className="card w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title"><div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{ko ? "일정 추가" : "Add plan"}</p><h2 id="schedule-dialog-title" className="text-xl font-bold">{scheduleDraft.date.slice(5).replace("-", "/")} · {scheduleDraft.time}</h2></div><button type="button" onClick={() => setScheduleOpen(false)} className="text-2xl">×</button></div><form onSubmit={saveSchedule} className="mt-5 space-y-3"><input required value={scheduleDraft.title} onChange={(event) => setScheduleDraft({ ...scheduleDraft, title: event.target.value })} placeholder={ko ? "무엇을 하나요?" : "What are you doing?"} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><input type="time" required value={scheduleDraft.time} onChange={(event) => setScheduleDraft({ ...scheduleDraft, time: event.target.value })} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><select value={scheduleDraft.type} onChange={(event) => setScheduleDraft({ ...scheduleDraft, type: event.target.value })} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"><option>관광</option><option>식사</option><option>활동</option><option>숙박</option><option>교통</option></select></div><input value={scheduleDraft.note} onChange={(event) => setScheduleDraft({ ...scheduleDraft, note: event.target.value })} placeholder={ko ? "메모 (선택)" : "Note (optional)"} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setScheduleOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "일정 저장" : "Save plan"}</button></div></form></div></div>}
        {packingOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5"><div className="card w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="packing-dialog-title"><div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{ko ? "준비물 추가" : "Add packing item"}</p><h2 id="packing-dialog-title" className="text-xl font-bold">{ko ? "준비물을 추가해요." : "Add a packing item."}</h2></div><button type="button" onClick={() => setPackingOpen(false)} className="text-2xl">×</button></div><form onSubmit={savePacking} className="mt-5 space-y-3"><input required value={packingName} onChange={(event) => setPackingName(event.target.value)} placeholder={ko ? "준비물 이름" : "Item name"} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm" /><select value={packingCategory} onChange={(event) => setPackingCategory(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">{state.packingCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setPackingOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "추가" : "Add"}</button></div></form></div></div>}
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

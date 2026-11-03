"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";
import { TripScheduleCalendar } from "@/app/components/trip-schedule-calendar";
import { ReservationDocuments } from "@/app/components/reservation-documents";
import { useTripMeta } from "@/lib/use-trip-meta";
import type { Reservation, ScheduleItem } from "@/types/trip";

type ScheduleForm = {
  date: string;
  title: string;
  time: string;
  endTime: string;
  durationMinutes: string;
  type: string;
  placeId?: string;
  note: string;
};
const control =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export default function SchedulePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const trip = useTripMeta(tripId);
  const isDomestic = trip.destinationCurrency === "KRW";
  const {
    state,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleScheduleComplete,
  } = useTripData();
  const defaultDate =
    state.weather[0]?.date || new Date().toISOString().slice(0, 10);
  const empty = (): ScheduleForm => ({
    date: defaultDate,
    title: "",
    time: "09:00",
    endTime: "",
    durationMinutes: "",
    type: "Sightseeing",
    placeId: "",
    note: "",
  });
  const [item, setItem] = useState<ScheduleForm>(() => empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [schedulePage, setSchedulePage] = useState(0);
  const dates = Array.from(
    new Set([
      ...state.schedule.map((entry) => entry.date),
      ...state.weather.map((day) => day.date),
      ...state.reservations.flatMap((reservation) => [reservation.date, reservation.endDate]),
    ]),
  )
    .filter((date): date is string => Boolean(date))
    .sort();
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!item.title.trim() || !item.date || !item.time) return;
    const current = state.schedule.find((entry) => entry.id === editingId);
    const value = {
      ...item,
      title: item.title.trim(),
      note: item.note.trim(),
      durationMinutes: item.durationMinutes ? Number(item.durationMinutes) : undefined,
      completed: current?.completed ?? false,
    };
    if (editingId) updateSchedule(editingId, value);
    else addSchedule(value);
    setItem(empty());
    setEditingId(null);
  };
  const edit = (entry: ScheduleItem) => {
    setEditingId(entry.id);
    setItem({
      date: entry.date,
      title: entry.title,
      time: entry.time,
      endTime: entry.endTime ?? "",
      durationMinutes: entry.durationMinutes ? String(entry.durationMinutes) : "",
      type: entry.type,
      placeId: entry.placeId ?? "",
      note: entry.note,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const visibleDates = dates.slice(dayIndex, dayIndex + 1);
  const schedulePageCount = Math.max(1, Math.ceil(dates.length / 3));
  const visibleDesktopDates = dates.slice(schedulePage * 3, schedulePage * 3 + 3);
  const openAt = (date: string, time: string) => {
    setItem((current) => ({ ...current, date, time }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const moveDay = (direction: number) => setDayIndex((current) => Math.max(0, Math.min(Math.max(0, dates.length - 1), current + direction)));
  return (
    <main
      data-section="schedule-board"
      className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/trips/${tripId}/during`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← 여행 중
        </Link>
        <p className="eyebrow mt-10 mb-3">일정 보드</p>
        <h1 className="text-4xl font-bold">하루하루를 완성해요.</h1>
        <p className="mt-2 muted">
          일정을 완료하면 추억 탭에 자동으로 기록됩니다.
        </p>
        <form onSubmit={save} className="card mt-9 space-y-4 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">날짜<input required type="date" value={item.date} onChange={(event) => setItem({ ...item, date: event.target.value })} className={`mt-2 ${control}`} /></label>
            <label className="text-sm font-bold">시간<input required type="time" value={item.time} onChange={(event) => setItem({ ...item, time: event.target.value })} className={`mt-2 ${control}`} /></label>
          </div>
          <label className="block text-sm font-bold">소요시간 <span className="font-normal muted">(선택)</span><div className="mt-2 flex items-center gap-2"><input type="number" min="1" value={item.durationMinutes} onChange={(event) => setItem({ ...item, durationMinutes: event.target.value, endTime: "" })} placeholder="예: 90" className={`max-w-xs ${control}`} /><span className="text-sm muted">분</span></div></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">타입<select value={item.type} onChange={(event) => setItem({ ...item, type: event.target.value })} className={`mt-2 ${control}`}><option>관광</option><option>식사</option><option>활동</option><option>숙박</option><option>교통</option></select></label>
            <label className="text-sm font-bold">장소<select value={item.placeId} onChange={(event) => setItem({ ...item, placeId: event.target.value })} className={`mt-2 ${control}`}><option value="">장소 없음</option>{state.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
          </div>
          <label className="block text-sm font-bold">무엇을 하는지<input required value={item.title} onChange={(event) => setItem({ ...item, title: event.target.value })} placeholder="예: 바나힐 케이블카 타기" className={`mt-2 ${control}`} /></label>
          <label className="block text-sm font-bold">메모 <span className="font-normal muted">(선택)</span><textarea value={item.note} onChange={(event) => setItem({ ...item, note: event.target.value })} placeholder="준비물이나 예약 정보를 적어두세요" rows={3} className={`mt-2 ${control}`} /></label>
          <button className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white sm:w-auto">{editingId ? "저장" : "일정 추가"}</button>
        </form>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setItem(empty());
            }}
            className="mt-3 text-sm font-bold text-[var(--color-primary)]"
          >
            편집 취소
          </button>
        )}
        {dates.length > 0 && <section className="card mt-7 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow mb-2">{ko ? "여행 일정" : "Trip schedule"}</p><h2 className="text-2xl font-bold">{ko ? "날짜별로 여행을 채워요." : "Build the trip day by day."}</h2><p className="mt-2 text-sm muted">{ko ? "시간을 누르면 위 입력폼에 일정이 채워져요." : "Click a time to start a plan."}</p></div>
            <div className="hidden items-center gap-2 md:flex"><button type="button" onClick={() => setSchedulePage((current) => Math.max(0, current - 1))} disabled={schedulePage === 0} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "이전 3일" : "Previous three days"}>‹</button><span className="text-xs font-bold muted">{schedulePage * 3 + 1}–{Math.min((schedulePage + 1) * 3, dates.length)} / {dates.length}{ko ? "일" : " days"}</span><button type="button" onClick={() => setSchedulePage((current) => Math.min(schedulePageCount - 1, current + 1))} disabled={schedulePage >= schedulePageCount - 1} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "다음 3일" : "Next three days"}>›</button></div>
          </div>
          <div className="hidden md:block"><TripScheduleCalendar dates={visibleDesktopDates} schedule={state.schedule} reservations={state.reservations} ko={ko} onAdd={openAt} onReservationClick={(_reservation: Reservation) => undefined} onScheduleClick={edit} /></div>
          <div className="md:hidden"><TripScheduleCalendar dates={[dates[dayIndex]]} schedule={state.schedule} reservations={state.reservations} ko={ko} onAdd={openAt} onReservationClick={(_reservation: Reservation) => undefined} onScheduleClick={edit} /></div>
          {isDomestic && state.schedule.length > 0 && <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"><p className="text-sm font-bold">일정별 첨부파일</p><p className="mt-1 text-xs muted">국내 여행은 예약 탭 대신 각 일정에 사진이나 PDF를 선택적으로 추가할 수 있어요.</p><div className="mt-3 space-y-3">{state.schedule.map((entry) => <div key={entry.id} className="rounded-xl bg-[var(--color-surface)] px-3"><p className="pt-3 text-sm font-bold">{entry.date} · {entry.title}</p><ReservationDocuments tripId={tripId} itemId={entry.id} resource="schedule" /></div>)}</div></section>}
        </section>}
        <div className="hidden">
          <button type="button" onClick={() => moveDay(-1)} disabled={dayIndex === 0} className="grid size-10 place-items-center rounded-full border border-[var(--color-border)] text-xl font-bold disabled:opacity-30" aria-label="이전 날짜">‹</button>
          <p className="text-sm font-bold text-[var(--color-primary)]">{dates.length ? `${dayIndex + 1} / ${dates.length}` : "일정 없음"}</p>
          <button type="button" onClick={() => moveDay(1)} disabled={dayIndex >= dates.length - 1} className="grid size-10 place-items-center rounded-full border border-[var(--color-border)] text-xl font-bold disabled:opacity-30" aria-label="다음 날짜">›</button>
        </div>
        <div className="hidden" onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => { if (touchStart == null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart; if (Math.abs(delta) > 45) moveDay(delta < 0 ? 1 : -1); setTouchStart(null); }}>
          {visibleDates.map((date) => (
            <section
              data-section={`schedule-day-${date}`}
              className="min-h-56 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              key={date}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-primary)]">
                  {date}
                </p>
                <span className="text-xs muted">
                  {state.schedule.filter((entry) => entry.date === date).length + state.reservations.filter((reservation) => reservation.date === date || reservation.endDate === date).length}
                  개
                </span>
              </div>
              {state.reservations
                .filter((reservation) => reservation.date === date || reservation.endDate === date)
                .sort((a, b) => (a.date === date ? a.time || a.departureTime || "00:00" : a.arrivalTime || "23:59").localeCompare(b.date === date ? b.time || b.departureTime || "00:00" : b.arrivalTime || "23:59"))
                .map((reservation) => (
                  <div
                    data-section="schedule-reservation"
                    className="mt-4 rounded-2xl border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] p-4 shadow-sm"
                    key={`${date}-${reservation.id}`}
                  >
                    <p className="text-xs font-bold text-[var(--color-accent)]">
                      {reservation.type} · {reservation.date === date ? (reservation.time || reservation.departureTime || "시간 미정") : (reservation.arrivalTime || "도착")}
                    </p>
                    <p className="mt-2 text-sm font-bold">{reservation.title}</p>
                    <p className="mt-2 text-xs muted">
                      {reservation.departureLocation && reservation.arrivalLocation
                        ? `${reservation.departureLocation} → ${reservation.arrivalLocation}`
                        : reservation.location || "예약 장소 미정"}
                    </p>
                  </div>
                ))}
              {state.schedule
                .filter((entry) => entry.date === date)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((entry) => (
                  <div
                    data-section="schedule-item"
                    className={`mt-4 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm ${entry.completed ? "opacity-60" : ""}`}
                    key={entry.id}
                  >
                    <div className="flex items-start gap-3">
                  <input
                        type="checkbox"
                        checked={entry.completed}
                        onChange={() => toggleScheduleComplete(entry.id)}
                        aria-label={`${entry.title} 완료`}
                        className="mt-1 size-4 accent-[var(--color-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => edit(entry)}
                        className="block flex-1 text-left"
                      >
                        <p className="text-xs font-bold text-[var(--color-primary)]">
                          {entry.time || "시간 미정"}{entry.endTime ? ` – ${entry.endTime}` : entry.durationMinutes ? ` · ${entry.durationMinutes}분` : ""}
                        </p>
                        <p
                          className={`mt-2 text-sm font-bold ${entry.completed ? "line-through" : ""}`}
                        >
                          {entry.title}
                        </p>
                        <p className="mt-2 text-xs muted">
                          {entry.type} ·{" "}
                          {state.places.find(
                            (place) => place.id === entry.placeId,
                          )?.name || "장소 없음"}
                        </p>
                        {entry.note && (
                          <p className="mt-2 text-xs muted">{entry.note}</p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSchedule(entry.id)}
                        aria-label={`${entry.title} 삭제`}
                        className="text-lg font-bold text-[var(--color-danger)]"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
            </section>
          ))}
        </div>
        {!dates.length && (
          <div className="card mt-6 p-6 text-sm muted">
            아직 일정이 없습니다. 위에서 첫 일정을 추가하세요.
          </div>
        )}
      </div>
    </main>
  );
}

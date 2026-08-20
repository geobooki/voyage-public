"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import type { ScheduleItem } from "@/types/trip";

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
  const dates = Array.from(
    new Set([
      ...state.schedule.map((entry) => entry.date),
      ...state.weather.map((day) => day.date),
      ...state.reservations.flatMap((reservation) => [reservation.date, reservation.endDate]),
    ]),
  )
    .filter(Boolean)
    .sort();
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!item.title.trim() || !item.date || (!item.endTime && !item.durationMinutes)) return;
    if (item.endTime && item.durationMinutes) return;
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
        <form
          onSubmit={save}
          className="card mt-9 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-7"
        >
          <input
            required
            type="date"
            value={item.date}
            onChange={(event) => setItem({ ...item, date: event.target.value })}
            className={control}
          />
          <input
            required
            value={item.title}
            onChange={(event) =>
              setItem({ ...item, title: event.target.value })
            }
            placeholder="무엇을 하나요?"
            className={control}
          />
          <input
            type="time"
            value={item.time}
            onChange={(event) => setItem({ ...item, time: event.target.value })}
            className={control}
          />
          <input
            type="time"
            value={item.endTime}
            onChange={(event) => setItem({ ...item, endTime: event.target.value, durationMinutes: "" })}
            placeholder="종료 시간"
            aria-label="종료 시간"
            className={control}
          />
          <input
            type="number"
            min="1"
            value={item.durationMinutes}
            onChange={(event) => setItem({ ...item, durationMinutes: event.target.value, endTime: "" })}
            placeholder="소요 시간(분)"
            aria-label="소요 시간(분)"
            className={control}
          />
          <select
            value={item.type}
            onChange={(event) => setItem({ ...item, type: event.target.value })}
            className={control}
          >
            <option>관광</option>
            <option>식사</option>
            <option>활동</option>
            <option>숙박</option>
            <option>교통</option>
          </select>
          <select
            value={item.placeId}
            onChange={(event) =>
              setItem({ ...item, placeId: event.target.value })
            }
            className={control}
          >
            <option value="">장소 없음</option>
            {state.places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
          <input
            value={item.note}
            onChange={(event) => setItem({ ...item, note: event.target.value })}
            placeholder="메모"
            className={control}
          />
          <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">
            {editingId ? "저장" : "추가"}
          </button>
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
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => moveDay(-1)} disabled={dayIndex === 0} className="grid size-10 place-items-center rounded-full border border-[var(--color-border)] text-xl font-bold disabled:opacity-30" aria-label="이전 날짜">‹</button>
          <p className="text-sm font-bold text-[var(--color-primary)]">{dates.length ? `${dayIndex + 1} / ${dates.length}` : "일정 없음"}</p>
          <button type="button" onClick={() => moveDay(1)} disabled={dayIndex >= dates.length - 1} className="grid size-10 place-items-center rounded-full border border-[var(--color-border)] text-xl font-bold disabled:opacity-30" aria-label="다음 날짜">›</button>
        </div>
        <div className="mt-3" onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => { if (touchStart == null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart; if (Math.abs(delta) > 45) moveDay(delta < 0 ? 1 : -1); setTouchStart(null); }}>
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

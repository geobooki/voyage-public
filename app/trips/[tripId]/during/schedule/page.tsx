"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTripData } from "@/lib/trip-context";

type ScheduleForm = {
  date: string;
  title: string;
  time: string;
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
    type: "Sightseeing",
    placeId: "",
    note: "",
  });
  const [item, setItem] = useState<ScheduleForm>(() => empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const dates = Array.from(
    new Set([
      ...state.schedule.map((entry) => entry.date),
      ...state.weather.map((day) => day.date),
    ]),
  )
    .filter(Boolean)
    .sort();
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!item.title.trim() || !item.date) return;
    const current = state.schedule.find((entry) => entry.id === editingId);
    const value = {
      ...item,
      title: item.title.trim(),
      note: item.note.trim(),
      completed: current?.completed ?? false,
    };
    if (editingId) updateSchedule(editingId, value);
    else addSchedule(value);
    setItem(empty());
    setEditingId(null);
  };
  const edit = (entry: ScheduleForm & { id: string; completed: boolean }) => {
    setEditingId(entry.id);
    setItem({
      date: entry.date,
      title: entry.title,
      time: entry.time,
      type: entry.type,
      placeId: entry.placeId ?? "",
      note: entry.note,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
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
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {dates.map((date) => (
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
                  {state.schedule.filter((entry) => entry.date === date).length}
                  개
                </span>
              </div>
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
                          {entry.time || "시간 미정"}
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

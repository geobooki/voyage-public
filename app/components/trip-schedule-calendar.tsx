"use client";

import type { Reservation, ScheduleItem } from "@/types/trip";

const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

const hourOf = (value?: string) => (value ? value.slice(0, 2) : "");

export function TripScheduleCalendar({
  dates,
  schedule,
  reservations,
  ko,
  onAdd,
}: {
  dates: string[];
  schedule: ScheduleItem[];
  reservations: Reservation[];
  ko: boolean;
  onAdd: (date: string, time: string) => void;
}) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {dates.map((date) => {
        const daySchedule = schedule.filter((item) => item.date === date);
        const dayReservations = reservations.filter((item) => item.date === date);
        const untimed = [
          ...dayReservations.filter((item) => !item.time && !item.departureTime).map((item) => ({ kind: "reservation" as const, item })),
          ...daySchedule.filter((item) => !item.time).map((item) => ({ kind: "schedule" as const, item })),
        ];
        return (
          <section
            key={date}
            className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]"
          >
            <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--color-primary)]">
                {date.slice(5).replace("-", "/")} · {new Date(`${date}T00:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}
              </p>
              <p className="mt-1 text-xs muted">
                {daySchedule.length + dayReservations.length}{ko ? "개 일정·예약" : " plans & bookings"}
              </p>
            </header>
            <div className="divide-y divide-[var(--color-border)]">
              {untimed.map(({ kind, item }) => {
                return <div key={`${kind}-${item.id}`} className="min-h-14 bg-[var(--color-surface)] px-3 py-3 text-xs"><span className="font-bold text-[var(--color-primary)]">{kind === "reservation" ? (ko ? "예약" : "Booking") : "—"}</span><p className="mt-1 font-bold">{item.title}</p></div>;
              })}
              {slots.map((slot) => {
                const slotHour = hourOf(slot);
                const slotSchedule = daySchedule.filter((item) => hourOf(item.time) === slotHour);
                const slotReservations = dayReservations.filter((item) => hourOf(item.departureTime || item.time) === slotHour);
                return (
                  <button key={slot} type="button" onClick={() => onAdd(date, slot)} className="flex min-h-16 w-full gap-3 px-3 py-3 text-left transition hover:bg-[var(--color-surface-muted)]">
                    <span className="w-11 shrink-0 pt-0.5 text-[11px] font-bold text-[var(--color-text-muted)]">{slot}</span>
                    <span className="min-w-0 flex-1 space-y-1">
                      {slotReservations.map((item) => <span key={`reservation-${item.id}`} className="block rounded-lg border border-[var(--color-primary)]/25 bg-[var(--color-surface)] px-2 py-1.5"><span className="block text-[10px] font-bold text-[var(--color-primary)]">{item.type}</span><span className="block truncate text-xs font-bold">{item.title}</span>{item.departureLocation && <span className="block truncate text-[10px] muted">{item.departureLocation} → {item.arrivalLocation}</span>}</span>)}
                      {slotSchedule.map((item) => <span key={item.id} className={`block rounded-lg bg-[var(--color-surface)] px-2 py-1.5 ${item.completed ? "opacity-60" : ""}`}><span className={`block truncate text-xs font-bold ${item.completed ? "line-through" : ""}`}>{item.title}</span><span className="mt-0.5 block truncate text-[10px] muted">{item.type}{item.note ? ` · ${item.note}` : ""}</span></span>)}
                      {!slotReservations.length && !slotSchedule.length && <span className="block text-[10px] text-[var(--color-border)]">＋</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

"use client";

import type { Reservation, ScheduleItem } from "@/types/trip";
import { formatDate } from "@/lib/date";

const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

const hourOf = (value?: string) => (value ? Number(value.slice(0, 2)) : null);
const isStay = (type: string) => ["stay", "숙박", "hotel", "호텔", "accommodation"].includes(type.trim().toLowerCase());
const reservationColor = (type: string) => {
  const normalized = type.trim().toLowerCase();
  if (normalized.includes("flight") || normalized.includes("항공")) return "#BAE6FD";
  if (isStay(normalized)) return "#DDD6FE";
  if (normalized.includes("restaurant") || normalized.includes("식사") || normalized.includes("식당")) return "#FBCFE8";
  if (normalized.includes("tour") || normalized.includes("관광")) return "#BBF7D0";
  if (normalized.includes("transport") || normalized.includes("교통")) return "#FED7AA";
  return "#C7D2FE";
};

// The calendar keeps a compact two-hour grid. An event at 09:00 therefore
// belongs to the 08:00–10:00 row instead of disappearing between rows.
const belongsToSlot = (value: string | undefined, slotHour: number, lastSlot: boolean) => {
  const hour = hourOf(value);
  if (hour === null) return false;
  return lastSlot ? hour >= slotHour : hour >= slotHour && hour < slotHour + 2;
};

export function TripScheduleCalendar({
  dates,
  schedule,
  reservations,
  ko,
  onAdd,
  onReservationClick,
}: {
  dates: string[];
  schedule: ScheduleItem[];
  reservations: Reservation[];
  ko: boolean;
  onAdd: (date: string, time: string) => void;
  onReservationClick: (reservation: Reservation) => void;
}) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {dates.map((date) => {
        const daySchedule = schedule.filter((item) => item.date === date);
        const dayStays = reservations.filter((item) => {
          if (!isStay(item.type)) return false;
          const start = item.date;
          const end = item.endDate || start;
          return start <= date && date <= end;
        });
        const dayReservations = reservations.filter((item) => item.date === date && !isStay(item.type));
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
                {formatDate(date)} · {new Date(`${date}T00:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}
              </p>
              <p className="mt-1 text-xs muted">
                {daySchedule.length + dayReservations.length}{ko ? "개 일정·예약" : " plans & bookings"}
              </p>
            </header>
            {dayStays.length > 0 && <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">{dayStays.map((item) => <div key={item.id} className="flex items-center gap-2 text-[11px]"><span aria-hidden="true">⌂</span><span className="truncate font-bold">{item.title}</span><span className="ml-auto shrink-0 muted">{item.location || (ko ? "숙소" : "Stay")}</span></div>)}</div>}
            <div className="divide-y divide-[var(--color-border)]">
              {untimed.map(({ kind, item }) => {
                return <div key={`${kind}-${item.id}`} role={kind === "reservation" ? "button" : undefined} tabIndex={kind === "reservation" ? 0 : undefined} onClick={kind === "reservation" ? () => onReservationClick(item as Reservation) : undefined} className={`min-h-14 bg-[var(--color-surface)] px-3 py-3 text-xs ${kind === "reservation" ? "cursor-pointer" : "border-l-2 border-dashed border-[var(--color-accent)]"}`} style={kind === "reservation" ? { borderLeft: `3px solid ${reservationColor((item as Reservation).type)}` } : undefined}><span className="font-bold text-[var(--color-primary)]">{kind === "reservation" ? (ko ? "예약" : "Booking") : (ko ? "내 일정" : "My plan")}</span><p className="mt-1 font-bold">{item.title}</p></div>;
              })}
              {slots.map((slot, index) => {
                const slotHour = hourOf(slot) ?? 0;
                const slotReservations = dayReservations.filter((item) =>
                  belongsToSlot(item.departureTime || item.time, slotHour, index === slots.length - 1),
                );
                const slotSchedule = daySchedule.filter((item) =>
                  belongsToSlot(item.time, slotHour, index === slots.length - 1),
                );
                return (
                  <button key={slot} type="button" onClick={() => onAdd(date, slot)} className="flex min-h-16 w-full gap-3 px-3 py-3 text-left transition hover:bg-[var(--color-surface-muted)]">
                    <span className="w-11 shrink-0 pt-0.5 text-[11px] font-bold text-[var(--color-text-muted)]">
                      {slot}
                      {index < slots.length - 1 && <span className="mt-1 block text-[9px] font-normal opacity-60">{slots[index + 1]}</span>}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      {slotReservations.map((item) => <span key={`reservation-${item.id}`} role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onReservationClick(item); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onReservationClick(item); } }} className="block cursor-pointer rounded-lg border bg-[var(--color-surface)] px-2 py-1.5" style={{ borderColor: reservationColor(item.type) }}><span className="block text-[10px] font-bold" style={{ color: reservationColor(item.type) }}>{ko ? "예약" : "Booking"} · {item.type}{item.departureTime || item.time ? ` · ${item.departureTime || item.time}` : ""}</span><span className="block truncate text-xs font-bold">{item.title}</span>{item.departureLocation && <span className="block truncate text-[10px] muted">{item.departureLocation} → {item.arrivalLocation}</span>}</span>)}
                      {slotSchedule.map((item) => <span key={item.id} className={`block rounded-lg border border-dashed border-[var(--color-accent)] bg-[var(--color-surface)] px-2 py-1.5 ${item.completed ? "opacity-60" : ""}`}><span className={`block text-[10px] font-bold text-[var(--color-accent)] ${item.completed ? "line-through" : ""}`}>{ko ? "내 일정" : "My plan"}</span><span className={`block truncate text-xs font-bold ${item.completed ? "line-through" : ""}`}>{item.title}</span><span className="mt-0.5 block truncate text-[10px] muted">{item.time ? `${item.time}${item.endTime ? `–${item.endTime}` : item.durationMinutes ? ` · ${item.durationMinutes}분` : ""} · ` : ""}{item.type}{item.note ? ` · ${item.note}` : ""}</span></span>)}
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

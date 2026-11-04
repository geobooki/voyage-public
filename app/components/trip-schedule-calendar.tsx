"use client";

import type { Reservation, ScheduleItem } from "@/types/trip";
import { formatDate } from "@/lib/date";
import { timeMinutes, durationBetween, timingFromDuration, layoutIntervals } from "@/lib/schedule-time";

// Keep the original compact two-hour spacing; expand only occupied intervals.
function compactTimeline(events: { start: number; end: number }[]) {
  const start = Math.min(480, ...events.map((event) => Math.floor(event.start / 120) * 120));
  const end = Math.max(1320, ...events.map((event) => Math.ceil(event.end / 120) * 120));
  const boundaries = [...new Set([
    ...Array.from({ length: (end - start) / 120 + 1 }, (_, index) => start + index * 120),
    ...events.flatMap((event) => [event.start, event.end]),
  ])].sort((a, b) => a - b);
  let height = 0;
  const segments = boundaries.slice(0, -1).map((minute, index) => {
    const next = boundaries[index + 1];
    const occupied = events.some((event) => event.start < next && event.end > minute);
    const size = occupied ? Math.max(18, (next - minute) * 0.8) : (next - minute) * 56 / 120;
    const segment = { start: minute, end: next, top: height, height: size };
    height += size;
    return segment;
  });
  const position = (minute: number) => {
    const segment = segments.find((segment) => minute >= segment.start && minute < segment.end);
    return segment ? segment.top + (minute - segment.start) / (segment.end - segment.start) * segment.height : height;
  };
  return { segments, height, position };
}
const displayTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const isStay = (type: string) => ["stay", "숙박", "hotel", "호텔", "accommodation"].includes(type.trim().toLowerCase());
const dayNumber = (date: string) => Date.parse(date + "T00:00:00Z") / 86400000;
type CalendarEvent = { kind: "schedule"; item: ScheduleItem; start: number; end: number; color: string } | { kind: "reservation"; item: Reservation; start: number; end: number; color: string };

export function TripScheduleCalendar({ dates, schedule, reservations, ko, onAdd, onReservationClick, onScheduleClick }: {
  dates: string[];
  schedule: ScheduleItem[];
  reservations: Reservation[];
  ko: boolean;
  onAdd: (date: string, time: string) => void;
  onReservationClick: (reservation: Reservation) => void;
  onScheduleClick: (schedule: ScheduleItem) => void;
}) {
  return <div className="mt-6 grid items-start gap-3 md:grid-cols-3">{dates.map((date) => {
    const dayStays = reservations.filter((item) => isStay(item.type) && item.date <= date && date <= (item.endDate || item.date));
    const untimedSchedule = schedule.filter((item) => item.date === date && !item.time);
    const untimedReservations = reservations.filter((item) => item.date === date && !isStay(item.type) && !item.time && !item.departureTime);
    const entries: CalendarEvent[] = [];
    const clip = (entry: CalendarEvent) => {
      if (Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > 0 && entry.start < 1440)
        entries.push({ ...entry, start: Math.max(0, entry.start), end: Math.min(1440, entry.end) });
    };
    for (const item of schedule) {
      if (!item.time) continue;
      const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(item.time);
      const duration = item.endTime ? durationBetween(item.time, item.endTime) : item.durationMinutes || 30;
      clip({ kind: "schedule", item, start, end: start + Math.max(5, duration), color: "var(--color-accent)" });
    }
    for (const item of reservations) {
      const time = item.departureTime || item.time;
      if (!time || isStay(item.type)) continue;
      const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(time);
      const endOffset = item.endDate ? (dayNumber(item.endDate) - dayNumber(item.date)) * 1440 : 0;
      const duration = item.arrivalTime ? (endOffset > 0 ? endOffset + timeMinutes(item.arrivalTime) - timeMinutes(time) : durationBetween(time, item.arrivalTime)) : 30;
      clip({ kind: "reservation", item, start, end: start + Math.max(5, duration), color: "#7CB5D9" });
    }
    const events = layoutIntervals(entries);
    const timeline = compactTimeline(events);
    return <section key={date} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"><p className="text-sm font-bold text-[var(--color-primary)]">{formatDate(date)} · {new Date(date + "T00:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}</p><p className="mt-1 text-xs muted">{events.length + untimedSchedule.length + untimedReservations.length}{ko ? "개 일정·예약 · 5분 단위" : " plans & bookings · 5-minute intervals"}</p></header>
      {dayStays.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block w-full border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-bold">⌂ {item.title}</button>)}
      {untimedReservations.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block w-full border-b border-[var(--color-border)] px-3 py-2 text-left text-xs">{ko ? "시간 미정" : "No time"} · {item.title}</button>)}
      {untimedSchedule.map((item) => <button key={item.id} type="button" onClick={() => onScheduleClick(item)} className="block w-full border-b border-[var(--color-border)] px-3 py-2 text-left text-xs">{ko ? "시간 미정" : "No time"} · {item.title}</button>)}
      <div className="max-h-[640px] overflow-y-auto" aria-label={ko ? "여행 일정 시간표" : "Trip timeline"}>
        <div className="relative" style={{ height: timeline.height }}>
          {timeline.segments.map((segment) => {
            const time = displayTime(segment.start);
            return <button key={segment.start} type="button" onClick={() => onAdd(date, time)} aria-label={ko ? `${date} ${time} 일정 추가` : `Add plan at ${date} ${time}`} className="absolute left-0 w-full border-t border-[var(--color-border)] text-left hover:bg-[var(--color-surface-muted)]" style={{ top: segment.top, height: segment.height }}><span className="absolute left-1 top-1 text-[9px] leading-none text-[var(--color-text-muted)]">{time}</span></button>;
          })}
          <div className="pointer-events-none absolute inset-y-0 left-12 right-1">{events.map((event) => {
            const startTime = event.kind === "schedule" ? event.item.time : event.item.departureTime || event.item.time || "";
            const endTime = event.kind === "schedule" ? event.item.endTime || (event.item.durationMinutes ? timingFromDuration(event.item.time, String(event.item.durationMinutes)).endTime : (ko ? "소요시간 미정" : "duration not set")) : event.item.arrivalTime || "";
            const note = event.kind === "schedule" ? event.item.note : event.item.memo;
            const label = `${startTime}${endTime ? "–" + endTime : ""} · ${event.item.title}${note ? "\\n" + note : ""}`;
            return <button key={event.kind + event.item.id} type="button" onClick={() => event.kind === "schedule" ? onScheduleClick(event.item) : onReservationClick(event.item)} title={label} aria-label={label} className={`pointer-events-auto absolute flex flex-col items-stretch justify-start overflow-y-auto rounded border bg-[var(--color-surface)] px-1 text-left text-[10px] leading-tight ${event.kind === "schedule" && event.item.completed ? "opacity-60" : ""}`} style={{ top: timeline.position(event.start), height: timeline.position(event.end) - timeline.position(event.start), left: `${event.lane * 100 / event.columns}%`, width: `calc(${100 / event.columns}% - 2px)`, borderColor: event.color, borderLeftWidth: 3 }}><span className="block whitespace-pre-wrap break-words font-bold">{event.item.title}</span>{event.end - event.start >= 15 && <span className="block truncate muted">{startTime}{endTime ? "–" + endTime : ""}</span>}{note && <span className="mt-1 block whitespace-pre-wrap break-words text-[10px] muted">{note}</span>}</button>;
          })}</div>
        </div>
      </div>
    </section>;
  })}</div>;
}

"use client";

import type { Reservation, ScheduleItem } from "@/types/trip";
import { formatDate } from "@/lib/date";
import { timeMinutes, durationBetween, timingFromDuration, layoutIntervals, usesScheduleDuration } from "@/lib/schedule-time";

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
    const size = occupied ? Math.max(48, (next - minute) * 0.8) : (next - minute) * 64 / 120;
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

function eventsForDate(date: string, schedule: ScheduleItem[], reservations: Reservation[]) {
    const entries: CalendarEvent[] = [];
    const clip = (entry: CalendarEvent) => {
      if (Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > 0 && entry.start < 1440)
        entries.push({ ...entry, start: Math.max(0, entry.start), end: Math.min(1440, entry.end) });
    };
    for (const item of schedule) {
      if (!item.time || !usesScheduleDuration(item.type)) continue;
      const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(item.time);
      const duration = item.endTime ? durationBetween(item.time, item.endTime) : item.durationMinutes || 60;
      clip({ kind: "schedule", item, start, end: start + Math.max(5, duration), color: "var(--color-accent)" });
    }
    for (const item of reservations) {
      const time = item.departureTime || item.time;
      if (!time || isStay(item.type) || !usesScheduleDuration(item.type)) continue;
      const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(time);
      const endOffset = item.endDate ? (dayNumber(item.endDate) - dayNumber(item.date)) * 1440 : 0;
      const duration = item.arrivalTime ? (endOffset > 0 ? endOffset + timeMinutes(item.arrivalTime) - timeMinutes(time) : durationBetween(time, item.arrivalTime)) : 60;
      clip({ kind: "reservation", item, start, end: start + Math.max(5, duration), color: "#7CB5D9" });
    }
  return entries;
}

export function TripScheduleCalendar({ dates, schedule, reservations, ko, onAdd, onReservationClick, onScheduleClick }: {
  dates: string[];
  schedule: ScheduleItem[];
  reservations: Reservation[];
  ko: boolean;
  onAdd: (date: string, time: string) => void;
  onReservationClick: (reservation: Reservation) => void;
  onScheduleClick: (schedule: ScheduleItem) => void;
}) {
  const dateEvents = new Map(dates.map((date) => [date, eventsForDate(date, schedule, reservations)]));
  const sharedTimeline = compactTimeline([...dateEvents.values()].flat());
  const compactRows = Math.max(0, ...dates.map((date) =>
    reservations.filter((item) => isStay(item.type) ? item.date <= date && date <= (item.endDate || item.date) : item.date === date && ((!item.time && !item.departureTime) || !usesScheduleDuration(item.type))).length +
    schedule.filter((item) => item.date === date && (!item.time || !usesScheduleDuration(item.type))).length
  ));
  return <div className="mt-6 grid gap-3 md:grid-cols-3">{dates.map((date) => {
    const dayStays = reservations.filter((item) => isStay(item.type) && item.date <= date && date <= (item.endDate || item.date));
    const untimedSchedule = schedule.filter((item) => item.date === date && (!item.time || !usesScheduleDuration(item.type)));
    const untimedReservations = reservations.filter((item) => item.date === date && !isStay(item.type) && ((!item.time && !item.departureTime) || !usesScheduleDuration(item.type)));
    const entries = dateEvents.get(date) || [];
    const events = layoutIntervals(entries);
    const timeline = sharedTimeline;
    const firstMinute = timeline.segments[0].start;
    const lastMinute = timeline.segments[timeline.segments.length - 1].end;
    const visibleSlots = Array.from({ length: (lastMinute - firstMinute) / 120 }, (_, index) => firstMinute + index * 120);
    return <section key={date} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"><p className="text-sm font-bold text-[var(--color-primary)]">{formatDate(date)} · {new Date(date + "T00:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}</p><p className="mt-1 text-xs muted">{events.length + untimedSchedule.length + untimedReservations.length}{ko ? "개 일정·예약 · 5분 단위" : " plans & bookings · 5-minute intervals"}</p></header>
      <div style={{ height: compactRows * 32 }}>
      {dayStays.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-xs font-bold">⌂ {item.title}</button>)}
      {untimedReservations.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} title={[item.title, item.memo].filter(Boolean).join("\n")} className="flex h-8 w-full items-center gap-2 border-b border-[var(--color-border)] px-3 text-left text-xs"><span className="shrink-0 muted">{item.departureTime || item.time || (ko ? "시간 미정" : "No time")}</span><span className="min-w-0 truncate font-bold">{item.title}</span></button>)}
      {untimedSchedule.map((item) => <button key={item.id} type="button" onClick={() => onScheduleClick(item)} title={[item.title, item.note].filter(Boolean).join("\n")} className={`flex h-8 w-full items-center gap-2 border-b border-[var(--color-border)] px-3 text-left text-xs ${item.completed ? "opacity-60" : ""}`}><span className="shrink-0 muted">{item.time || (ko ? "시간 미정" : "No time")}</span><span className={`min-w-0 truncate font-bold ${item.completed ? "line-through" : ""}`}>{item.title}</span></button>)}
      </div>
      <div className="max-h-[640px] overflow-y-auto" aria-label={ko ? "여행 일정 시간표" : "Trip timeline"}>
        <div className="relative" style={{ height: timeline.height }}>
          {visibleSlots.map((minute, index) => {
            const time = displayTime(minute);
            return <button key={minute} type="button" onClick={() => onAdd(date, time)} aria-label={ko ? `${date} ${time} 일정 추가` : `Add plan at ${date} ${time}`} className="absolute left-0 flex w-full gap-3 border-t border-[var(--color-border)] px-3 py-3 text-left transition hover:bg-[var(--color-surface-muted)]" style={{ top: timeline.position(minute), height: timeline.position(minute + 120) - timeline.position(minute) }}><span className="w-11 shrink-0 pt-0.5 text-[11px] font-bold text-[var(--color-text-muted)]">{time}{index < visibleSlots.length - 1 && <span className="mt-1 block text-[9px] font-normal opacity-60">{displayTime(minute + 120)}</span>}</span>{!events.some((event) => event.start < minute + 120 && event.end > minute) && <span className="block text-[10px] text-[var(--color-border)]">＋</span>}</button>;
          })}
          <div className="pointer-events-none absolute inset-y-0 left-[68px] right-3">{events.map((event) => {
            const startTime = event.kind === "schedule" ? event.item.time : event.item.departureTime || event.item.time || "";
            const endTime = event.kind === "schedule" ? event.item.endTime || timingFromDuration(event.item.time, String(event.item.durationMinutes || 60)).endTime : event.item.arrivalTime || "";
            const note = event.kind === "schedule" ? event.item.note : event.item.memo;
            const label = `${startTime}${endTime ? "–" + endTime : ""} · ${event.item.title}${note ? "\\n" + note : ""}`;
            return <button key={event.kind + event.item.id} type="button" onClick={() => event.kind === "schedule" ? onScheduleClick(event.item) : onReservationClick(event.item)} title={label} aria-label={label} className={`pointer-events-auto absolute flex flex-col items-stretch justify-start overflow-y-auto rounded-lg border bg-[var(--color-surface)] px-2 py-1.5 text-left text-xs leading-snug transition hover:shadow-sm ${event.kind === "schedule" ? "border-dashed" : ""} ${event.kind === "schedule" && event.item.completed ? "opacity-60" : ""}`} style={{ top: timeline.position(event.start), height: timeline.position(event.end) - timeline.position(event.start), left: `${event.lane * 100 / event.columns}%`, width: `calc(${100 / event.columns}% - 2px)`, borderColor: event.color }}><span className="block whitespace-pre-wrap break-words font-bold">{event.item.title}</span>{true && <span className="mt-0.5 block truncate text-[10px] muted">{startTime}{endTime ? "–" + endTime : ""}</span>}{note && <span className="mt-1 block whitespace-pre-wrap break-words text-[10px] muted">{note}</span>}</button>;
          })}</div>
        </div>
      </div>
    </section>;
  })}</div>;
}

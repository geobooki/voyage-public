"use client";

import { useEffect, useRef } from "react";
import type { Reservation, ScheduleItem } from "@/types/trip";
import { formatDate } from "@/lib/date";
import { scheduleTimes, timeMinutes, durationBetween, timingFromDuration, layoutIntervals } from "@/lib/schedule-time";

const pixelsPerMinute = 2;
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
  const container = useRef<HTMLDivElement>(null);
  const datesKey = dates.join(",");
  useEffect(() => {
    container.current?.querySelectorAll<HTMLElement>("[data-timeline]").forEach((element) => {
      element.scrollTop = 8 * 60 * pixelsPerMinute;
    });
  }, [datesKey]);
  return <div ref={container} className="mt-6 grid gap-3 md:grid-cols-3">{dates.map((date) => {
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
    return <section key={date} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"><p className="text-sm font-bold text-[var(--color-primary)]">{formatDate(date)} · {new Date(date + "T00:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}</p><p className="mt-1 text-xs muted">{events.length + untimedSchedule.length + untimedReservations.length}{ko ? "개 일정·예약 · 5분 단위" : " plans & bookings · 5-minute intervals"}</p></header>
      {dayStays.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block w-full border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-bold">⌂ {item.title}</button>)}
      {untimedReservations.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block w-full border-b border-[var(--color-border)] px-3 py-2 text-left text-xs">{ko ? "시간 미정" : "No time"} · {item.title}</button>)}
      {untimedSchedule.map((item) => <button key={item.id} type="button" onClick={() => onScheduleClick(item)} className="block w-full border-b border-[var(--color-border)] px-3 py-2 text-left text-xs">{ko ? "시간 미정" : "No time"} · {item.title}</button>)}
      <div data-timeline className="max-h-[640px] overflow-y-auto" aria-label={ko ? "5분 단위 일정 시간표" : "Five-minute timeline"}>
        <div className="relative" style={{ height: 1440 * pixelsPerMinute }}>
          {scheduleTimes.map((time, index) => <button key={time} type="button" onClick={() => onAdd(date, time)} aria-label={ko ? `${date} ${time} 일정 추가` : `Add plan at ${date} ${time}`} className={`absolute left-0 w-full border-t text-left hover:bg-[var(--color-surface-muted)] ${index % 12 === 0 ? "border-[var(--color-border)]" : "border-[var(--color-border)]/25"}`} style={{ top: index * 5 * pixelsPerMinute, height: 5 * pixelsPerMinute }}><span className="absolute left-1 top-0 text-[9px] leading-none text-[var(--color-text-muted)]">{index % 6 === 0 ? time : ""}</span></button>)}
          <div className="pointer-events-none absolute inset-y-0 left-12 right-1">{events.map((event) => {
            const startTime = event.kind === "schedule" ? event.item.time : event.item.departureTime || event.item.time || "";
            const endTime = event.kind === "schedule" ? event.item.endTime || (event.item.durationMinutes ? timingFromDuration(event.item.time, String(event.item.durationMinutes)).endTime : (ko ? "소요시간 미정" : "duration not set")) : event.item.arrivalTime || "";
            const label = `${startTime}${endTime ? "–" + endTime : ""} · ${event.item.title}`;
            return <button key={event.kind + event.item.id} type="button" onClick={() => event.kind === "schedule" ? onScheduleClick(event.item) : onReservationClick(event.item)} title={label} aria-label={label} className={`pointer-events-auto absolute overflow-hidden rounded border bg-[var(--color-surface)] px-1 text-left text-[10px] leading-tight ${event.kind === "schedule" && event.item.completed ? "opacity-60" : ""}`} style={{ top: event.start * pixelsPerMinute, height: (event.end - event.start) * pixelsPerMinute, left: `${event.lane * 100 / event.columns}%`, width: `calc(${100 / event.columns}% - 2px)`, borderColor: event.color, borderLeftWidth: 3 }}><span className="block truncate font-bold">{event.item.title}</span>{event.end - event.start >= 15 && <span className="block truncate muted">{startTime}{endTime ? "–" + endTime : ""}</span>}</button>;
          })}</div>
        </div>
      </div>
    </section>;
  })}</div>;
}

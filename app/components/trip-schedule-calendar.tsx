"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Reservation, ScheduleItem } from "@/types/trip";
import { formatDate } from "@/lib/date";
import { timeMinutes, durationBetween, timingFromDuration, layoutIntervals, usesScheduleDuration } from "@/lib/schedule-time";

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
  const minuteAt = (y: number) => {
    const bounded = Math.max(0, Math.min(height, y));
    const segment = segments.find((segment) => bounded >= segment.top && bounded < segment.top + segment.height);
    return segment ? segment.start + (bounded - segment.top) / segment.height * (segment.end - segment.start) : end;
  };
  return { segments, height, position, minuteAt };
}

const displayTime = (minutes: number) => {
  const bounded = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(bounded / 60)).padStart(2, "0")}:${String(bounded % 60).padStart(2, "0")}`;
};
const isStay = (type: string) => ["stay", "숙박", "hotel", "호텔", "accommodation"].includes(type.trim().toLowerCase());
const dayNumber = (date: string) => Date.parse(date + "T00:00:00Z") / 86400000;
const shiftDate = (date: string, offset: number) => new Date((dayNumber(date) + offset) * 86400000).toISOString().slice(0, 10);
type CalendarEvent = ({ kind: "schedule"; item: ScheduleItem } | { kind: "reservation"; item: Reservation }) & { start: number; end: number; compact: boolean; color: string };
type Preview = { date: string; time: string; duration?: number };
type Gesture = { event: CalendarEvent; mode: "move" | "resize"; date: string; pointerId: number; x: number; y: number; offset: number; initialMinute: number; duration: number; timeline: ReturnType<typeof compactTimeline>; preview?: Preview };

function schedulePatch(preview: Preview): Partial<ScheduleItem> {
  return { date: preview.date, time: preview.time, ...(preview.duration ? { durationMinutes: preview.duration, endTime: timingFromDuration(preview.time, String(preview.duration)).endTime } : {}) };
}
function reservationDuration(item: Reservation) {
  const start = item.departureTime || item.time || "09:00";
  const days = item.endDate ? Math.max(0, dayNumber(item.endDate) - dayNumber(item.date)) : 0;
  return item.arrivalTime ? (days ? days * 1440 + timeMinutes(item.arrivalTime) - timeMinutes(start) : durationBetween(start, item.arrivalTime)) : 60;
}
function reservationPatch(item: Reservation, preview: Preview): Partial<Reservation> {
  const days = item.endDate ? dayNumber(item.endDate) - dayNumber(item.date) : 0;
  const durationDays = preview.duration ? Math.floor((timeMinutes(preview.time) + preview.duration) / 1440) : days;
  return {
    date: preview.date, time: preview.time,
    ...(item.departureTime ? { departureTime: preview.time } : {}),
    ...(item.endDate || durationDays ? { endDate: shiftDate(preview.date, durationDays) } : {}),
    ...(preview.duration ? { arrivalTime: timingFromDuration(preview.time, String(preview.duration)).endTime } : {}),
  };
}
function eventsForDate(date: string, schedule: ScheduleItem[], reservations: Reservation[]) {
  const entries: CalendarEvent[] = [];
  const clip = (entry: CalendarEvent) => {
    if (Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > 0 && entry.start < 1440)
      entries.push({ ...entry, start: Math.max(0, entry.start), end: Math.min(1440, entry.end) });
  };
  for (const item of schedule) {
    if (!item.time || isStay(item.type)) continue;
    const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(item.time);
    const compact = !usesScheduleDuration(item.type) && !item.durationMinutes && !item.endTime;
    const duration = compact ? 15 : item.endTime ? durationBetween(item.time, item.endTime) : item.durationMinutes || 60;
    clip({ kind: "schedule", item, start, end: start + Math.max(5, duration), compact, color: "var(--color-accent)" });
  }
  for (const item of reservations) {
    const time = item.departureTime || item.time;
    if (!time || isStay(item.type)) continue;
    const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(time);
    const compact = !usesScheduleDuration(item.type) && !item.arrivalTime;
    clip({ kind: "reservation", item, start, end: start + (compact ? 15 : Math.max(5, reservationDuration(item))), compact, color: "#BAE6FD" });
  }
  return entries;
}

export function TripScheduleCalendar({ dates, schedule, reservations, ko, onAdd, onReservationClick, onScheduleClick, onScheduleChange, onReservationChange }: {
  dates: string[];
  schedule: ScheduleItem[];
  reservations: Reservation[];
  ko: boolean;
  onAdd: (date: string, time: string) => void;
  onReservationClick: (reservation: Reservation) => void;
  onScheduleClick: (schedule: ScheduleItem) => void;
  onScheduleChange: (item: ScheduleItem, changes: Partial<ScheduleItem>) => void;
  onReservationChange: (item: Reservation, changes: Partial<Reservation>) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const [preview, setPreview] = useState<{ kind: CalendarEvent["kind"]; id: string; value: Preview }>();
  const [notice, setNotice] = useState("");
  const activeSchedule = preview?.kind === "schedule" ? schedule.map((item) => item.id === preview.id ? { ...item, ...schedulePatch(preview.value) } : item) : schedule;
  const activeReservations = preview?.kind === "reservation" ? reservations.map((item) => item.id === preview.id ? { ...item, ...reservationPatch(item, preview.value) } : item) : reservations;
  const dateEvents = new Map(dates.map((date) => [date, eventsForDate(date, activeSchedule, activeReservations)]));
  const computedTimeline = compactTimeline([...dateEvents.values()].flat());
  const timeline = gesture.current?.timeline || computedTimeline;
  const compactRows = Math.max(0, ...dates.map((date) =>
    activeReservations.filter((item) => isStay(item.type) ? item.date <= date && date <= (item.endDate || item.date) : item.date === date && !item.time && !item.departureTime).length +
    activeSchedule.filter((item) => item.date === date && (!item.time || isStay(item.type))).length
  ));
  const finish = (cancel = false) => {
    const current = gesture.current;
    gesture.current = null;
    setPreview(undefined);
    if (!current) return;
    if (root.current?.hasPointerCapture(current.pointerId)) root.current.releasePointerCapture(current.pointerId);
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    if (!cancel && !current.preview) {
      if (current.event.kind === "schedule") onScheduleClick(current.event.item);
      else onReservationClick(current.event.item);
    }
    if (!cancel && current.preview) {
      if (current.event.kind === "schedule") onScheduleChange(current.event.item, schedulePatch(current.preview));
      else onReservationChange(current.event.item, reservationPatch(current.event.item, current.preview));
      setNotice(ko ? "일정 시간을 저장했어요." : "Schedule time saved.");
    }
  };
  const begin = (event: ReactPointerEvent, item: CalendarEvent, date: string, mode: Gesture["mode"]) => {
    if (event.button !== 0) return;
    const canvas = event.currentTarget.closest("[data-calendar-canvas]") as HTMLElement | null;
    if (!canvas) return;
    const minute = timeline.minuteAt(event.clientY - canvas.getBoundingClientRect().top);
    const duration = item.kind === "schedule" ? item.compact ? 15 : item.item.endTime ? durationBetween(item.item.time, item.item.endTime) : item.item.durationMinutes || 60 : item.compact ? 15 : reservationDuration(item.item);
    gesture.current = { event: item, mode, date, pointerId: event.pointerId, x: event.clientX, y: event.clientY, offset: minute - item.start, initialMinute: minute, duration, timeline };
    root.current?.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.preview && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5) return;
    event.preventDefault();
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const column = (current.mode === "resize" ? root.current?.querySelector(`[data-calendar-date="${current.date}"]`) : hit?.closest("[data-calendar-date]")) as HTMLElement | null;
    if (!column || !root.current?.contains(column)) return;
    const canvas = column.querySelector<HTMLElement>("[data-calendar-canvas]");
    const scroller = column.querySelector<HTMLElement>("[data-calendar-scroll]");
    if (!canvas || !scroller) return;
    const box = scroller.getBoundingClientRect();
    if (event.clientY < box.top + 28) scroller.scrollTop -= 12;
    else if (event.clientY > box.bottom - 28) scroller.scrollTop += 12;
    const minute = current.timeline.minuteAt(event.clientY - canvas.getBoundingClientRect().top);
    const originalTime = current.event.kind === "schedule" ? current.event.item.time : current.event.item.departureTime || current.event.item.time || "09:00";
    const value: Preview = current.mode === "move"
      ? { date: column.dataset.calendarDate || current.date, time: displayTime(Math.max(0, Math.min(1425, Math.round((minute - current.offset) / 15) * 15))), ...(!current.event.compact ? { duration: current.duration } : {}) }
      : { date: current.event.item.date, time: originalTime.slice(0, 5), duration: Math.max(15, Math.min(1440, Math.round((current.duration + minute - current.initialMinute) / 15) * 15)) };
    current.preview = value;
    setPreview({ kind: current.event.kind, id: current.event.item.id, value });
  };
  return <div ref={root} className="mt-6" style={{ fontFamily: "var(--font-family-base)" }} onPointerMove={move} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onKeyDown={(event) => { if (event.key === "Escape" && gesture.current) { event.preventDefault(); finish(true); } }} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); } }}>
    <p className="mb-3 text-[11px] muted">{ko ? "카드를 끌어 시간을 옮기고, 아래 손잡이를 늘려 소요시간을 조절해요." : "Drag cards to move them; drag the bottom handle to change duration."}</p>
    <p className="sr-only" aria-live="polite">{notice}</p>
    <div className="grid gap-3 md:grid-cols-3">{dates.map((date) => {
      const dayStays = activeReservations.filter((item) => isStay(item.type) && item.date <= date && date <= (item.endDate || item.date));
      const untimedSchedule = activeSchedule.filter((item) => item.date === date && (!item.time || isStay(item.type)));
      const untimedReservations = activeReservations.filter((item) => item.date === date && !isStay(item.type) && !item.time && !item.departureTime);
      const events = layoutIntervals(dateEvents.get(date) || []);
      const first = timeline.segments[0].start;
      const last = timeline.segments[timeline.segments.length - 1].end;
      const slots = Array.from({ length: (last - first) / 120 }, (_, index) => first + index * 120);
      return <section key={date} data-calendar-date={date} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"><p className="text-xs font-normal text-[var(--color-primary)]">{formatDate(date)} · {new Date(date + "T00:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}</p><p className="mt-1 text-[11px] muted">{events.length + untimedSchedule.length + untimedReservations.length}{ko ? "개 일정·예약" : " plans & bookings"}</p></header>
        <div style={{ height: compactRows * 32 }}>
          {dayStays.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px] font-normal">⌂ {item.title}</button>)}
          {untimedReservations.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px]">{item.title}</button>)}
          {untimedSchedule.map((item) => <button key={item.id} type="button" onClick={() => onScheduleClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px]">{item.title}</button>)}
        </div>
        <div data-calendar-scroll className="max-h-[640px] overflow-y-auto" aria-label={ko ? "여행 일정 시간표" : "Trip timeline"}>
          <div data-calendar-canvas className="relative" style={{ height: timeline.height }}>
            {slots.map((minute, index) => <button key={minute} type="button" onClick={() => onAdd(date, displayTime(minute))} aria-label={ko ? `${date} ${displayTime(minute)} 일정 추가` : `Add plan at ${date} ${displayTime(minute)}`} className="absolute left-0 flex w-full gap-3 border-t border-[var(--color-border)] px-3 py-3 text-left transition hover:bg-[var(--color-surface-muted)]" style={{ top: timeline.position(minute), height: timeline.position(minute + 120) - timeline.position(minute) }}><span className="w-11 shrink-0 pt-0.5 text-[11px] font-normal text-[var(--color-text-muted)]">{displayTime(minute)}{index < slots.length - 1 && <span className="mt-1 block text-[9px] font-normal opacity-60">{displayTime(minute + 120)}</span>}</span>{!events.some((item) => item.start < minute + 120 && item.end > minute) && <span className="block text-[10px] text-[var(--color-border)]">＋</span>}</button>)}
            <div className="pointer-events-none absolute inset-y-0 left-[68px] right-3">{events.map((item) => {
              const startTime = (item.kind === "schedule" ? item.item.time : item.item.departureTime || item.item.time || "").slice(0, 5);
              const endTime = (item.kind === "schedule" ? item.item.endTime || timingFromDuration(item.item.time, String(item.item.durationMinutes || 60)).endTime : item.item.arrivalTime || timingFromDuration(startTime, "60").endTime).slice(0, 5);
              const note = item.kind === "schedule" ? item.item.note : item.item.memo;
              const label = `${startTime}${!item.compact && endTime ? "–" + endTime : ""} · ${item.item.title}${note ? "\n" + note : ""}`;
              const isPreview = preview?.id === item.item.id && preview.kind === item.kind;
              const open = () => item.kind === "schedule" ? onScheduleClick(item.item) : onReservationClick(item.item);
              return <div key={item.kind + item.item.id} role="button" tabIndex={0} onPointerDown={(event) => begin(event, item, date, "move")} onClick={open} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } }} title={label} aria-label={label} className={`pointer-events-auto absolute select-none touch-none overflow-hidden rounded-lg border bg-white text-left text-[11px] transition-shadow ${isPreview ? "z-20 shadow-lg ring-2 ring-[var(--color-primary)]/25" : "hover:shadow-sm"} ${item.kind === "schedule" && !item.compact ? "border-dashed" : ""} ${item.kind === "schedule" && item.item.completed ? "opacity-60" : ""}`} style={{ top: timeline.position(item.start), height: item.compact ? 32 : Math.max(32, timeline.position(item.end) - timeline.position(item.start)), left: `${item.lane * 100 / item.columns}%`, width: `calc(${100 / item.columns}% - 3px)`, borderColor: item.compact ? "var(--color-border)" : item.color, cursor: gesture.current ? "grabbing" : "grab" }}>
                {item.compact ? <div className="flex h-full items-center gap-2 px-2 pb-1"><span className="shrink-0 text-[10px] muted">{startTime}</span><span className="min-w-0 truncate text-[11px] font-normal">{item.item.title}</span></div> : <div className="h-full overflow-y-auto px-2 pb-3 pt-1.5"><p className="whitespace-pre-wrap break-words text-[11px] font-normal">{item.item.title}</p><p className="mt-0.5 text-[10px] muted">{startTime}–{endTime}</p>{note && <p className="mt-1 whitespace-pre-wrap break-words text-[10px] muted">{note}</p>}</div>}
                <button type="button" aria-label={ko ? "소요시간 조절" : "Resize duration"} title={ko ? "아래로 끌어 소요시간 조절" : "Drag to change duration"} onClick={(event) => { event.stopPropagation(); if (!suppressClick.current) open(); }} onPointerDown={(event) => begin(event, item, date, "resize")} className="absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize touch-none items-center justify-center hover:bg-[var(--color-surface-muted)]"><span className="h-0.5 w-6 rounded-full bg-[var(--color-border)]" /></button>
              </div>;
            })}</div>
          </div>
        </div>
      </section>;
    })}</div>
  </div>;
}

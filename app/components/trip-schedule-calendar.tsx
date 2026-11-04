"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Reservation, ScheduleItem } from "@/types/trip";
import { formatDate } from "@/lib/date";
import { timeMinutes, durationBetween, timingFromDuration, layoutIntervals, usesScheduleDuration } from "@/lib/schedule-time";

function compactTimeline(_events: { start: number; end: number }[]) {
  const start = 480;
  const end = 1320;
  let height = 0;
  const segments = Array.from({ length: (end - start) / 120 }, (_, index) => {
    const minute = start + index * 120;
    const size = 64;
    const segment = { start: minute, end: minute + 120, top: height, height: size };
    height += size;
    return segment;
  });
  const position = (minute: number) => {
    const segment = segments.find((segment) => minute >= segment.start && minute < segment.end);
    return segment ? segment.top + (minute - segment.start) / 120 * segment.height : minute < start ? 0 : height;
  };
  const minuteAt = (y: number) => {
    const bounded = Math.max(0, Math.min(height, y));
    const segment = segments.find((segment) => bounded >= segment.top && bounded < segment.top + segment.height);
    return segment ? segment.start + (bounded - segment.top) / segment.height * 120 : end;
  };
  return { segments, height, position, minuteAt };
}

const displayTime = (minutes: number) => {
  const bounded = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(bounded / 60)).padStart(2, "0")}:${String(bounded % 60).padStart(2, "0")}`;
};
const isMeal = (type: string) => ["식사", "식당", "아침", "점심", "저녁", "restaurant", "meal", "breakfast", "lunch", "dinner", "brunch"].some((name) => type.trim().toLowerCase().includes(name));
const isTransport = (type: string) => ["교통", "항공", "기차", "버스", "택시", "도보", "transport", "flight", "train", "bus", "taxi", "ferry", "car rental"].some((name) => type.trim().toLowerCase().includes(name));
const clockTime = (value?: string) => {
  const match = value?.trim().match(/(?:^|T)([0-2]?\d):([0-5]\d)/);
  return match && Number(match[1]) < 24 ? match[1].padStart(2, "0") + ":" + match[2] : "";
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
    const time = clockTime(item.time);
    if (!time || isStay(item.type)) continue;
    const start = (dayNumber(item.date) - dayNumber(date)) * 1440 + timeMinutes(time);
    const compact = !usesScheduleDuration(item.type) && !item.durationMinutes && !item.endTime;
    const duration = compact ? 15 : item.endTime ? durationBetween(item.time, item.endTime) : item.durationMinutes || 60;
    clip({ kind: "schedule", item, start, end: start + Math.max(5, duration), compact, color: "var(--color-accent)" });
  }
  for (const item of reservations) {
    const time = clockTime(item.departureTime) || clockTime(item.time);
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
    activeReservations.filter((item) => isStay(item.type) ? item.date <= date && date <= (item.endDate || item.date) : item.date === date && !clockTime(item.time) && !clockTime(item.departureTime)).length +
    activeSchedule.filter((item) => item.date === date && (!clockTime(item.time) || isStay(item.type))).length +
    (dateEvents.get(date) || []).filter((event) => event.end <= 480 || event.start >= 1320).length
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
    const minute = current.timeline.minuteAt(event.clientY - canvas.getBoundingClientRect().top);
    const originalTime = current.event.kind === "schedule" ? current.event.item.time : current.event.item.departureTime || current.event.item.time || "09:00";
    const value: Preview = current.mode === "move"
      ? { date: column.dataset.calendarDate || current.date, time: displayTime(Math.max(480, Math.min(1305, Math.round((minute - current.offset) / 15) * 15))), ...(!current.event.compact ? { duration: current.duration } : {}) }
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
      const outsideEvents = (dateEvents.get(date) || []).filter((event) => event.end <= 480 || event.start >= 1320);
      const visibleEvents = (dateEvents.get(date) || []).filter((event) => event.start < 1320 && event.end > 480).map((event) => ({ ...event, start: Math.max(480, event.start), end: Math.min(1320, event.end) }));
      const events = layoutIntervals(visibleEvents.map((event) => ({ ...event, actualEnd: event.end, end: Math.max(event.end, event.start + (event.compact ? 45 : 30)) })));
      const first = timeline.segments[0].start;
      const last = timeline.segments[timeline.segments.length - 1].end;
      const slots = Array.from({ length: (last - first) / 120 }, (_, index) => first + index * 120);
      return <section key={date} data-calendar-date={date} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"><p className="text-xs font-normal text-[var(--color-primary)]">{formatDate(date)} · {new Date(date + "T00:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "short" })}</p><p className="mt-1 text-[11px] muted">{events.length + untimedSchedule.length + untimedReservations.length}{ko ? "개 일정·예약" : " plans & bookings"}</p></header>
        <div style={{ height: compactRows * 32 }}>
          {dayStays.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px] font-normal">⌂ {item.title}</button>)}
          {untimedReservations.map((item) => <button key={item.id} type="button" onClick={() => onReservationClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px]">{item.title}</button>)}
          {untimedSchedule.map((item) => <button key={item.id} type="button" onClick={() => onScheduleClick(item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px]">{item.title}</button>)}
          {outsideEvents.map((event) => <button key={event.kind + event.item.id} type="button" onClick={() => event.kind === "schedule" ? onScheduleClick(event.item) : onReservationClick(event.item)} className="block h-8 w-full truncate border-b border-[var(--color-border)] px-3 text-left text-[11px]">{clockTime(event.kind === "schedule" ? event.item.time : event.item.departureTime || event.item.time)} · {event.item.title} <span className="muted">({ko ? "시간표 밖" : "outside timetable"})</span></button>)}
        </div>
        <div data-calendar-scroll className="overflow-visible" aria-label={ko ? "여행 일정 시간표" : "Trip timeline"}>
          <div data-calendar-canvas className="relative" style={{ height: timeline.height + 24 }}>
            {slots.map((minute) => <button key={minute} type="button" onClick={() => onAdd(date, displayTime(minute))} aria-label={ko ? `${date} ${displayTime(minute)} 일정 추가` : `Add plan at ${date} ${displayTime(minute)}`} className="absolute left-0 w-full border-t border-[var(--color-border)] text-left transition hover:bg-[var(--color-surface-muted)]" style={{ top: timeline.position(minute), height: timeline.position(minute + 120) - timeline.position(minute) }}>{[0, 30, 60, 90].map((offset) => <span key={offset} className="pointer-events-none absolute left-3 text-[9px] font-normal leading-none text-[var(--color-text-muted)]" style={{ top: timeline.position(minute + offset) - timeline.position(minute) }}>{displayTime(minute + offset)}</span>)}{!events.some((item) => item.start < minute + 120 && item.end > minute) && <span className="absolute left-[68px] top-3 block text-[10px] text-[var(--color-border)]">＋</span>}</button>)}
            <span className="pointer-events-none absolute left-3 text-[9px] font-normal leading-none text-[var(--color-text-muted)]" style={{ top: timeline.height }}>22:00</span>
            <div className="pointer-events-none absolute inset-y-0 left-[68px] right-3">{events.map((item) => {
              const startTime = clockTime(item.kind === "schedule" ? item.item.time : item.item.departureTime || item.item.time);
              const endTime = (item.kind === "schedule" ? item.item.endTime || timingFromDuration(item.item.time, String(item.item.durationMinutes || 60)).endTime : item.item.arrivalTime || timingFromDuration(startTime, "60").endTime).slice(0, 5);
              const note = item.kind === "schedule" ? item.item.note : item.item.memo;
              const label = `${startTime}${!item.compact && endTime ? "–" + endTime : ""} · ${item.item.title}${note ? "\n" + note : ""}`;
              const isPreview = preview?.id === item.item.id && preview.kind === item.kind;
              const open = () => item.kind === "schedule" ? onScheduleClick(item.item) : onReservationClick(item.item);
              return <div key={item.kind + item.item.id} role="button" tabIndex={0} onPointerDown={(event) => begin(event, item, date, "move")} onClick={open} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } }} title={label} aria-label={label} className={`pointer-events-auto absolute select-none touch-none overflow-hidden rounded-lg border bg-white text-left text-[11px] transition-shadow ${isPreview ? "z-20 shadow-lg ring-2 ring-[var(--color-primary)]/25" : "hover:shadow-sm"} ${item.kind === "schedule" && !item.compact ? "border-dashed" : ""} ${item.kind === "schedule" && item.item.completed ? "opacity-60" : ""}`} style={{ top: timeline.position(item.start), height: item.compact ? 24 : Math.max(16, timeline.position(item.actualEnd) - timeline.position(item.start)), left: `${item.lane * 100 / item.columns}%`, width: `calc(${100 / item.columns}% - 3px)`, borderColor: item.compact ? "var(--color-border)" : item.color, cursor: gesture.current ? "grabbing" : "grab" }}>
                {item.compact ? <div className="flex h-full items-center gap-2 px-2 pb-0.5">{isMeal(item.item.type) && <span className="shrink-0 text-[10px] font-bold text-orange-600">{ko ? "식사" : "Meal"}</span>}<span className="shrink-0 text-[10px] muted">{startTime}</span><span className="min-w-0 truncate text-[11px] font-normal">{item.item.title}</span></div> : <div className="h-full overflow-y-auto px-2 pb-2 pt-0.5">{isTransport(item.item.type) && <p className="mb-0.5 text-[9px] font-normal text-[var(--color-primary)]">{ko ? "교통편" : "Transport"}</p>}<p className="whitespace-pre-wrap break-words text-[11px] font-normal">{isMeal(item.item.type) && <span className="mr-1 font-bold text-orange-600">{ko ? "식사" : "Meal"}</span>}{item.item.title}</p><p className="mt-0.5 text-[10px] muted">{startTime}–{endTime}</p>{note && <p className="mt-1 whitespace-pre-wrap break-words text-[10px] muted">{note}</p>}</div>}
                <button type="button" aria-label={ko ? "소요시간 조절" : "Resize duration"} title={ko ? "아래로 끌어 소요시간 조절" : "Drag to change duration"} onClick={(event) => { event.stopPropagation(); if (!suppressClick.current) open(); }} onPointerDown={(event) => begin(event, item, date, "resize")} className="absolute inset-x-0 bottom-0 flex h-1.5 cursor-ns-resize touch-none items-center justify-center hover:bg-[var(--color-surface-muted)]"><span className="h-0.5 w-6 rounded-full bg-[var(--color-border)]" /></button>
              </div>;
            })}</div>
          </div>
        </div>
      </section>;
    })}</div>
  </div>;
}

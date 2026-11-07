"use client";
import { DateField } from "./date-field";
import { scheduleTimes } from "@/lib/schedule-time";
export function ScheduleDateTimeFields({ date, time, ko, onDateChange, onTimeChange }: { date: string; time: string; ko: boolean; onDateChange: (date: string) => void; onTimeChange: (time: string) => void }) {
  const control = "mt-2 block h-11 min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm font-normal";
  return <div className="schedule-date-time grid grid-cols-2 items-start gap-3"><DateField required label={ko ? "날짜" : "Date"} value={date} onChange={onDateChange}/><label className="min-w-0 text-xs font-bold">{ko ? "시작시간" : "Start time"}<select required aria-label={ko ? "시간 (5분 단위)" : "Time (five-minute intervals)"} value={time} onChange={(event) => onTimeChange(event.target.value)} className={control}>{scheduleTimes.map((option) => <option key={option} value={option}>{option}</option>)}</select></label></div>;
}

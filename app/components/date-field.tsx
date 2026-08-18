"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");
const toIso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parse = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
};

export function DateField({
  value,
  onChange,
  label,
  required,
}: DateFieldProps) {
  const { language } = useLanguage();
  const ko = language === "ko";
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parse(value));
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (value) setMonth(parse(value));
  }, [value]);
  const selected = value ? parse(value) : null;
  const todayIso = toIso(new Date());
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array(first.getDay()).fill(null),
      ...Array.from(
        { length: count },
        (_, index) =>
          new Date(month.getFullYear(), month.getMonth(), index + 1),
      ),
    ];
  }, [month]);
  const display = selected
    ? ko
      ? `${selected.getFullYear()}년 ${selected.getMonth() + 1}월 ${selected.getDate()}일`
      : selected.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
    : ko
      ? "날짜를 선택하세요"
      : "Select a date";
  const monthLabel = ko
    ? `${month.getFullYear()}년 ${month.getMonth() + 1}월`
    : month.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const weekdays = ko
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div ref={root} className="relative">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input type="hidden" required={required} value={value} readOnly />
      <button
        type="button"
        onClick={() => {
          setMonth(selected || new Date());
          setOpen((current) => !current);
        }}
        className={`date-field-trigger ${value ? "date-field-filled" : ""}`}
        aria-expanded={open}
      >
        <span className="text-lg">▣</span>
        <span>{display}</span>
        <span className="ml-auto text-xs muted">⌄</span>
      </button>
      {open && (
        <div className="date-picker-popover">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              className="date-picker-nav"
              aria-label={ko ? "이전 달" : "Previous month"}
            >
              ‹
            </button>
            <p className="font-bold">{monthLabel}</p>
            <button
              type="button"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              className="date-picker-nav"
              aria-label={ko ? "다음 달" : "Next month"}
            >
              ›
            </button>
          </div>
          <div className="date-picker-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="date-picker-days">
            {days.map((day, index) =>
              day ? (
                <button
                  type="button"
                  key={toIso(day)}
                  onClick={() => {
                    onChange(toIso(day));
                    setOpen(false);
                  }}
                  className={`date-picker-day ${toIso(day) === todayIso ? "date-picker-today-highlight" : ""} ${selected && toIso(selected) === toIso(day) ? "date-picker-selected" : ""} ${day.getDay() === 0 ? "date-picker-sunday" : ""}`}
                >
                  {day.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              onChange(toIso(today));
              setMonth(today);
              setOpen(false);
            }}
            className="date-picker-today"
          >
            {ko ? "오늘" : "Today"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const defaults = ["관광", "식사", "간식", "활동", "숙박", "교통"];
const aliases: Record<string, string> = { sightseeing: "관광", tour: "관광", meal: "식사", snack: "간식", dessert: "간식", restaurant: "식사", activity: "활동", activities: "활동", stay: "숙박", hotel: "숙박", accommodation: "숙박", transport: "교통" };
const english: Record<string, string> = { 관광: "Sightseeing", 식사: "Meal", 간식: "Snack", 활동: "Activity", 숙박: "Stay", 교통: "Transport" };
const normalize = (value: string) => aliases[value.trim().toLowerCase()] || value.trim();
const mergeTypes = (values: string[]) => [...new Map(values.map(normalize).filter(Boolean).map((value) => [value.toLocaleLowerCase(), value])).values()];
const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export function ScheduleTypeSelect({ tripId, value, knownTypes, onChange }: { tripId: string; value: string; knownTypes: string[]; onChange: (value: string) => void }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const ko = language === "ko";
  const id = useId();
  const select = useRef<HTMLSelectElement>(null);
  const key = `voyage:schedule-types:${user?.id || "local"}:${tripId}`;
  const [saved, setSaved] = useState<{ key: string; values: string[] }>({ key: "", values: [] });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        const result: unknown = JSON.parse(window.localStorage.getItem(key) || "[]");
        setSaved({ key, values: Array.isArray(result) ? result.filter((entry): entry is string => typeof entry === "string") : [] });
      } catch { setSaved({ key, values: [] }); }
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("voyage:schedule-types", load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("voyage:schedule-types", load); };
  }, [key]);
  const options = mergeTypes([...defaults, ...knownTypes, ...(saved.key === key ? saved.values : []), value]);
  const finish = () => { setAdding(false); setDraft(""); select.current?.focus(); };
  const add = () => {
    const name = normalize(draft).slice(0, 32);
    if (!name) return;
    const existing = options.find((option) => option.toLocaleLowerCase() === name.toLocaleLowerCase());
    const chosen = existing || name;
    const values = mergeTypes([...(saved.key === key ? saved.values : []), chosen]);
    setSaved({ key, values });
    try {
      window.localStorage.setItem(key, JSON.stringify(values));
      window.dispatchEvent(new Event("voyage:schedule-types"));
    } catch { /* Keep the selected type usable when browser storage is unavailable. */ }
    onChange(chosen);
    finish();
  };
  return <div className="text-xs font-bold">
    <label htmlFor={id}>{ko ? "타입" : "Type"}</label>
    <select ref={select} id={id} value={normalize(value)} onChange={(event) => {
      if (event.target.value === "__add_type__") { setAdding(true); setDraft(""); }
      else { onChange(event.target.value); setAdding(false); }
    }} className={`mt-2 ${control}`}>
      {options.map((option) => <option key={option} value={option}>{ko ? option : english[option] || option}</option>)}
      <option value="__add_type__">{ko ? "+ 새 타입 추가" : "+ Add a new type"}</option>
    </select>
    {adding && <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <label htmlFor={id + "-new"} className="text-xs font-bold">{ko ? "새 타입 이름" : "New type name"}</label>
      <input id={id + "-new"} autoFocus maxLength={32} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
        if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); add(); }
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(); }
      }} placeholder={ko ? "예: 쇼핑, 휴식" : "e.g. Shopping, Rest"} className={`mt-2 ${control}`} />
      <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={finish} className="rounded-lg px-3 py-2 text-xs font-bold">{ko ? "취소" : "Cancel"}</button><button type="button" disabled={!draft.trim()} onClick={add} className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{ko ? "타입 추가" : "Add type"}</button></div>
    </div>}
  </div>;
}

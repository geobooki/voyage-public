"use client";

import { useId, useState } from "react";

type Airport = { name: string; country: string; code: string };

// A small, curated airport directory keeps the form fast and searchable.
// The list can later be replaced by a server-backed directory without changing the field API.
const airports: Airport[] = [
  { name: "인천", country: "한국", code: "ICN" },
  { name: "김포", country: "한국", code: "GMP" },
  { name: "제주", country: "한국", code: "CJU" },
  { name: "다낭", country: "베트남", code: "DAD" },
  { name: "하노이 노이바이", country: "베트남", code: "HAN" },
  { name: "호치민 떤선녓", country: "베트남", code: "SGN" },
  { name: "도쿄 나리타", country: "일본", code: "NRT" },
  { name: "도쿄 하네다", country: "일본", code: "HND" },
  { name: "오사카 간사이", country: "일본", code: "KIX" },
  { name: "싱가포르 창이", country: "싱가포르", code: "SIN" },
  { name: "타이베이 타오위안", country: "대만", code: "TPE" },
  { name: "홍콩", country: "홍콩", code: "HKG" },
  { name: "방콕 수완나품", country: "태국", code: "BKK" },
  { name: "런던 히드로", country: "영국", code: "LHR" },
  { name: "파리 샤를 드골", country: "프랑스", code: "CDG" },
  { name: "로스앤젤레스", country: "미국", code: "LAX" },
  { name: "뉴욕 JFK", country: "미국", code: "JFK" },
  { name: "시드니", country: "호주", code: "SYD" },
].sort((a, b) => a.country.localeCompare(b.country, "ko") || a.name.localeCompare(b.name, "ko"));

export const airportLabel = (airport: Airport) => `${airport.name}(${airport.country}) · ${airport.code}`;

export function AirportSelect({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const query = value.trim().toLocaleLowerCase("ko");
  const matches = airports.filter((airport) =>
    [airport.name, airport.country, airport.code, airportLabel(airport)]
      .some((part) => part.toLocaleLowerCase("ko").includes(query)),
  ).slice(0, 8);

  return (
    <label className="relative text-xs font-bold">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 150)}
        placeholder="공항명, 국가 또는 IATA 코드 검색"
        className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
        role="combobox"
        aria-expanded={focused}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {focused && matches.length > 0 && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg">
          {matches.map((airport) => (
            <button
              type="button"
              role="option"
              aria-selected={value === airportLabel(airport)}
              key={airport.code}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(airportLabel(airport));
                setFocused(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]"
            >
              <span className="font-semibold">{airport.name}({airport.country})</span>
              <span className="text-xs muted">{airport.code}</span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

"use client";
import { useEffect, useState } from "react";
import { destinationCountries, destinationCountryCode, popularDestinationCities, destinationCityQuery } from "@/lib/destinations";

type Props = { country: string; city: string; onChange: (value: { country: string; city: string }) => void; domestic?: boolean; required?: boolean };
const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--color-primary)] disabled:opacity-50";
export function DestinationSelect({ country, city, onChange, domestic, required = false }: Props) {
  const code = destinationCountryCode(country);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<{ key: string; cities: string[]; error?: string }>({ key: "", cities: [] });
  const key = [code, search.trim()].join("|");
  useEffect(() => {
    if (!code || search.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ name: destinationCityQuery(search.trim(), country), countryCode: code, language: "ko", count: "50" });
        const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + query, { signal: controller.signal });
        if (!response.ok) throw new Error("lookup");
        const data = await response.json() as { results?: { name: string; admin1?: string; country_code?: string; feature_code?: string }[] };
        const cities = [...new Set((data.results || []).filter((place) => place.country_code === code && /^(PPL|ADM|ISL)/.test(place.feature_code || "")).map((place) => place.admin1 && place.name !== place.admin1 ? place.name + ", " + place.admin1 : place.name))];
        setResult({ key, cities });
      } catch { if (!controller.signal.aborted) setResult({ key, cities: [], error: "도시 검색을 불러오지 못했어요. 다시 검색해 주세요." }); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [code, search, key]);
  const base = popularDestinationCities(country);
  const filtered = search.trim() ? base.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase())) : base;
  const options = [...new Set([...(city ? [city] : []), ...filtered, ...(result.key === key ? result.cities : [])])];
  const knownCountry = destinationCountries.some((item) => item.name === country);
  return <div className="grid gap-5 sm:grid-cols-2">
    <label className="block text-sm font-bold">국가<select required={required} aria-label="국가" value={country} onChange={(event) => { setSearch(""); onChange({ country: event.target.value, city: "" }); }} className={`mt-2 ${control}`}>
      <option value="">국가 선택</option>
      {country && !knownCountry && <option value={country}>{country}</option>}
      {destinationCountries.filter((item) => !domestic || item.code === "KR").map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
    </select></label>
    <div><label className="block text-sm font-bold">도시<select required={required} aria-label="도시" value={city} disabled={!country} onChange={(event) => onChange({ country, city: event.target.value })} className={`mt-2 ${control}`}>
      <option value="">{country ? "도시 선택" : "국가를 먼저 선택하세요"}</option>
      {options.map((name) => <option key={name} value={name}>{name}</option>)}
    </select></label>
    <input aria-label="다른 도시 검색" value={search} disabled={!code} onChange={(event) => setSearch(event.target.value)} placeholder="목록에 없으면 도시 검색 (2글자 이상)" className={`mt-2 ${control}`}/>
    {search.trim().length >= 2 && <p role="status" className="mt-1 text-xs muted">{result.key !== key ? "도시 검색 중…" : result.error || (result.cities.length ? "검색한 도시를 위 목록에서 선택하세요." : "검색 결과가 없어요. 영문 도시명으로도 검색해 보세요.")}</p>}
    </div>
  </div>;
}

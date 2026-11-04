import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import destinationLocations from "@/lib/destination-locations.json";
import { destinationCountryCode, destinationCityQuery } from "@/lib/destinations";
import { isWeatherStay, stayForWeatherDate, stayCoordinate, type WeatherStay } from "@/lib/weather-destination";

type DailyForecast = { time?: string[]; temperature_2m_max?: (number | null)[]; weather_code?: (number | null)[] };
type Location = { latitude: number; longitude: number; country?: string; country_code?: string; timezone?: string; feature_code?: string };
export const maxDuration = 40;
type Context = { params: Promise<{ tripId: string }> };
const weatherLabel = (code: number): [string, string] => {
  if (code === 0) return ["맑음", "☀️"];
  if (code <= 2) return ["구름 조금", "🌤️"];
  if (code === 3) return ["흐림", "☁️"];
  if (code === 45 || code === 48) return ["안개", "🌫️"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["눈", "❄️"];
  if (code >= 95) return ["뇌우", "⛈️"];
  if ([80, 81, 82].includes(code)) return ["소나기", "🌦️"];
  return ["비", "🌧️"];
};
const dateInZone = (date: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const shiftDate = (date: string, days: number) => {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;

async function cityDestination(city: string, country: string): Promise<Location | undefined> {
  if (!city && !country) return undefined;
  const known: Record<string, Location> = destinationLocations;
  const point = known[(destinationCountryCode(country) || "") + ":" + city];
  if (point) return point;
  try {
    const code = destinationCountryCode(country);
    const query = new URLSearchParams({ name: destinationCityQuery(city || country, country), count: "10", language: "ko", format: "json" });
    if (code) query.set("countryCode", code);
    const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + query, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return undefined;
    const data = await response.json() as { results?: Location[] };
    return data.results?.find((place) => (!code || place.country_code === code) && /^(PPL|ADM|ISL)/.test(place.feature_code || "") && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
  } catch { return undefined; }
}
type Destination = Location & { label: string; kind: "stay" | "city" };
type PhotonFeature = { geometry?: { coordinates?: number[] }; properties?: { countrycode?: string } };

async function stayDestination(stay: WeatherStay, city: string, country: string, fallback?: Location): Promise<Destination | undefined> {
  const coordinate = stayCoordinate(stay.location || "");
  if (coordinate) return { ...coordinate, timezone: fallback?.timezone, label: stay.title, kind: "stay" };
  const queries = [...new Set([
    stay.location?.trim(),
    [stay.title.trim(), city, country].filter(Boolean).join(", "),
  ].filter((query): query is string => Boolean(query)))].slice(0, 2);
  for (const text of queries) {
    try {
      const query = new URLSearchParams({ q: text.slice(0, 300), limit: "3", lang: "en" });
      if (fallback) {
        query.set("lat", String(fallback.latitude)); query.set("lon", String(fallback.longitude));
        if (fallback.country_code) query.set("countrycode", fallback.country_code);
      }
      const base = process.env.WEATHER_GEOCODER_URL || "https://photon.komoot.io/api/";
      const response = await fetch(base + (base.includes("?") ? "&" : "?") + query, { headers: { "User-Agent": "Voyage/1.0 (https://github.com/geobooki/voyage-public)" }, next: { revalidate: 604800 }, signal: AbortSignal.timeout(4000) });
      if (!response.ok) continue;
      const data = await response.json() as { features?: PhotonFeature[] };
      const place = data.features?.find((item) => {
        const point = item.geometry?.coordinates;
        return point && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90 && (!fallback?.country_code || item.properties?.countrycode?.toUpperCase() === fallback.country_code.toUpperCase());
      });
      if (place?.geometry?.coordinates) return { longitude: place.geometry.coordinates[0], latitude: place.geometry.coordinates[1], timezone: fallback?.timezone, label: stay.title, kind: "stay" };
    } catch { /* Try the next address candidate when one lookup fails. */ }
  }
  return undefined;
}

async function loadWeather(request: Request, context: Context, save: boolean) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await context.params).tripId, client);
  const [{ data: trip, error: tripError }, { data: reservations }] = await Promise.all([
    client.from("trips").select("city,country,start_date,end_date").eq("id", tripId).single(),
    client.from("reservations").select("id,type,title,location,date,end_date").eq("trip_id", tripId).order("date").limit(100),
  ]);
  if (tripError || !trip) return NextResponse.json({ error: "여행 정보를 찾을 수 없습니다." }, { status: 404 });
  const city = String(trip.city || "").trim(), country = String(trip.country || "").trim();
  const stays = ((reservations || []) as WeatherStay[]).filter((stay) => isWeatherStay(stay.type));
  if (!city && !country && !stays.length) return NextResponse.json({ error: "여행 장소나 숙소 주소를 설정해 주세요." }, { status: 400 });
  const start = String(trip.start_date || "").slice(0, 10), end = String(trip.end_date || trip.start_date || "").slice(0, 10);
  if (!validDate(start) || !validDate(end) || start > end) return NextResponse.json({ error: "여행 날짜를 확인해 주세요." }, { status: 400 });
  try {
    const cityLocation = await cityDestination(city, country);
    const today = dateInZone(new Date(), cityLocation?.timezone || "UTC");
    const earliest = shiftDate(today, -92), latest = shiftDate(today, cityLocation ? 15 : 14);
    const from = start < earliest ? earliest : start, to = end > latest ? latest : end;
    if (from > to) return NextResponse.json({ weather: [], source: "open-meteo", message: start > latest ? "아직 예보 제공 전이에요. 여행일이 가까워지면 자동으로 불러와요." : "이 여행 날짜는 날씨 조회 가능 범위를 벗어났어요." });

    const dates: string[] = [];
    for (let date = from; date <= to; date = shiftDate(date, 1)) dates.push(date);
    const fetchForecast = async (location: Destination, dates: string[]) => {
      const ordered = [...dates].sort();
      const query = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), daily: "weather_code,temperature_2m_max", timezone: "auto", start_date: ordered[0], end_date: ordered[ordered.length - 1] });
      const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error("forecast");
      const data = await response.json() as { daily?: DailyForecast };
      return (data.daily?.time || []).flatMap((date, index) => {
        if (!dates.includes(date)) return [];
        const temperature = data.daily?.temperature_2m_max?.[index], code = data.daily?.weather_code?.[index];
        if (temperature == null || code == null || !Number.isFinite(temperature) || !Number.isFinite(code)) return [];
        const [condition, icon] = weatherLabel(code);
        return [{ trip_id: tripId, date, temperature, condition, icon, locationLabel: location.label, locationSource: location.kind }];
      });
    };
    // Only look up hotel addresses for dates that city weather could not supply.
    const cityPoint: Destination | undefined = cityLocation ? { ...cityLocation, label: city || country, kind: "city" } : undefined;
    const rows = cityPoint ? await fetchForecast(cityPoint, dates).catch(() => []) : [];
    const missingDates = dates.filter((date) => !rows.some((row) => row.date === date));
    const plans = new Map<string, { stay: WeatherStay; dates: string[] }>();
    for (const date of missingDates) {
      const stay = stayForWeatherDate(stays, date);
      if (!stay) continue;
      const key = [stay.location || "", stay.title].join("|");
      const plan = plans.get(key) || { stay, dates: [] };
      plan.dates.push(date); plans.set(key, plan);
    }
    const fallbackResults = await Promise.allSettled([...plans.values()].map(async (plan) => {
      const location = await stayDestination(plan.stay, city, country, cityLocation);
      return location ? fetchForecast(location, plan.dates) : [];
    }));
    rows.push(...fallbackResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
    rows.sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) return NextResponse.json({ error: cityLocation || plans.size ? "도시와 숙소의 날씨를 불러오지 못했어요. 잠시 후 다시 불러와 주세요." : "선택한 도시에서 위치를 찾지 못했어요. 도시를 다시 선택하거나 숙소 주소를 추가해 주세요." }, { status: cityLocation || plans.size ? 502 : 404 });
    if (save && rows.length) {
      const { error } = await client.from("weather_days").upsert(rows.map((row) => ({ trip_id: row.trip_id, date: row.date, temperature: row.temperature, condition: row.condition, icon: row.icon })), { onConflict: "trip_id,date" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ weather: rows, source: "open-meteo", message: rows.length ? undefined : "해당 날짜의 날씨가 아직 제공되지 않아요." });
  } catch {
    return NextResponse.json({ error: "날씨를 불러오지 못했어요. 잠시 후 다시 불러와 주세요." }, { status: 502 });
  }
}

export async function GET(request: Request, context: Context) { return loadWeather(request, context, false); }
export async function POST(request: Request, context: Context) { return loadWeather(request, context, true); }

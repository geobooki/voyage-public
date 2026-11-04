import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";

type DailyForecast = { time?: string[]; temperature_2m_max?: (number | null)[]; weather_code?: (number | null)[] };
type Location = { latitude: number; longitude: number; country?: string; country_code?: string; timezone?: string };
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

async function loadWeather(request: Request, context: Context, save: boolean) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await context.params).tripId, client);
  const { data: trip, error: tripError } = await client.from("trips").select("city,country,start_date,end_date").eq("id", tripId).single();
  if (tripError || !trip) return NextResponse.json({ error: "여행 정보를 찾을 수 없습니다." }, { status: 404 });
  const city = String(trip.city || "").trim();
  const country = String(trip.country || "").trim();
  if (!city && !country) return NextResponse.json({ error: "여행 장소를 설정해 주세요." }, { status: 400 });
  const start = String(trip.start_date || "").slice(0, 10);
  const end = String(trip.end_date || start).slice(0, 10);
  if (!validDate(start) || !validDate(end) || start > end) return NextResponse.json({ error: "여행 날짜를 확인해 주세요." }, { status: 400 });

  try {
    // Search by city name rather than a combined city/country string.
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city || country)}&count=10&language=ko&format=json`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) });
    if (!geoResponse.ok) throw new Error("geocoding");
    const geo = await geoResponse.json() as { results?: Location[] };
    const names = new Intl.DisplayNames(["ko"], { type: "region" });
    const englishNames = new Intl.DisplayNames(["en"], { type: "region" });
    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s/g, "");
    const matches = (location: Location) => [location.country, location.country_code, location.country_code ? names.of(location.country_code) : "", location.country_code ? englishNames.of(location.country_code) : ""].some((name) => name && normalize(name) === normalize(country));
    const location = geo.results?.find(matches) || geo.results?.[0];
    if (!location) return NextResponse.json({ error: "여행 장소의 위치를 찾지 못했습니다." }, { status: 404 });
    const today = dateInZone(new Date(), location.timezone || "UTC");
    const earliest = shiftDate(today, -92);
    const latest = shiftDate(today, 15);
    const from = start < earliest ? earliest : start;
    const to = end > latest ? latest : end;
    if (from > to) return NextResponse.json({ weather: [], source: "open-meteo", message: start > latest ? "아직 예보 제공 전이에요. 여행일이 가까워지면 자동으로 불러와요." : "이 여행 날짜는 날씨 조회 가능 범위를 벗어났어요." });
    const query = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), daily: "weather_code,temperature_2m_max", timezone: location.timezone || "auto", start_date: from, end_date: to });
    const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("forecast");
    const forecast = await response.json() as { daily?: DailyForecast };
    const daily = forecast.daily;
    const rows = (daily?.time || []).flatMap((date, index) => {
      const temperature = daily?.temperature_2m_max?.[index];
      const code = daily?.weather_code?.[index];
      if (temperature == null || code == null || !Number.isFinite(temperature) || !Number.isFinite(code)) return [];
      const [condition, icon] = weatherLabel(code);
      return [{ trip_id: tripId, date, temperature, condition, icon }];
    });
    if (save && rows.length) {
      const { error } = await client.from("weather_days").upsert(rows, { onConflict: "trip_id,date" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ weather: rows, source: "open-meteo", message: rows.length ? undefined : "해당 날짜의 날씨가 아직 제공되지 않아요." });
  } catch {
    return NextResponse.json({ error: "날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}

// Automatic viewing works for viewers too; it does not require a database write.
export async function GET(request: Request, context: Context) { return loadWeather(request, context, false); }
export async function POST(request: Request, context: Context) { return loadWeather(request, context, true); }

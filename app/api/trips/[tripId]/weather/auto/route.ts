import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";

type DailyForecast = { time?: string[]; temperature_2m_max?: number[]; weather_code?: number[] };
const weatherLabel = (code: number) => code === 0 ? ["맑음", "☀️"] : code < 3 ? ["구름 조금", "🌤️"] : code < 50 ? ["안개", "🌫️"] : code < 70 ? ["비", "🌧️"] : code < 80 ? ["눈", "❄️"] : code < 90 ? ["소나기", "🌦️"] : ["뇌우", "⛈️"];

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const { data: trip, error: tripError } = await client.from("trips").select("city,country,start_date,end_date").eq("id", tripId).single();
  if (tripError || !trip) return NextResponse.json({ error: tripError?.message || "여행 정보를 찾을 수 없습니다." }, { status: 404 });
  if (!trip.city && !trip.country) return NextResponse.json({ error: "여행 장소가 없어 날씨를 찾을 수 없습니다." }, { status: 400 });
  const query = encodeURIComponent([trip.city, trip.country].filter(Boolean).join(", "));
  const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=ko&format=json`, { next: { revalidate: 86400 } });
  const geo = await geoResponse.json() as { results?: { latitude: number; longitude: number }[] };
  const location = geo.results?.[0];
  if (!location) return NextResponse.json({ error: "여행 장소의 위치를 찾지 못했습니다." }, { status: 404 });
  const start = String(trip.start_date || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const end = String(trip.end_date || start).slice(0, 10);
  const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=weather_code,temperature_2m_max&timezone=Asia%2FSeoul&start_date=${start}&end_date=${end}`, { next: { revalidate: 1800 } });
  if (!forecastResponse.ok) return NextResponse.json({ error: "예정 날씨를 불러오지 못했습니다." }, { status: 502 });
  const forecast = await forecastResponse.json() as { daily?: DailyForecast };
  const daily = forecast.daily;
  const rows = (daily?.time || []).map((date, index) => {
    const [condition, icon] = weatherLabel(Number(daily?.weather_code?.[index] ?? 0));
    return { trip_id: tripId, date, temperature: Number(daily?.temperature_2m_max?.[index] ?? 0), condition, icon };
  });
  if (rows.length) {
    const { error } = await client.from("weather_days").upsert(rows, { onConflict: "trip_id,date" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ weather: rows, source: "open-meteo" });
}

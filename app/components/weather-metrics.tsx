import type { WeatherDay } from "@/types/trip";

export function WeatherMetrics({ weather, ko }: { weather: WeatherDay; ko: boolean }) {
  const minimum = weather.minimumTemperature;
  const probability = weather.precipitationProbability;
  return <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
    <span><span className="muted">{ko ? "최저" : "Low"}</span> {minimum != null && Number.isFinite(minimum) ? minimum + "°C" : "—"}</span>
    <span><span className="muted">{ko ? "최고" : "High"}</span> {weather.temperature}°C</span>
    <span aria-label={(ko ? "강수확률 " : "Chance of precipitation ") + (probability == null ? (ko ? "정보 없음" : "unavailable") : Math.round(probability) + "%")} title={ko ? "일일 최대 강수확률" : "Daily maximum precipitation probability"}><span aria-hidden="true">🌧️</span> {probability != null && Number.isFinite(probability) ? Math.round(probability) + "%" : "—"}</span>
  </div>;
}

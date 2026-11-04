export type WeatherStay = { id: string; type: string; title: string; location?: string | null; date?: string | null; end_date?: string | null };
export const isWeatherStay = (type: string) => ["stay", "숙박", "hotel", "호텔", "accommodation", "resort", "리조트"].includes(type.trim().toLowerCase());
export function stayForWeatherDate(stays: WeatherStay[], date: string) {
  return stays.filter((stay) => isWeatherStay(stay.type) && stay.date && stay.date <= date && (stay.end_date ? date < stay.end_date : date === stay.date) && Boolean(stay.location?.trim() || stay.title.trim()))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.id.localeCompare(b.id))[0];
}
export function stayCoordinate(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/) || value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const latitude = Number(match[1]), longitude = Number(match[2]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : undefined;
}

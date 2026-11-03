export type SelectableTrip = {
  id: string;
  slug?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
};

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => localDate(new Date());
const normalizeDate = (value: string | null | undefined) => {
  const match = String(value || "").match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : "";
};

export function isCurrentOrSoonTrip(trip: SelectableTrip, now = today()) {
  if (String(trip.status || "").toLowerCase() === "completed") return false;
  if (!trip.start_date) return false;
  const start = normalizeDate(trip.start_date);
  const end = normalizeDate(trip.end_date) || start;
  if (!start) return false;
  const soonLimit = new Date(`${now}T00:00:00`);
  soonLimit.setDate(soonLimit.getDate() + 7);
  const limit = localDate(soonLimit);
  return (start <= now && end >= now) || (start >= now && start <= limit);
}

export function selectCurrentOrSoonTrip<T extends SelectableTrip>(trips: T[]) {
  return [...trips]
    .filter((trip) => isCurrentOrSoonTrip(trip))
    .sort((a, b) => {
      const current = today();
      const aStart = normalizeDate(a.start_date);
      const aEnd = normalizeDate(a.end_date) || aStart;
      const bStart = normalizeDate(b.start_date);
      const bEnd = normalizeDate(b.end_date) || bStart;
      const aActive = Boolean(aStart && aStart <= current && aEnd >= current);
      const bActive = Boolean(bStart && bStart <= current && bEnd >= current);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return String(a.start_date || "9999").localeCompare(String(b.start_date || "9999"));
    })[0];
}

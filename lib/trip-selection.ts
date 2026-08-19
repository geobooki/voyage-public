export type SelectableTrip = {
  id: string;
  slug?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export function isCurrentOrSoonTrip(trip: SelectableTrip, now = today()) {
  if (String(trip.status || "").toLowerCase() === "completed") return false;
  if (!trip.start_date) return false;
  const start = trip.start_date;
  const end = trip.end_date || start;
  const soonLimit = new Date(`${now}T00:00:00`);
  soonLimit.setDate(soonLimit.getDate() + 7);
  const limit = soonLimit.toISOString().slice(0, 10);
  return (start <= now && end >= now) || (start >= now && start <= limit);
}

export function selectCurrentOrSoonTrip<T extends SelectableTrip>(trips: T[]) {
  return [...trips]
    .filter((trip) => isCurrentOrSoonTrip(trip))
    .sort((a, b) => {
      const aActive = a.start_date && a.end_date && a.start_date <= today() && a.end_date >= today();
      const bActive = b.start_date && b.end_date && b.start_date <= today() && b.end_date >= today();
      if (aActive !== bActive) return aActive ? -1 : 1;
      return String(a.start_date || "9999").localeCompare(String(b.start_date || "9999"));
    })[0];
}

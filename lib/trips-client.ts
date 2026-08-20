export type TripSummary = {
  id: string;
  slug?: string;
  title: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
};

let tripsRequest: Promise<TripSummary[]> | null = null;

export function getTrips(): Promise<TripSummary[]> {
  if (!tripsRequest) {
    tripsRequest = fetch("/api/trips")
      .then((response) => (response.ok ? response.json() : { trips: [] }))
      .then((result) => (Array.isArray(result.trips) ? result.trips : []))
      .catch(() => {
        tripsRequest = null;
        return [];
      });
  }
  return tripsRequest;
}

export function clearTripsCache() {
  tripsRequest = null;
}

import { authenticatedFetch } from "@/lib/authenticated-fetch";

export type TripSummary = {
  id: string;
  slug?: string;
  title: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  destination_currency?: string;
  trip_type?: "domestic" | "international";
};

let tripsRequest: Promise<TripSummary[]> | null = null;
let cachedAt = 0;
let completed = false;
const cacheLifetime = 30_000;

export function getTrips(): Promise<TripSummary[]> {
  if (tripsRequest && completed && Date.now() - cachedAt >= cacheLifetime) clearTripsCache();
  if (!tripsRequest) {
    completed = false;
    const request = authenticatedFetch("/api/trips", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw Error("여행 목록 조회 실패"); return response.json(); })
      .then((result) => { if (tripsRequest === request) { completed = true; cachedAt = Date.now(); } return Array.isArray(result.trips) ? result.trips : []; })
      .catch(() => { if (tripsRequest === request) clearTripsCache(); return []; });
    tripsRequest = request;
  }
  return tripsRequest;
}

export function clearTripsCache() {
  tripsRequest = null; cachedAt = 0; completed = false;
}

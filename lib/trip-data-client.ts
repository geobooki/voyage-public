import { authenticatedFetch } from "./authenticated-fetch";

const pending = new Map<string, Promise<Record<string, any>>>();
const defaults = new Map<string, Promise<boolean>>();

// Only concurrent GETs are shared. No resolved trip data is cached across reads.
export function getTripData(tripId: string, view: string, userId: string, fresh = false) {
  const key = JSON.stringify([userId, tripId, view]);
  const existing = pending.get(key);
  if (!fresh && existing) return existing;
  const url = `/api/trips/${encodeURIComponent(tripId)}${view === "full" ? "" : `?view=${encodeURIComponent(view)}`}`;
  const request = authenticatedFetch(url, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw Error("여행 정보를 불러오지 못했어요.");
    return response.json() as Promise<Record<string, any>>;
  }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
  pending.set(key, request);
  return request;
}

// Keep legacy normalization off the loading path and run it once per account
// in this app session. Failed attempts can be retried on the next read.
export function ensureExpenseDefaults(userId: string) {
  const existing = defaults.get(userId);
  if (existing) return existing;
  const request = authenticatedFetch("/api/expenses/default-payment", { method: "POST" })
    .then((response) => response.ok).catch(() => false)
    .then((ok) => { if (!ok && defaults.get(userId) === request) defaults.delete(userId); return ok; });
  defaults.set(userId, request);
  return request;
}

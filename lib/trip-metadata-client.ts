import { authenticatedFetch } from "./authenticated-fetch";
type MetadataResponse = { trip?: Record<string, unknown> };
const pending = new Map<string, Promise<MetadataResponse>>();
// Share only concurrent reads; never keep an account's resolved data globally.
export function getTripMetadata(tripId: string, userId: string) {
  const key = JSON.stringify([userId, tripId]);
  const existing = pending.get(key); if (existing) return existing;
  const request = authenticatedFetch(`/api/trips/${encodeURIComponent(tripId)}?view=meta`, { cache: "no-store" }).then(async (response) => { if (!response.ok) throw Error("여행 정보를 불러오지 못했어요."); return response.json() as Promise<MetadataResponse>; }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
  pending.set(key, request); return request;
}

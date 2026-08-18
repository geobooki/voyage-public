export const TOKYO_TRIP_ID = "00000000-0000-0000-0000-000000000001";
const aliases: Record<string, string> = { tokyo: TOKYO_TRIP_ID };

export function resolveTripId(tripId: string) {
  return aliases[tripId] ?? tripId;
}

export async function resolveTripIdForRequest(tripId: string, client: any) {
  const alias = resolveTripId(tripId);
  if (alias !== tripId || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(alias)) return alias;
  const { data } = await client.from("trips").select("id").eq("slug", tripId).maybeSingle();
  return data?.id ?? tripId;
}

export const TOKYO_TRIP_ID = "00000000-0000-0000-0000-000000000001";
const aliases: Record<string, string> = { tokyo: TOKYO_TRIP_ID };

export function resolveTripId(tripId: string) {
  return aliases[tripId] ?? tripId;
}

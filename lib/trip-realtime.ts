import type { SupabaseClient } from "@supabase/supabase-js";
const tablesByView: Record<string, string[]> = {
  budget: ["trips", "expenses", "travelers", "schedule_items", "places", "budget_items", "exchange_plans"],
  overview: ["trips", "travelers", "places", "expenses", "schedule_items", "budget_items", "reservations"],
  preparation: ["checklist_items"], reservations: ["reservations"],
  during: ["places", "expenses", "travelers", "schedule_items", "weather_days", "reservations"],
  after: ["places", "expenses", "budget_items", "exchange_plans", "travelers", "reviews"],
};
const fullTables = ["trips", "places", "expenses", "travelers", "checklist_items", "checklist_categories", "budget_items", "reservations", "schedule_items", "exchange_plans", "dashboard_items", "souvenirs", "reviews", "weather_days"];
export function tripSubscriptionSpecs(tripId: string, view: string) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(tripId)) return [];
  return (tablesByView[view] || fullTables).map((table) => ({ event: "*" as const, schema: "public", table, filter: `${table === "trips" ? "id" : "trip_id"}=eq.${tripId}` }));
}
export function subscribeTripChanges(client: Pick<SupabaseClient, "channel" | "removeChannel">, tripId: string, view: string, onChange: () => void) {
  const specs = tripSubscriptionSpecs(tripId, view); if (!specs.length) return () => {};
  const channel = client.channel(`voyage-trip-${tripId}-${view}`); let timer: ReturnType<typeof setTimeout> | undefined, stopped = false;
  const changed = () => { if (stopped) return; if (timer) clearTimeout(timer); timer = setTimeout(() => { if (!stopped) onChange(); }, 200); };
  specs.forEach((spec) => channel.on("postgres_changes", spec, changed)); channel.subscribe();
  return () => { stopped = true; if (timer) clearTimeout(timer); void client.removeChannel(channel); };
}

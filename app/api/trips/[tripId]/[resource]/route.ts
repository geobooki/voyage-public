import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveTripIdForRequest } from "@/lib/trip-id";

const tableByResource: Record<string, string> = {
  checklist: "checklist_items",
  places: "places",
  schedule: "schedule_items",
  souvenirs: "souvenirs",
  reservations: "reservations",
  budget: "budget_items",
  review: "reviews",
  exchange: "exchange_plans",
  "checklist-categories": "checklist_categories",
  dashboard: "dashboard_items",
};

const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function toRow(resource: string, tripId: string, body: Record<string, unknown>) {
  const base = { trip_id: tripId, ...(uuid(body.id) ? { id: body.id } : {}) };
  if (resource === "checklist") return { ...base, kind: body.kind ?? "packing", category: body.category ?? "General", name: body.name, checked: Boolean(body.checked) };
  if (resource === "checklist-categories") return { ...base, kind: body.kind ?? "packing", name: body.name, color: body.color ?? "#FDE68A" };
  if (resource === "dashboard") return { ...base, kind: body.kind ?? "do", title: body.title, detail: body.detail ?? null, url: body.url ?? null };
  if (resource === "places") return { ...base, name: body.name, type: body.type ?? "other", address: body.address ?? null, latitude: body.latitude ?? null, longitude: body.longitude ?? null, expected_cost: Number(body.expectedCost ?? 0), visit_date: body.visitDate || null, must_go: Boolean(body.mustGo), visited: Boolean(body.visited), memo: body.memo ?? null };
  if (resource === "schedule") return { ...base, place_id: body.placeId ?? null, date: body.date ?? "2026-09-10", time: body.time ?? null, type: body.type ?? "other", title: body.title, note: body.note ?? null, completed: Boolean(body.completed), sort_order: Number(body.order ?? 0) };
  if (resource === "souvenirs") return { ...base, name: body.name, estimated_price: Number(body.estimatedPrice ?? 0), purchased: Boolean(body.purchased), actual_price: Number(body.actualPrice ?? 0), memo: body.memo ?? null };
  if (resource === "reservations") return { ...base, type: body.type ?? "other", title: body.title, date: body.date || null, end_date: body.endDate || null, time: body.time || null, location: body.location ?? null, departure_location: body.departureLocation ?? null, arrival_location: body.arrivalLocation ?? null, departure_time: body.departureTime || null, arrival_time: body.arrivalTime || null, airline: body.airline ?? null, terminal: body.terminal ?? null, reservation_number: body.reservationNumber ?? null, cost: Number(body.cost ?? 0), memo: body.memo ?? null, link: body.link ?? null };
  if (resource === "budget") return { ...base, name: body.name ?? null, detail: body.detail ?? null, category: body.category ?? "Other", estimated_amount: Number(body.amount ?? body.estimatedAmount ?? 0), currency: body.currency ?? "KRW", payment_method: body.paymentMethod ?? null };
  if (resource === "review") return { ...base, rating: body.rating ?? null, comment: body.comment ?? null, good_things: body.goodThings ?? null, bad_things: body.badThings ?? null, revisit_places: body.revisitPlaces ?? null };
  return { ...base, from_currency: body.from ?? "KRW", to_currency: body.to ?? "JPY", rate: Number(body.rate ?? 0), expected_cash: Number(body.expectedCash ?? 0), card_estimate: Number(body.cardEstimate ?? 0), planned_exchange: Number(body.plannedExchange ?? 0), actual_exchange: Number(body.actualExchange ?? 0) };
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string; resource: string }> }) {
  const { tripId: rawTripId, resource } = await params;
  const table = tableByResource[resource];
  if (!table) return NextResponse.json({ error: "Unsupported resource." }, { status: 404 });
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const row = toRow(resource, tripId, await request.json());
  const client = supabase.from(table) as any;
  const query = resource === "review" || resource === "exchange" ? client.upsert(row, { onConflict: "trip_id" }) : client.insert(row);
  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string; resource: string }> }) {
  const { tripId: rawTripId, resource } = await params;
  const table = tableByResource[resource];
  if (!table) return NextResponse.json({ error: "Unsupported resource." }, { status: 404 });
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const body = await request.json();
  const row = toRow(resource, tripId, body);
  delete (row as Record<string, unknown>).trip_id;
  const client = supabase.from(table) as any;
  const query = resource === "review" || resource === "exchange" ? client.update(row).eq("trip_id", tripId) : client.update(row).eq("id", body.id);
  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string; resource: string }> }) {
  const { tripId: rawTripId, resource } = await params;
  const table = tableByResource[resource];
  if (!table) return NextResponse.json({ error: "Unsupported resource." }, { status: 404 });
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Resource id is required." }, { status: 400 });
  const client = supabase.from(table) as any;
  const { error } = await client.delete().eq("id", id).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

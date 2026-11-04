import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `trip-${Date.now()}`;

export async function GET(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const view = new URL(request.url).searchParams.get("view");
  // Detail pages already load the full trip store. Keep metadata-only callers
  // from repeating 13 unrelated table queries just to render the header.
  if (new URL(request.url).searchParams.get("view") === "meta") {
    const { data, error } = await client.from("trips").select("id,title,slug,city,country,start_date,end_date,status,destination_currency").eq("id", tripId).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ trip: data });
  }
  const viewTables: Record<string, Record<string, any>> = {
    overview: {
      trip: client.from("trips").select("id,title,slug,city,country,start_date,end_date,status,destination_currency").eq("id", tripId).single(),
      places: client.from("places").select("*").eq("trip_id", tripId).order("created_at"),
      expenses: client.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
      schedule: client.from("schedule_items").select("*").eq("trip_id", tripId).order("date").order("time"),
      budget: client.from("budget_items").select("*").eq("trip_id", tripId).order("created_at"),
      reservations: client.from("reservations").select("*").eq("trip_id", tripId).order("date"),
    },
    preparation: {
      checklist: client.from("checklist_items").select("*").eq("trip_id", tripId).order("created_at"),
    },
    reservations: {
      reservations: client.from("reservations").select("*").eq("trip_id", tripId).order("date"),
    },
    budget: {
      trip: client.from("trips").select("id,destination_currency").eq("id", tripId).single(),
      expenses: client.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
      budget: client.from("budget_items").select("*").eq("trip_id", tripId).order("created_at"),
      exchange: client.from("exchange_plans").select("*").eq("trip_id", tripId).maybeSingle(),
    },
    during: {
      places: client.from("places").select("*").eq("trip_id", tripId).order("created_at"),
      expenses: client.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
      travelers: client.from("travelers").select("*").eq("trip_id", tripId).order("created_at"),
      schedule: client.from("schedule_items").select("*").eq("trip_id", tripId).order("date").order("time"),
      weather: client.from("weather_days").select("*").eq("trip_id", tripId).order("date"),
      reservations: client.from("reservations").select("*").eq("trip_id", tripId).order("date"),
    },
    after: {
      places: client.from("places").select("*").eq("trip_id", tripId).order("created_at"),
      expenses: client.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
      budget: client.from("budget_items").select("*").eq("trip_id", tripId).order("created_at"),
      exchange: client.from("exchange_plans").select("*").eq("trip_id", tripId).maybeSingle(),
      travelers: client.from("travelers").select("*").eq("trip_id", tripId).order("created_at"),
      review: client.from("reviews").select("*").eq("trip_id", tripId).maybeSingle(),
    },
  };
  if (view && viewTables[view]) {
    const results = await Promise.all(Object.entries(viewTables[view]).map(async ([key, query]) => {
      const result = await query;
      return [key, result] as const;
    }));
    const error = results.map(([, result]) => result.error).find(Boolean);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(Object.fromEntries(results.map(([key, result]) => [key, result.data])));
  }
  const [trip, places, expenses, travelers, schedule, souvenirs, exchange, weather, checklist, categories, budget, reservations, review, dashboard] = await Promise.all([
    client.from("trips").select("*").eq("id", tripId).single(),
    client.from("places").select("*").eq("trip_id", tripId).order("created_at"),
    client.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
    client.from("travelers").select("*").eq("trip_id", tripId).order("created_at"),
    client.from("schedule_items").select("*").eq("trip_id", tripId).order("date").order("time"),
    client.from("souvenirs").select("*").eq("trip_id", tripId).order("created_at"),
    client.from("exchange_plans").select("*").eq("trip_id", tripId).maybeSingle(),
    client.from("weather_days").select("*").eq("trip_id", tripId).order("date"),
    client.from("checklist_items").select("*").eq("trip_id", tripId).order("created_at"),
    client.from("checklist_categories").select("*").eq("trip_id", tripId).eq("kind", "packing").order("created_at"),
    client.from("budget_items").select("*").eq("trip_id", tripId).order("created_at"),
    client.from("reservations").select("*").eq("trip_id", tripId).order("date"),
    client.from("reviews").select("*").eq("trip_id", tripId).maybeSingle(),
    client.from("dashboard_items").select("*").eq("trip_id", tripId).order("created_at"),
  ]);
  const error = trip.error || places.error || expenses.error || travelers.error || schedule.error || souvenirs.error || exchange.error || weather.error || checklist.error || categories.error || budget.error || reservations.error || review.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip: trip.data, places: places.data, expenses: expenses.data, travelers: travelers.data, schedule: schedule.data, souvenirs: souvenirs.data, exchange: exchange.data, weather: weather.data, checklist: checklist.data, categories: categories.data, budget: budget.data, reservations: reservations.data, review: review.data, dashboard: dashboard.error ? [] : dashboard.data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json();
  const updates = {
    ...(body.title?.trim() ? { title: body.title.trim(), slug: slugify(body.title) } : {}),
    ...(body.country !== undefined ? { country: body.country || null } : {}),
    ...(body.city !== undefined ? { city: body.city || null } : {}),
    ...(body.startDate !== undefined ? { start_date: body.startDate || null } : {}),
    ...(body.endDate !== undefined ? { end_date: body.endDate || null } : {}),
    ...(body.destinationCurrency ? { destination_currency: body.destinationCurrency } : {}),
    ...(body.tripType === "domestic" || body.tripType === "international" ? { trip_type: body.tripType, ...(body.tripType === "domestic" ? { destination_currency: "KRW" } : {}) } : {}),
    ...(body.status ? { status: body.status } : {}),
    updated_at: new Date().toISOString(),
  };
  if (updates.status && !["planning", "active", "completed"].includes(updates.status)) return NextResponse.json({ error: "Invalid trip status." }, { status: 400 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const { data, error } = await client.from("trips").update(updates).eq("id", tripId).select().single();
  if (error) {
    const missingCurrencyColumn = error.message.includes("destination_currency") && error.message.includes("schema cache");
    return NextResponse.json({ error: missingCurrencyColumn ? "Supabase에 destination_currency 컬럼이 없습니다. supabase/trip-fixes.sql을 실행한 뒤 다시 시도하세요." : error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const { error } = await client.from("trips").delete().eq("id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

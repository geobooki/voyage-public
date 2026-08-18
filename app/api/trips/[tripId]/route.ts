import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveTripIdForRequest } from "@/lib/trip-id";

export async function GET(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  if (!supabase) return NextResponse.json({ configured: false, message: "Supabase environment variables are not configured." }, { status: 503 });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const [trip, places, expenses, travelers, schedule, souvenirs, exchange, weather, checklist, categories, budget, reservations, review] = await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).single(),
    supabase.from("places").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
    supabase.from("travelers").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("schedule_items").select("*").eq("trip_id", tripId).order("date").order("time"),
    supabase.from("souvenirs").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("exchange_plans").select("*").eq("trip_id", tripId).maybeSingle(),
    supabase.from("weather_days").select("*").eq("trip_id", tripId).order("date"),
    supabase.from("checklist_items").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("checklist_categories").select("*").eq("trip_id", tripId).eq("kind", "packing").order("created_at"),
    supabase.from("budget_items").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("reservations").select("*").eq("trip_id", tripId).order("date"),
    supabase.from("reviews").select("*").eq("trip_id", tripId).maybeSingle(),
  ]);
  const error = trip.error || places.error || expenses.error || travelers.error || schedule.error || souvenirs.error || exchange.error || weather.error || checklist.error || categories.error || budget.error || reservations.error || review.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip: trip.data, places: places.data, expenses: expenses.data, travelers: travelers.data, schedule: schedule.data, souvenirs: souvenirs.data, exchange: exchange.data, weather: weather.data, checklist: checklist.data, categories: categories.data, budget: budget.data, reservations: reservations.data, review: review.data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const body = await request.json();
  const updates = {
    ...(body.title?.trim() ? { title: body.title.trim() } : {}),
    ...(body.country !== undefined ? { country: body.country || null } : {}),
    ...(body.city !== undefined ? { city: body.city || null } : {}),
    ...(body.startDate !== undefined ? { start_date: body.startDate || null } : {}),
    ...(body.endDate !== undefined ? { end_date: body.endDate || null } : {}),
    ...(body.destinationCurrency ? { destination_currency: body.destinationCurrency } : {}),
    ...(body.status ? { status: body.status } : {}),
    updated_at: new Date().toISOString(),
  };
  if (updates.status && !["planning", "active", "completed"].includes(updates.status)) return NextResponse.json({ error: "Invalid trip status." }, { status: 400 });
  if (!supabase) return NextResponse.json({ configured: false, status: body.status });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const { data, error } = await supabase.from("trips").update(updates).eq("id", tripId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  if (!supabase) return NextResponse.json({ configured: false });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

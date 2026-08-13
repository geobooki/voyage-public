import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveTripId } from "@/lib/trip-id";

export async function GET(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const tripId = resolveTripId(rawTripId);
  if (!supabase) return NextResponse.json({ configured: false, message: "Supabase environment variables are not configured." }, { status: 503 });
  const [trip, places, expenses, travelers, schedule, souvenirs, exchange, weather, checklist, budget, reservations, review] = await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).single(),
    supabase.from("places").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
    supabase.from("travelers").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("schedule_items").select("*").eq("trip_id", tripId).order("date").order("time"),
    supabase.from("souvenirs").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("exchange_plans").select("*").eq("trip_id", tripId).maybeSingle(),
    supabase.from("weather_days").select("*").eq("trip_id", tripId).order("date"),
    supabase.from("checklist_items").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("budget_items").select("*").eq("trip_id", tripId).order("created_at"),
    supabase.from("reservations").select("*").eq("trip_id", tripId).order("date"),
    supabase.from("reviews").select("*").eq("trip_id", tripId).maybeSingle(),
  ]);
  const error = trip.error || places.error || expenses.error || travelers.error || schedule.error || souvenirs.error || exchange.error || weather.error || checklist.error || budget.error || reservations.error || review.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip: trip.data, places: places.data, expenses: expenses.data, travelers: travelers.data, schedule: schedule.data, souvenirs: souvenirs.data, exchange: exchange.data, weather: weather.data, checklist: checklist.data, budget: budget.data, reservations: reservations.data, review: review.data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const tripId = resolveTripId(rawTripId);
  const body = await request.json();
  if (!["planning", "active", "completed"].includes(body.status)) return NextResponse.json({ error: "Invalid trip status." }, { status: 400 });
  if (!supabase) return NextResponse.json({ configured: false, status: body.status });
  const { data, error } = await supabase.from("trips").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", tripId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveTripIdForRequest } from "@/lib/trip-id";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  if (!supabase) return NextResponse.json({ configured: false, message: "Supabase environment variables are not configured." }, { status: 503 });
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Traveler name is required." }, { status: 400 });
  const id = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id) ? body.id : undefined;
  const { data, error } = await supabase.from("travelers").insert({ ...(id ? { id } : {}), trip_id: tripId, name: body.name.trim() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

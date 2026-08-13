import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveTripId } from "@/lib/trip-id";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const tripId = resolveTripId(rawTripId);
  if (!supabase) return NextResponse.json({ configured: false, message: "Supabase environment variables are not configured." }, { status: 503 });
  const body = await request.json();
  const spentAt = body.date ? `${body.date}T${body.time || "12:00"}:00` : new Date().toISOString();
  const id = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id) ? body.id : undefined;
  const { data, error } = await supabase.from("expenses").insert({ ...(id ? { id } : {}), trip_id: tripId, amount: body.amount, currency: body.currency ?? "KRW", category: body.category ?? "other", place_id: body.placeId ?? null, payer_id: body.payerId ?? null, memo: body.memo ?? null, spent_at: spentAt }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

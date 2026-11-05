import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const body = await request.json();
  const spentAt = body.date ? `${body.date}T${body.time || "12:00"}:00` : new Date().toISOString();
  const id = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id) ? body.id : undefined;
  const { data, error } = await client.from("expenses").upsert({ ...(id ? { id } : {}), trip_id: tripId, name: body.name ?? null, amount: body.amount, currency: body.currency ?? "KRW", category: body.category ?? "other", payment_method: body.paymentMethod || null, place_id: body.placeId ?? null, payer_id: body.payerId ?? null, participant_ids: Array.isArray(body.participantIds) ? body.participantIds : [], memo: body.memo ?? null, krw_amount: body.krwAmount == null || body.krwAmount === "" ? null : Number(body.krwAmount), spent_at: spentAt }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const body = await request.json();
  const id = new URL(request.url).searchParams.get("id") || body.id;
  if (!id) return NextResponse.json({ error: "Expense id is required." }, { status: 400 });
  const spentAt = body.date ? `${body.date}T${body.time || "12:00"}:00` : new Date().toISOString();
  const { data, error } = await client.from("expenses").update({ name: body.name ?? null, amount: body.amount, currency: body.currency ?? "KRW", category: body.category ?? "other", payment_method: body.paymentMethod || null, place_id: body.placeId || null, payer_id: body.payerId ?? null, participant_ids: Array.isArray(body.participantIds) ? body.participantIds : [], memo: body.memo ?? null, krw_amount: body.krwAmount == null || body.krwAmount === "" ? null : Number(body.krwAmount), spent_at: spentAt }).eq("id", id).eq("trip_id", tripId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Expense id is required." }, { status: 400 });
  const { error } = await client.from("expenses").delete().eq("id", id).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

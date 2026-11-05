import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId: rawTripId } = await params;
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Traveler name is required." }, { status: 400 });
  const id = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id) ? body.id : undefined;
  const { data, error } = await client.from("travelers").insert({ ...(id ? { id } : {}), trip_id: tripId, name: body.name.trim() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const body = await request.json();
  if (!body.id || !body.name?.trim()) return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  const { data, error } = await client.from("travelers").update({ name: body.name.trim() }).eq("id", body.id).eq("trip_id", tripId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "여행자를 확인해 주세요." }, { status: 400 });
  const { data: expenses, error: expenseError } = await client.from("expenses").select("id,payer_id,participant_ids").eq("trip_id", tripId);
  if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 400 });
  if (expenses?.some((item) => item.payer_id === id || (Array.isArray(item.participant_ids) && item.participant_ids.includes(id)))) return NextResponse.json({ error: "지출에 연결된 여행자는 삭제할 수 없어요. 먼저 결제자와 분담자를 변경해 주세요." }, { status: 409 });
  const { error } = await client.from("travelers").delete().eq("id", id).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

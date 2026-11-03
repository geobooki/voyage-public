import { NextResponse } from "next/server";
import { getRequestSupabase, requireRequestUser } from "@/lib/supabase-request";

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `trip-${Date.now()}`;

export async function GET(request: Request) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });
  if (!client) return NextResponse.json({ configured: false, trips: [] });
  const { data, error } = await client.from("trips").select("*").order("start_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, trips: data });
}

export async function POST(request: Request) {
  const { client, user, error: authError } = await requireRequestUser(request);
  if (authError || !user) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Trip title is required." }, { status: 400 });
  if (!client) return NextResponse.json({ configured: false }, { status: 503 });
  const tripType = body.tripType === "domestic" ? "domestic" : "international";
  const { data, error } = await client.from("trips").insert({ owner_id: user.id, title: body.title.trim(), slug: slugify(body.title), country: body.country ?? null, city: body.city ?? null, destination_currency: tripType === "domestic" ? "KRW" : (body.destinationCurrency || "JPY"), trip_type: tripType, start_date: body.startDate || null, end_date: body.endDate || null, status: "planning" }).select().single();
  if (error) {
    const message = error.message.includes("row-level security")
      ? "Supabase RLS 정책이 INSERT를 차단했습니다. SQL Editor에서 supabase/rls.sql을 실행하세요."
      : error.message;
    return NextResponse.json({ error: message, code: error.code }, { status: 400 });
  }
  return NextResponse.json({ configured: true, trip: data }, { status: 201 });
}

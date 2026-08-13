import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) return NextResponse.json({ configured: false, trips: [] });
  const { data, error } = await supabase.from("trips").select("*").order("start_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, trips: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Trip title is required." }, { status: 400 });
  if (!supabase) return NextResponse.json({ configured: false, trip: { ...body, id: `local-${Date.now()}` } }, { status: 201 });
  const { data, error } = await supabase.from("trips").insert({ title: body.title.trim(), country: body.country ?? null, city: body.city ?? null, latitude: body.latitude == null || body.latitude === "" ? null : Number(body.latitude), longitude: body.longitude == null || body.longitude === "" ? null : Number(body.longitude), start_date: body.startDate || null, end_date: body.endDate || null, status: "planning" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ configured: true, trip: data }, { status: 201 });
}

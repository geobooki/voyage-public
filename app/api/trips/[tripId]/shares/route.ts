import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!supabase) return NextResponse.json({ error: "Supabase가 연결되지 않았습니다." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const permission = body.permission === "edit" ? "edit" : "view";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "초대할 이메일 주소를 확인해주세요." }, { status: 400 });

  const token = randomBytes(24).toString("base64url");
  const { data, error } = await supabase.from("trip_shares").insert({ trip_id: tripId, token, invite_email: email, permission }).select("token, permission, invite_email").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ shareUrl: `${origin}/share/${data.token}`, token: data.token });
}

export async function GET(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!supabase) return NextResponse.json({ shares: [] });
  const { data, error } = await supabase.from("trip_shares").select("token, permission, created_at").eq("trip_id", tripId).is("revoked_at", null).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ shares: data });
}

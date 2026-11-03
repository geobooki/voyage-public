import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";

export async function GET(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  await client.rpc("voyage_claim_memberships");
  const { data, error } = await client.from("trip_members").select("id,trip_id,member_email,role,user_id,created_at").eq("trip_id", tripId).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ members: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, user, error: authError } = await requireRequestUser(request);
  if (authError || !client || !user) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = body.role === "editor" ? "editor" : "viewer";
  if (!email || !email.includes("@")) return NextResponse.json({ error: "초대할 이메일을 입력하세요." }, { status: 400 });
  const { data, error } = await client.from("trip_members").insert({ trip_id: tripId, member_email: email, role, invited_by: user.id }).select("id,trip_id,member_email,role,user_id,created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ member: data }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const memberId = new URL(request.url).searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "멤버 id가 필요합니다." }, { status: 400 });
  const { error } = await client.from("trip_members").delete().eq("id", memberId).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

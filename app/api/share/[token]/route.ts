import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabase) return NextResponse.json({ error: "Supabase가 연결되지 않았습니다." }, { status: 503 });
  const { data: share, error: shareError } = await supabase.from("trip_shares").select("trip_id, permission").eq("token", token).is("revoked_at", null).maybeSingle();
  if (shareError || !share) return NextResponse.json({ error: "유효하지 않거나 취소된 공유 링크입니다." }, { status: 404 });

  const [tripResult, placesResult, scheduleResult, budgetResult, checklistResult] = await Promise.all([
    supabase.from("trips").select("id, title, country, city, start_date, end_date, status").eq("id", share.trip_id).single(),
    supabase.from("places").select("id, name, type, address, must_go, visited").eq("trip_id", share.trip_id).order("created_at"),
    supabase.from("schedule_items").select("id, date, time, title, type").eq("trip_id", share.trip_id).order("date").order("time"),
    supabase.from("budget_items").select("id, name, category, estimated_amount, currency").eq("trip_id", share.trip_id).order("created_at"),
    supabase.from("checklist_items").select("id, kind, category, name, checked").eq("trip_id", share.trip_id).order("created_at"),
  ]);
  if (tripResult.error || !tripResult.data) return NextResponse.json({ error: "여행을 불러오지 못했습니다." }, { status: 404 });
  return NextResponse.json({ trip: tripResult.data, permission: share.permission, places: placesResult.data ?? [], schedule: scheduleResult.data ?? [], budget: budgetResult.data ?? [], checklist: checklistResult.data ?? [] });
}

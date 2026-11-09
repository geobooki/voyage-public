import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { buildExpenseReport } from "@/lib/expense-report";
import type { Expense } from "@/types/trip";
export async function GET(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error } = await requireRequestUser(request);
  if (error || !client) return NextResponse.json({ error: error || "로그인이 필요합니다." }, { status: 401 });
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const [trip, expenses, travelers, settlements] = await Promise.all([
    client.from("trips").select("title,start_date,end_date").eq("id", tripId).single(),
    client.from("expenses").select("*").eq("trip_id", tripId).order("spent_at", { ascending: false }),
    client.from("travelers").select("id,name").eq("trip_id", tripId),
    client.from("settlement_records").select("id,kind,data").eq("trip_id", tripId).order("created_at"),
  ]);
  const critical = trip.error || expenses.error || travelers.error;
  if (critical) return NextResponse.json({ error: critical.message }, { status: 400 });
  const entries: Expense[] = (expenses.data || []).map((entry) => ({ id: entry.id, name: entry.name || undefined, amount: Number(entry.amount), currency: entry.currency || "KRW", category: entry.category, paymentMethod: entry.payment_method, placeId: entry.place_id, payerId: entry.payer_id, participantIds: entry.participant_ids || [], memo: entry.memo || "", date: String(entry.spent_at || "").slice(0, 10), time: String(entry.spent_at || "").slice(11, 16) || "12:00" }));
  const rows = settlements.data || [];
  const report = buildExpenseReport(entries, travelers.data || [], { splits: rows.filter((row) => row.kind === "split").map((row) => row.data), payments: rows.filter((row) => row.kind === "payment").map((row) => ({ ...row.data, id: row.id })) }, !settlements.error);
  const recordError = settlements.error ? ["42P01", "PGRST205"].includes(settlements.error.code) ? "정산 테이블이 아직 없어요. settlement-records.sql 실행 후 다시 생성해 주세요." : "정산 기록을 확인하지 못했어요. 권한과 연결을 확인한 뒤 다시 생성해 주세요." : undefined;
  return NextResponse.json({ trip: trip.data, generatedAt: new Date().toISOString(), report, recordError }, { headers: { "Cache-Control": "private, no-store" } });
}

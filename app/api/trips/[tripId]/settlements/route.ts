import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { currencyDigits } from "@/lib/settlement";
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const failure = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const dbError = (error: { code?: string; message: string }) => failure(["42P01", "PGRST205"].includes(error.code || "") ? "정산 저장 테이블이 필요해요. Supabase에서 supabase/settlement-records.sql을 실행해 주세요." : error.message, 400);
const validAmount = (value: unknown, currency: string, positive = false): value is number => { const units = typeof value === "number" ? value * 10 ** currencyDigits(currency) : NaN; return Number.isFinite(units) && Number.isSafeInteger(Math.round(units)) && Math.abs(units - Math.round(units)) < 0.000001 && (!positive || units > 0); };
export async function GET(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error } = await requireRequestUser(request); if (error || !client) return failure(error || "로그인이 필요합니다.", 401);
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  const result = await client.from("settlement_records").select("id,kind,data,created_at").eq("trip_id", tripId).order("created_at");
  if (result.error) return dbError(result.error);
  return NextResponse.json({ splits: result.data.filter((row) => row.kind === "split").map((row) => row.data), payments: result.data.filter((row) => row.kind === "payment").map((row) => ({ ...row.data, id: row.id })) });
}
export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error } = await requireRequestUser(request); if (error || !client) return failure(error || "로그인이 필요합니다.", 401);
  const tripId = await resolveTripIdForRequest((await params).tripId, client);
  let body; try { body = await request.json(); } catch { return failure("입력 내용을 확인해 주세요."); }
  if (!body || !uuid(body.id) || !["split", "payment"].includes(body.kind)) return failure("정산 항목을 확인해 주세요.");
  const { data: travelers, error: peopleError } = await client.from("travelers").select("id").eq("trip_id", tripId);
  if (peopleError) return dbError(peopleError);
  const people = new Set((travelers || []).map((person) => person.id));
  let data;
  if (body.kind === "split") {
    const { data: expense, error: expenseError } = await client.from("expenses").select("id,amount,currency,participant_ids").eq("trip_id", tripId).eq("id", body.id).single();
    if (expenseError || !expense) return failure("지출을 찾을 수 없어요.");
    const amounts = body.amounts;
    const participants = [...new Set<string>(expense.participant_ids || [])];
    if (!amounts || Array.isArray(amounts) || typeof amounts !== "object" || !participants.length || Object.keys(amounts).length !== participants.length || Object.keys(amounts).some((id) => !participants.includes(id)) || participants.some((id) => !people.has(id) || !validAmount(amounts[id], expense.currency) || (expense.amount >= 0 ? amounts[id] < 0 : amounts[id] > 0))) return failure("모든 분담자의 금액을 확인해 주세요.");
    const factor = 10 ** currencyDigits(expense.currency);
    if (participants.reduce((sum, id) => sum + Math.round(amounts[id] * factor), 0) !== Math.round(expense.amount * factor)) return failure("분담액 합계가 지출 금액과 같아야 해요.");
    data = { expenseId: body.id, amounts };
  } else {
    const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
    if (!/^[A-Z]{3}$/.test(currency) || !people.has(body.fromId) || !people.has(body.toId) || body.fromId === body.toId || !validAmount(body.amount, currency, true) || typeof body.date !== "string" || !Number.isFinite(Date.parse(body.date))) return failure("송금자·받는 사람·금액을 확인해 주세요.");
    data = { fromId: body.fromId, toId: body.toId, currency, amount: body.amount, date: body.date };
  }
  // Composite conflict target prevents a record from moving between trips.
  const result = await client.from("settlement_records").upsert({ id: body.id, trip_id: tripId, kind: body.kind, data }, { onConflict: "trip_id,id" }).select().single();
  if (result.error) return dbError(result.error);
  return NextResponse.json(result.data);
}
export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { client, error } = await requireRequestUser(request); if (error || !client) return failure(error || "로그인이 필요합니다.", 401);
  const tripId = await resolveTripIdForRequest((await params).tripId, client), id = new URL(request.url).searchParams.get("id");
  if (!uuid(id)) return failure("정산 항목을 확인해 주세요.");
  const result = await client.from("settlement_records").delete().eq("trip_id", tripId).eq("id", id);
  if (result.error) return dbError(result.error);
  return NextResponse.json({ ok: true });
}

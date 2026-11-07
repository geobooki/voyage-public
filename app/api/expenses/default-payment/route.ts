import { NextResponse } from "next/server";
import { requireRequestUser } from "@/lib/supabase-request";

// Idempotent: only unset values are changed; existing cash/card/custom methods stay intact.
export async function POST(request: Request) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const { count, error } = await client.from("expenses").update({ payment_method: "카드" }, { count: "exact" }).or('payment_method.is.null,payment_method.eq.""');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ updated: count || 0 });
}

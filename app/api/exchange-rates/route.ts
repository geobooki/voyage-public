import { NextResponse } from "next/server";

const supported = ["JPY", "USD", "EUR", "GBP", "CNY", "TWD", "THB", "VND", "SGD", "AUD", "CAD", "HKD", "PHP"];

export async function GET() {
  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=KRW&quotes=${supported.join(",")}`, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "환율 제공처에서 데이터를 받지 못했습니다." }, { status: 502 });
    const rows = await response.json() as Array<{ quote: string; rate: number; date: string }>;
    const rates: Record<string, number> = { KRW: 1 };
    rows.forEach((row) => { if (row.rate) rates[row.quote] = 1 / row.rate; });
    return NextResponse.json({ base: "KRW", rates, date: rows[0]?.date || null, source: "Frankfurter" }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "환율 데이터를 불러오는 중 문제가 발생했습니다." }, { status: 502 });
  }
}

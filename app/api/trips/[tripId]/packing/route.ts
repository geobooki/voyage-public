import { NextResponse } from "next/server";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { requireRequestUser } from "@/lib/supabase-request";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { client, error: authError } = await requireRequestUser(request);
  if (authError || !client) return NextResponse.json({ error: authError || "로그인이 필요합니다." }, { status: 401 });
  const { tripId: rawTripId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, client);
  const [itemsResult, categoriesResult] = await Promise.all([
    client.from("checklist_items").select("id,name,category,checked").eq("trip_id", tripId).eq("kind", "packing").order("created_at"),
    client.from("checklist_categories").select("id,name,color").eq("trip_id", tripId).eq("kind", "packing").order("created_at"),
  ]);
  if (itemsResult.error) return NextResponse.json({ error: itemsResult.error.message }, { status: 400 });
  if (categoriesResult.error) return NextResponse.json({ error: categoriesResult.error.message }, { status: 400 });
  return NextResponse.json({
    items: (itemsResult.data ?? []).map((item) => ({ ...item, checked: Boolean(item.checked) })),
    categories: categoriesResult.data ?? [],
  });
}

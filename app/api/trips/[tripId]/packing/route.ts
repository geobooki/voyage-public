import { NextResponse } from "next/server";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const [itemsResult, categoriesResult] = await Promise.all([
    supabase.from("checklist_items").select("id,name,category,checked").eq("trip_id", tripId).eq("kind", "packing").order("created_at"),
    supabase.from("checklist_categories").select("id,name,color").eq("trip_id", tripId).eq("kind", "packing").order("created_at"),
  ]);
  if (itemsResult.error) return NextResponse.json({ error: itemsResult.error.message }, { status: 400 });
  if (categoriesResult.error) return NextResponse.json({ error: categoriesResult.error.message }, { status: 400 });
  return NextResponse.json({
    items: (itemsResult.data ?? []).map((item) => ({ ...item, checked: Boolean(item.checked) })),
    categories: categoriesResult.data ?? [],
  });
}

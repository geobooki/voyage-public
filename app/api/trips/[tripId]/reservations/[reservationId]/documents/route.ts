import { NextResponse } from "next/server";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { supabase } from "@/lib/supabase";

type Context = { params: Promise<{ tripId: string; reservationId: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId, reservationId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const { data, error } = await supabase
    .from("reservation_documents")
    .select("id,reservation_id,file_name,storage_path,mime_type,size,created_at")
    .eq("trip_id", tripId)
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(request: Request, { params }: Context) {
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId, reservationId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const body = await request.json();
  const { data, error } = await supabase
    .from("reservation_documents")
    .insert({
      trip_id: tripId,
      reservation_id: reservationId,
      file_name: body.fileName,
      storage_path: body.storagePath,
      mime_type: body.mimeType ?? "application/pdf",
      size: Number(body.size ?? 0),
    })
    .select("id,reservation_id,file_name,storage_path,mime_type,size,created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ document: data }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Context) {
  if (!supabase) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabase);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  const { data: document, error: findError } = await supabase
    .from("reservation_documents")
    .select("storage_path")
    .eq("id", id)
    .eq("trip_id", tripId)
    .single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 400 });
  const { error: storageError } = await supabase.storage.from("reservation-pdfs").remove([document.storage_path]);
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 400 });
  const { error } = await supabase.from("reservation_documents").delete().eq("id", id).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

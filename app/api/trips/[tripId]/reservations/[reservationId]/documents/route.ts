import { NextResponse } from "next/server";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { supabaseServer } from "@/lib/supabase-server";

type Context = { params: Promise<{ tripId: string; reservationId: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!supabaseServer) return NextResponse.json({ configured: false }, { status: 503 });
  const storageClient = supabaseServer;
  const { tripId: rawTripId, reservationId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabaseServer);
  const { data, error } = await supabaseServer
    .from("reservation_documents")
    .select("id,reservation_id,file_name,storage_path,mime_type,size,created_at")
    .eq("trip_id", tripId)
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const documents = await Promise.all((data ?? []).map(async (document) => {
    const { data: signed } = await storageClient.storage.from("reservation-pdfs").createSignedUrl(document.storage_path, 60 * 10);
    return { ...document, signed_url: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ documents });
}

export async function POST(request: Request, { params }: Context) {
  if (!supabaseServer) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId, reservationId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabaseServer);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if ((!file.type.startsWith("image/") && file.type !== "application/pdf") || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Only images or PDF files up to 10MB are supported." }, { status: 400 });
  }
  const path = `${tripId}/${reservationId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabaseServer.storage.from("reservation-pdfs").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: `Storage 업로드에 실패했습니다: ${uploadError.message}` }, { status: 400 });
  let data: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await supabaseServer
      .from("reservation_documents")
      .insert({
        trip_id: tripId,
        reservation_id: reservationId,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
      })
      .select("id,reservation_id,file_name,storage_path,mime_type,size,created_at")
      .single();
    data = result.data;
    error = result.error;
    if (!error) break;
    if (!error.message.toLowerCase().includes("foreign key") && !error.message.toLowerCase().includes("violates row-level security")) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (error) {
    await supabaseServer.storage.from("reservation-pdfs").remove([path]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ document: data }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Context) {
  if (!supabaseServer) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabaseServer);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  const { data: document, error: findError } = await supabaseServer
    .from("reservation_documents")
    .select("storage_path")
    .eq("id", id)
    .eq("trip_id", tripId)
    .single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 400 });
  const { error: storageError } = await supabaseServer.storage.from("reservation-pdfs").remove([document.storage_path]);
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 400 });
  const { error } = await supabaseServer.from("reservation_documents").delete().eq("id", id).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

import { NextResponse } from "next/server";
import { resolveTripIdForRequest } from "@/lib/trip-id";
import { supabaseServer } from "@/lib/supabase-server";

type Context = { params: Promise<{ tripId: string; scheduleId: string }> };
const bucket = "reservation-pdfs";

export async function GET(_request: Request, { params }: Context) {
  if (!supabaseServer) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId, scheduleId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabaseServer);
  const { data, error } = await supabaseServer.from("schedule_documents")
    .select("id,schedule_id,file_name,storage_path,mime_type,size,created_at")
    .eq("trip_id", tripId).eq("schedule_id", scheduleId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const documents = await Promise.all((data ?? []).map(async (document) => {
    const { data: signed } = await supabaseServer!.storage.from(bucket).createSignedUrl(document.storage_path, 60 * 10);
    return { ...document, signed_url: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ documents });
}

export async function POST(request: Request, { params }: Context) {
  if (!supabaseServer) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId, scheduleId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabaseServer);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  if ((!file.type.startsWith("image/") && file.type !== "application/pdf") || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "사진 또는 PDF 파일만 10MB 이하로 올릴 수 있어요." }, { status: 400 });
  }
  const path = `${tripId}/schedule/${scheduleId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabaseServer.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: `Storage 업로드에 실패했습니다: ${uploadError.message}` }, { status: 400 });
  const { data, error } = await supabaseServer.from("schedule_documents").insert({ trip_id: tripId, schedule_id: scheduleId, file_name: file.name, storage_path: path, mime_type: file.type || "application/octet-stream", size: file.size }).select("id,schedule_id,file_name,storage_path,mime_type,size,created_at").single();
  if (error) {
    await supabaseServer.storage.from(bucket).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ document: data }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Context) {
  if (!supabaseServer) return NextResponse.json({ configured: false }, { status: 503 });
  const { tripId: rawTripId } = await params;
  const tripId = await resolveTripIdForRequest(rawTripId, supabaseServer);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "파일 ID가 필요합니다." }, { status: 400 });
  const { data: document, error: findError } = await supabaseServer.from("schedule_documents").select("storage_path").eq("id", id).eq("trip_id", tripId).single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 400 });
  await supabaseServer.storage.from(bucket).remove([document.storage_path]);
  const { error } = await supabaseServer.from("schedule_documents").delete().eq("id", id).eq("trip_id", tripId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}

"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { ReservationDocument } from "@/types/trip";

const maxSize = 10 * 1024 * 1024;
const isImage = (document: ReservationDocument) => document.mimeType.startsWith("image/");

export function ReservationDocuments({ tripId, reservationId }: { tripId: string; reservationId: string }) {
  const [documents, setDocuments] = useState<ReservationDocument[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch(`/api/trips/${tripId}/reservations/${reservationId}/documents`);
    if (!response.ok) return;
    const result = await response.json();
    const next = (result.documents ?? []).map((item: Record<string, unknown>) => ({ id: String(item.id), reservationId: String(item.reservation_id), fileName: String(item.file_name), storagePath: String(item.storage_path), mimeType: String(item.mime_type ?? "application/pdf"), size: Number(item.size ?? 0), createdAt: String(item.created_at) }));
    setDocuments(next);
    if (!supabaseBrowser) return;
    const storage = supabaseBrowser;
    const signed = await Promise.all(next.map(async (document: ReservationDocument) => { const { data } = await storage.storage.from("reservation-pdfs").createSignedUrl(document.storagePath, 60 * 10); return data?.signedUrl ? [document.id, data.signedUrl] as const : null; }));
    setPreviewUrls(Object.fromEntries(signed.filter((item): item is readonly [string, string] => Boolean(item))));
  };
  useEffect(() => { void load(); }, [tripId, reservationId]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setMessage("사진 또는 PDF 파일만 올릴 수 있어요."); return; }
    if (file.size > maxSize) { setMessage("파일은 10MB 이하만 올릴 수 있어요."); return; }
    if (!supabaseBrowser) { setMessage("Supabase 환경변수가 없어 업로드할 수 없어요."); return; }
    setBusy(true); setMessage("");
    const path = `${tripId}/${reservationId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabaseBrowser.storage.from("reservation-pdfs").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) { setMessage("업로드에 실패했어요. Supabase Storage 설정을 확인해 주세요."); setBusy(false); return; }
    const response = await fetch(`/api/trips/${tripId}/reservations/${reservationId}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, storagePath: path, mimeType: file.type || "application/pdf", size: file.size }) });
    if (!response.ok) { await supabaseBrowser.storage.from("reservation-pdfs").remove([path]); setMessage("파일 정보 저장에 실패했어요."); setBusy(false); return; }
    await load(); setBusy(false);
  };

  const open = async (document: ReservationDocument) => {
    let url = previewUrls[document.id];
    if (!url && supabaseBrowser) { const { data } = await supabaseBrowser.storage.from("reservation-pdfs").createSignedUrl(document.storagePath, 60 * 5); if (data?.signedUrl) url = data.signedUrl; }
    if (!url) { setMessage("파일을 열 수 없어요."); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const remove = async (document: ReservationDocument) => {
    if (!window.confirm(`${document.fileName} 파일을 삭제할까요?`)) return;
    setBusy(true); const response = await fetch(`/api/trips/${tripId}/reservations/${reservationId}/documents?id=${encodeURIComponent(document.id)}`, { method: "DELETE" });
    if (response.ok) { setDocuments((current) => current.filter((item) => item.id !== document.id)); setPreviewUrls((current) => { const next = { ...current }; delete next[document.id]; return next; }); } else setMessage("파일을 삭제하지 못했어요.");
    setBusy(false);
  };

  return <div className="mt-5 border-t border-[var(--color-border)] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold">예약 파일</p><p className="mt-1 text-xs muted">항공권, 호텔, 투어의 사진이나 PDF를 보관해요. 최대 10MB</p></div><label className="cursor-pointer rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold hover:border-[var(--color-primary)]"><input type="file" accept="image/*,application/pdf,.pdf" onChange={upload} disabled={busy} className="sr-only" />{busy ? "처리 중…" : "+ 사진/PDF 추가"}</label></div>{message && <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">{message}</p>}{documents.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2">{documents.map((document) => <div key={document.id} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]"><div className="flex h-40 items-center justify-center bg-white p-2">{previewUrls[document.id] && isImage(document) ? <img src={previewUrls[document.id]} alt={document.fileName} className="h-full w-full object-contain" /> : previewUrls[document.id] ? <iframe src={`${previewUrls[document.id]}#view=FitH`} title={document.fileName} className="h-full w-full" /> : <span className="text-4xl">📄</span>}</div><div className="flex items-center gap-2 border-t border-[var(--color-border)] px-3 py-2"><span className="min-w-0 flex-1 truncate text-xs font-semibold">{document.fileName}</span><button type="button" onClick={() => void open(document)} className="text-xs font-bold text-[var(--color-primary)]">열기</button><button type="button" onClick={() => void remove(document)} className="text-xs font-bold text-[var(--color-danger)]">삭제</button></div></div>)}</div>}</div>;
}

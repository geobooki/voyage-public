"use client";
import { useState } from "react";
import { useTripData } from "@/lib/trip-context";

export function TravelerManager({ ko }: { ko: boolean }) {
  const { state, createTraveler, updateTraveler, removeTraveler } = useTripData();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError("");
    try { await action(); } catch (caught) { setError(caught instanceof Error ? caught.message : "저장하지 못했어요."); } finally { setBusy(false); }
  };
  const control = "min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";
  return <section className="card mt-5 p-4 sm:p-6" id="expense-travelers">
    <h2 className="text-base font-semibold">{ko ? "여행자 관리" : "Travelers"}</h2>
    <p className="mt-1 text-xs muted">{ko ? "이 페이지에서 여행자를 추가하고 이름을 수정할 수 있어요." : "Add and rename travelers here."}</p>
    <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (name.trim()) void run(async () => { await createTraveler(name.trim()); setName(""); }); }}>
      <input required aria-label={ko ? "새 여행자 이름" : "New traveler name"} value={name} onChange={(event) => setName(event.target.value)} placeholder={ko ? "여행자 이름" : "Traveler name"} className={control}/>
      <button disabled={busy} className="shrink-0 rounded-xl bg-[var(--color-primary)] px-4 text-sm text-white disabled:opacity-50">{ko ? "추가" : "Add"}</button>
    </form>
    <div className="mt-3 space-y-2">{state.travelers.map((traveler) => <div key={traveler.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-[var(--color-background)] p-3">
      {editing?.id === traveler.id ? <form className="flex min-w-0 flex-1 flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); if (editing.name.trim()) void run(async () => { await updateTraveler(traveler.id, editing.name.trim()); setEditing(undefined); }); }}>
        <input required aria-label={ko ? "여행자 이름 수정" : "Traveler name"} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className={control}/>
        <button disabled={busy} className="px-2 text-xs text-[var(--color-primary)]">{ko ? "저장" : "Save"}</button>
        <button type="button" onClick={() => setEditing(undefined)} className="px-2 text-xs muted">{ko ? "취소" : "Cancel"}</button>
      </form> : <><span className="min-w-0 flex-1 break-words text-sm">{traveler.name}</span>
        <button type="button" disabled={busy} onClick={() => setEditing({ ...traveler })} className="min-h-9 shrink-0 px-2 text-xs text-[var(--color-primary)]">{ko ? "수정" : "Edit"}</button>
        <button type="button" disabled={busy} onClick={() => void run(() => removeTraveler(traveler.id))} className="min-h-9 shrink-0 px-2 text-xs text-[var(--color-danger)]">{ko ? "삭제" : "Remove"}</button></>}
    </div>)}</div>
    {!state.travelers.length && <p className="mt-3 text-xs muted">{ko ? "여행자를 추가하면 결제자·분담자로 선택할 수 있어요." : "Add travelers to select payers and participants."}</p>}
    {error && <p role="alert" className="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}
  </section>;
}

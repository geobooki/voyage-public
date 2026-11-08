"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "./authenticated-fetch";
import type { SettlementRecords } from "./settlement-records";
const empty: SettlementRecords = { splits: [], payments: [] };
export function useSettlementRecords(tripId: string) {
  const [snapshot, setSnapshot] = useState<{ tripId: string; records: SettlementRecords; loading: boolean; error: string }>({ tripId, records: empty, loading: true, error: "" });
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const generation = ++requestId.current;
    try {
      const response = await authenticatedFetch(`/api/trips/${tripId}/settlements`); const data = await response.json();
      if (!response.ok) throw Error(data.error || "정산 내역을 불러오지 못했어요.");
      if (generation !== requestId.current) return;
      setSnapshot({ tripId, records: data, loading: false, error: "" });
    } catch (caught) { if (generation !== requestId.current) return; setSnapshot((current) => ({ tripId, records: current.tripId === tripId ? current.records : empty, loading: false, error: caught instanceof Error ? caught.message : "정산 오류" })); }
  }, [tripId]);
  useEffect(() => { setSnapshot({ tripId, records: empty, loading: true, error: "" }); void refresh(); const sync = () => { void refresh(); }; window.addEventListener(`voyage:settlements:${tripId}`, sync); window.addEventListener("focus", sync); return () => { window.removeEventListener(`voyage:settlements:${tripId}`, sync); window.removeEventListener("focus", sync); }; }, [tripId, refresh]);
  const mutate = async (payload: Record<string, unknown>, remove = false) => {
    const response = await authenticatedFetch(`/api/trips/${tripId}/settlements${remove ? `?id=${encodeURIComponent(String(payload.id))}` : ""}`, { method: remove ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: remove ? undefined : JSON.stringify(payload) });
    const data = await response.json(); if (!response.ok) throw Error(data.error || "정산을 저장하지 못했어요.");
    await refresh(); window.dispatchEvent(new Event(`voyage:settlements:${tripId}`));
  };
  return { ...(snapshot.tripId === tripId ? snapshot : { records: empty, loading: true, error: "" }), mutate, refresh };
}

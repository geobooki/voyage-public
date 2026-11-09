"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { ExpenseReportView } from "@/app/components/expense-report-view";
import type { ReportSnapshot } from "@/lib/expense-report";
export default function ReportPage() {
  const { tripId } = useParams<{ tripId: string }>(); const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(""); const generation = useRef(0);
  const generate = useCallback(async () => { const id = ++generation.current; setLoading(true); setError(""); try { const response = await authenticatedFetch(`/api/trips/${tripId}/report`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw Error(data.error || "보고서를 생성하지 못했어요."); if (id === generation.current) setSnapshot(data); } catch (caught) { if (id === generation.current) setError(caught instanceof Error ? caught.message : "보고서 오류"); } finally { if (id === generation.current) setLoading(false); } }, [tripId]);
  useEffect(() => { setSnapshot(null); void generate(); return () => { generation.current++; }; }, [generate]);
  return <main className="min-h-screen min-w-0 px-4 py-6 pb-28 sm:px-10"><div className="mx-auto min-w-0 max-w-5xl"><div className="report-no-print mb-5 flex flex-wrap items-center gap-3"><Link href={`/trips/${tripId}/before/budget`} className="text-sm text-[var(--color-primary)]">← 지출 내역</Link><Link href={`/trips/${tripId}/after#settlement`} className="text-sm text-[var(--color-primary)]">정산하기</Link><button type="button" disabled={loading} onClick={() => void generate()} className="ml-auto rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50">{loading ? "생성 중…" : "최신 내역으로 다시 생성"}</button></div>{error && <p role="alert" className="mb-4 rounded-xl border border-[var(--color-danger)] p-4 text-sm">{error}{snapshot ? " 기존 보고서는 아래에 유지됩니다." : ""}</p>}{snapshot && <ExpenseReportView snapshot={snapshot}/>}</div></main>;
}

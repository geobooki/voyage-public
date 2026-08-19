"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { PackingBoard } from "@/app/components/packing-board";
import { usePacking } from "@/lib/packing-context";

export default function BeforePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { items } = usePacking();
  const completed = items.filter((item) => item.checked).length;
  const readiness = items.length ? Math.round((completed / items.length) * 100) : 0;
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href={`/trips/${tripId}`} className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "여행 개요" : "Trip overview"}</Link>
        <p className="eyebrow mt-10 mb-3">{ko ? "여행 전" : "Before the trip"}</p>
        <h1 className="text-4xl font-bold">{ko ? "여행 준비를 시작해요." : "Let’s get ready."}</h1>
        <p className="mt-2 muted">{ko ? "준비물 목록을 중심으로 여행 전 준비를 한곳에서 확인해요." : "Keep your pre-trip preparation focused around one packing list."}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card p-5"><p className="eyebrow mb-2">{ko ? "준비물" : "Packing"}</p><p className="text-2xl font-bold">{completed} / {items.length}</p><p className="mt-1 text-sm muted">{ko ? `${readiness}% 완료` : `${readiness}% ready`}</p></div>
          <Link href={`/trips/${tripId}/before/budget`} className="card p-5 hover:-translate-y-0.5"><p className="eyebrow mb-2">{ko ? "예산" : "Budget"}</p><p className="text-lg font-bold">{ko ? "예산과 환전 관리" : "Budget & exchange"}</p><p className="mt-2 text-sm text-[var(--color-primary)]">{ko ? "열기 →" : "Open →"}</p></Link>
          <Link href={`/trips/${tripId}/before/reservations`} className="card p-5 hover:-translate-y-0.5"><p className="eyebrow mb-2">{ko ? "예약" : "Reservations"}</p><p className="text-lg font-bold">{ko ? "항공·숙박 예약" : "Flights & stays"}</p><p className="mt-2 text-sm text-[var(--color-primary)]">{ko ? "열기 →" : "Open →"}</p></Link>
        </div>
        <div className="mt-8"><PackingBoard compact /></div>
        <Link href={`/trips/${tripId}/before/packing`} className="mt-5 inline-flex rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "준비물 목록 전체 보기 →" : "Open full packing list →"}</Link>
      </div>
    </main>
  );
}

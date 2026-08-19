"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PackingBoard } from "@/app/components/packing-board";
import { useLanguage } from "@/lib/i18n";

export default function PackingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-5xl"><Link href={`/trips/${tripId}/before`} className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "여행 전 개요" : "Before overview"}</Link><div className="mt-8"><PackingBoard /></div></div></main>;
}

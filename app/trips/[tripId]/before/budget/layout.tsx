"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TripDataProvider } from "@/lib/trip-context";

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  return <><nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-10 lg:px-20"><div className="mx-auto flex max-w-4xl gap-5 overflow-auto text-sm font-bold"><Link href={`/trips/${tripId}/before/budget`} className="whitespace-nowrap text-[var(--color-primary)]">예산·실제 사용</Link></div></nav><TripDataProvider tripId={tripId}>{children}</TripDataProvider></>;
}

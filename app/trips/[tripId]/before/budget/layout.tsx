"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TripDataProvider } from "@/lib/trip-context";
import { useTripMeta } from "@/lib/use-trip-meta";

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  const trip = useTripMeta(tripId);
  return <><nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-10 lg:px-20"><div className="mx-auto flex max-w-4xl gap-5 overflow-auto text-sm font-bold"><Link href={`/trips/${tripId}/before/budget`} className="whitespace-nowrap text-[var(--color-primary)]">{trip.tripType === "domestic" ? "가계부" : "예산·실제 사용"}</Link></div></nav><TripDataProvider tripId={tripId} view="budget">{children}</TripDataProvider></>;
}

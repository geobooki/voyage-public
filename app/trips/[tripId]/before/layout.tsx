"use client";

import Link from "next/link";
import { use } from "react";
import { PackingProvider } from "@/lib/packing-context";
import { useTripMeta } from "@/lib/use-trip-meta";

export default function BeforeLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}>) {
  const { tripId } = use(params);
  return <BeforeNavigation tripId={tripId}>
      <PackingProvider tripId={tripId}>{children}</PackingProvider>
    </BeforeNavigation>;
}

function BeforeNavigation({ tripId, children }: { tripId: string; children: React.ReactNode }) {
  const trip = useTripMeta(tripId);
  const international = trip.tripType === "international";
  return (
    <>
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-10 lg:px-20">
        <div className="mx-auto flex max-w-5xl gap-5 overflow-auto text-sm font-bold">
          <Link
            href={`/trips/${tripId}/before`}
            className="whitespace-nowrap text-[var(--color-primary)]"
          >
            Overview
          </Link>
          <Link
            href={`/trips/${tripId}/before/budget`}
            className="whitespace-nowrap muted"
          >
            {international ? "Budget & exchange" : "Expenses"}
          </Link>
          {international && <Link
            href={`/trips/${tripId}/before/reservations`}
            className="whitespace-nowrap muted"
          >
            Reservations
          </Link>}
          <Link
            href={`/trips/${tripId}/before/packing`}
            className="whitespace-nowrap muted"
          >
            Packing
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}

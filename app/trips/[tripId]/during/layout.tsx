"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TripDataProvider } from "@/lib/trip-context";

export default function DuringLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  return <><nav aria-label="여행 중 메뉴" data-section="during-navigation" className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-10 lg:px-20"><div className="mx-auto flex max-w-6xl gap-5 overflow-auto text-sm font-bold"><Link href={`/trips/${tripId}/during`} className="whitespace-nowrap text-[var(--color-primary)]">오늘</Link><Link href={`/trips/${tripId}/during/schedule`} className="whitespace-nowrap muted">일정</Link><Link href={`/trips/${tripId}/during/memories`} className="whitespace-nowrap muted">추억</Link><Link href={`/trips/${tripId}/during/map`} className="whitespace-nowrap muted">지도</Link><Link href={`/trips/${tripId}/during/souvenirs`} className="whitespace-nowrap muted">기념품</Link><Link href={`/trips/${tripId}/during/weather`} className="whitespace-nowrap muted">날씨</Link></div></nav><TripDataProvider tripId={tripId} view="during">{children}</TripDataProvider></>;
}

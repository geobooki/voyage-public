"use client";

import { useParams } from "next/navigation";
import { TripDataProvider } from "@/lib/trip-context";

export default function PreparationLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  return <TripDataProvider tripId={tripId} view="preparation">{children}</TripDataProvider>;
}

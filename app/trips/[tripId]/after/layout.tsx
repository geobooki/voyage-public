"use client";

import { useParams } from "next/navigation";
import { TripDataProvider } from "@/lib/trip-context";

export default function AfterLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  return <TripDataProvider tripId={tripId}>{children}</TripDataProvider>;
}

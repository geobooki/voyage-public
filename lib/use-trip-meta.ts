"use client";

import { useEffect, useState } from "react";

export type TripMeta = {
  title: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
};
const fallback: TripMeta = {
  title: "Your journey",
  city: "",
  country: "",
  startDate: "",
  endDate: "",
};

export function useTripMeta(tripId: string) {
  const [meta, setMeta] = useState<TripMeta>(fallback);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const local = JSON.parse(
          window.localStorage.getItem("voyage:trips") || "[]",
        ).find((item: Record<string, unknown>) => item.id === tripId);
        if (active && local)
          setMeta({
            title: String(local.title || "Your journey"),
            city: String(local.city || ""),
            country: String(local.country || ""),
            startDate: String(local.startDate || ""),
            endDate: String(local.endDate || ""),
          });
        const response = await fetch(`/api/trips/${tripId}`);
        if (!active || !response.ok) return;
        const result = await response.json();
        if (result.trip)
          setMeta({
            title: String(result.trip.title || "Your journey"),
            city: String(result.trip.city || ""),
            country: String(result.trip.country || ""),
            startDate: String(result.trip.start_date || ""),
            endDate: String(result.trip.end_date || ""),
          });
      } catch {
        /* keep the current blank/local state */
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [tripId]);
  return meta;
}

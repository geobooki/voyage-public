"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { authenticatedFetch } from "@/lib/authenticated-fetch";

export type TripMeta = {
  title: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  destinationCurrency: string;
  tripType: "domestic" | "international";
};
const fallback: TripMeta = {
  title: "Your journey",
  city: "",
  country: "",
  startDate: "",
  endDate: "",
  destinationCurrency: "KRW",
  tripType: "domestic",
};

export function useTripMeta(tripId: string) {
  const { user } = useAuth();
  const [meta, setMeta] = useState<TripMeta>(fallback);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const local = user ? JSON.parse(
          window.localStorage.getItem("voyage:trips") || "[]",
        ).find((item: Record<string, unknown>) => item.id === tripId) : null;
        if (active && local)
          setMeta({
            title: String(local.title || "Your journey"),
            city: String(local.city || ""),
            country: String(local.country || ""),
            startDate: String(local.startDate || ""),
            endDate: String(local.endDate || ""),
            destinationCurrency: String(local.destinationCurrency || "JPY"),
            tripType: local.tripType === "domestic" || local.tripType === "international" ? local.tripType : (local.destinationCurrency === "KRW" ? "domestic" : "international"),
          });
        const response = await authenticatedFetch(`/api/trips/${tripId}`);
        if (!active || !response.ok) return;
        const result = await response.json();
        if (result.trip)
          setMeta({
            title: String(result.trip.title || "Your journey"),
            city: String(result.trip.city || ""),
            country: String(result.trip.country || ""),
            startDate: String(result.trip.start_date || ""),
            endDate: String(result.trip.end_date || ""),
            destinationCurrency: String(result.trip.destination_currency || "KRW"),
            tripType: result.trip.trip_type === "domestic" || result.trip.trip_type === "international" ? result.trip.trip_type : (result.trip.destination_currency === "KRW" ? "domestic" : "international"),
          });
      } catch {
        /* keep the current blank/local state */
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [tripId, user]);
  return meta;
}

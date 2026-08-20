"use client";

import { createContext, useContext } from "react";
import { useTripStore } from "@/lib/trip-store";

type TripStore = ReturnType<typeof useTripStore>;
const TripDataContext = createContext<TripStore | null>(null);

export function TripDataProvider({
  tripId,
  view = "full",
  children,
}: {
  tripId: string;
  view?: string;
  children: React.ReactNode;
}) {
  const store = useTripStore(tripId, view);
  return (
    <TripDataContext.Provider value={store}>
      {children}
    </TripDataContext.Provider>
  );
}

export function useTripData() {
  const value = useContext(TripDataContext);
  if (!value)
    throw new Error("useTripData must be used inside TripDataProvider");
  return value;
}

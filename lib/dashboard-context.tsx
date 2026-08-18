"use client";

import { createContext, useContext } from "react";
import type { DashboardItem, TripState } from "@/types/trip";

type DashboardStore = {
  state: TripState;
  addDashboardItem: (item: Omit<DashboardItem, "id">) => void;
  removeDashboardItem: (itemId: string) => void;
};
const DashboardContext = createContext<DashboardStore | null>(null);

export function DashboardProvider({ store, children }: { store: DashboardStore; children: React.ReactNode }) {
  return <DashboardContext.Provider value={store}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboard must be used inside DashboardProvider");
  return value;
}

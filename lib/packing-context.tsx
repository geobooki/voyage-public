"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ChecklistCategory, ChecklistItem } from "@/types/trip";

type PackingState = {
  items: ChecklistItem[];
  categories: ChecklistCategory[];
  loading: boolean;
};

type PackingContextValue = PackingState & {
  toggleItem: (id: string) => void;
  addItem: (item: Omit<ChecklistItem, "id">) => void;
  removeItem: (id: string) => void;
  addCategory: (category: Omit<ChecklistCategory, "id">) => void;
  updateCategory: (id: string, changes: Omit<ChecklistCategory, "id">) => void;
  updateCategories: (categories: ChecklistCategory[]) => void;
  removeCategory: (id: string) => void;
};

const defaultCategory: ChecklistCategory = {
  id: "cat-general",
  name: "기타",
  color: "#FEF3C7",
};

const PackingContext = createContext<PackingContextValue | null>(null);

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `packing-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const categoryColors = ["#D9F99D", "#BAE6FD", "#DDD6FE", "#FBCFE8", "#BBF7D0", "#FED7AA"];
const randomCategoryColor = () => categoryColors[Math.floor(Math.random() * categoryColors.length)];

export function PackingProvider({
  tripId,
  children,
}: {
  tripId: string;
  children: React.ReactNode;
}) {
  const storageKey = `voyage:packing:${tripId}`;
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [categories, setCategories] = useState<ChecklistCategory[]>([
    defaultCategory,
  ]);
  const [loading, setLoading] = useState(true);

  const persist = (nextItems: ChecklistItem[], nextCategories: ChecklistCategory[]) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ items: nextItems, categories: nextCategories }),
    );
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const saved = window.localStorage.getItem(storageKey);
        const legacy = window.localStorage.getItem(`voyage:trip:${tripId}`);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<PackingState>;
          if (active) {
            setItems(Array.isArray(parsed.items) ? parsed.items : []);
            setCategories(
              Array.isArray(parsed.categories) && parsed.categories.length
                ? parsed.categories
                : [defaultCategory],
            );
          }
        } else if (legacy) {
          const parsed = JSON.parse(legacy) as {
            packing?: ChecklistItem[];
            packingCategories?: ChecklistCategory[];
          };
          if (active) {
            const nextItems = parsed.packing ?? [];
            const nextCategories = parsed.packingCategories?.length
              ? parsed.packingCategories
              : [defaultCategory];
            setItems(nextItems);
            setCategories(nextCategories);
            persist(nextItems, nextCategories);
          }
        }
        const response = await fetch(`/api/trips/${tripId}/packing`);
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        const nextItems = Array.isArray(data.items) ? data.items : [];
        const nextCategories = Array.isArray(data.categories) && data.categories.length
          ? data.categories
          : [defaultCategory];
        // Do not replace an existing local list with an empty remote response
        // while the Supabase checklist tables are still empty or unavailable.
        if (saved && nextItems.length === 0 && nextCategories.length === 1 && nextCategories[0].id === defaultCategory.id) return;
        setItems(nextItems);
        setCategories(nextCategories);
        persist(nextItems, nextCategories);
      } catch {
        // Local storage remains the fallback when Supabase is unavailable.
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [storageKey, tripId]);

  const sync = (resource: string, body: Record<string, unknown>, method = "POST") => {
    void fetch(`/api/trips/${tripId}/${resource}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  };

  const value = useMemo<PackingContextValue>(() => ({
    items,
    categories,
    loading,
    toggleItem: (itemId) => {
      const changed = items.find((item) => item.id === itemId);
      if (!changed) return;
      const nextItems = items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      );
      setItems(nextItems);
      persist(nextItems, categories);
      sync("checklist", { ...changed, checked: !changed.checked, kind: "packing" }, "PATCH");
    },
    addItem: (item) => {
      const next = { ...item, id: makeId() };
      const nextItems = [...items, next];
      setItems(nextItems);
      persist(nextItems, categories);
      sync("checklist", { ...next, kind: "packing" });
    },
    removeItem: (itemId) => {
      const nextItems = items.filter((item) => item.id !== itemId);
      setItems(nextItems);
      persist(nextItems, categories);
      void fetch(`/api/trips/${tripId}/checklist?id=${encodeURIComponent(itemId)}`, { method: "DELETE" }).catch(() => undefined);
    },
    addCategory: (category) => {
      const next = { ...category, color: category.color || randomCategoryColor(), id: makeId() };
      const nextCategories = [...categories, next];
      setCategories(nextCategories);
      persist(items, nextCategories);
      sync("checklist-categories", { ...next, kind: "packing" });
    },
    updateCategory: (categoryId, changes) => {
      const previous = categories.find((category) => category.id === categoryId);
      if (!previous) return;
      const nextCategories = categories.map((category) =>
        category.id === categoryId ? { ...changes, id: categoryId } : category,
      );
      const nextItems = items.map((item) =>
        item.category === previous.name ? { ...item, category: changes.name } : item,
      );
      setCategories(nextCategories);
      setItems(nextItems);
      persist(nextItems, nextCategories);
      sync("checklist-categories", { ...changes, id: categoryId, kind: "packing" }, "PATCH");
    },
    updateCategories: (nextCategories) => {
      const previousCategories = categories;
      const nextItems = items.map((item) => {
        const renamed = nextCategories.find((next) =>
          previousCategories.some((previous) => previous.id === next.id && previous.name === item.category),
        );
        return renamed ? { ...item, category: renamed.name } : item;
      });
      setCategories(nextCategories);
      setItems(nextItems);
      persist(nextItems, nextCategories);
      nextCategories.forEach((category) => sync("checklist-categories", { ...category, kind: "packing" }, "PATCH"));
      nextItems.forEach((item) => {
        const previous = items.find((current) => current.id === item.id);
        if (previous && previous.category !== item.category) sync("checklist", { ...item, kind: "packing" }, "PATCH");
      });
    },
    removeCategory: (categoryId) => {
      const category = categories.find((item) => item.id === categoryId);
      if (!category || categories.length === 1) return;
      const nextCategories = categories.filter((item) => item.id !== categoryId);
      const fallback = nextCategories[0]?.name ?? "기타";
      const nextItems = items.map((item) =>
        item.category === category.name ? { ...item, category: fallback } : item,
      );
      setCategories(nextCategories);
      setItems(nextItems);
      persist(nextItems, nextCategories);
      void fetch(`/api/trips/${tripId}/checklist-categories?id=${encodeURIComponent(categoryId)}`, { method: "DELETE" }).catch(() => undefined);
    },
  }), [categories, items, loading, tripId]);

  return <PackingContext.Provider value={value}>{children}</PackingContext.Provider>;
}

export function usePacking() {
  const value = useContext(PackingContext);
  if (!value) throw new Error("usePacking must be used inside PackingProvider");
  return value;
}

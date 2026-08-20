"use client";

import { useEffect, useState } from "react";
import type {
  BudgetItem,
  ChecklistItem,
  Expense,
  ExchangePlan,
  Place,
  Reservation,
  ScheduleItem,
  Souvenir,
  TripState,
  ChecklistCategory,
  DashboardItem,
} from "@/types/trip";

const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
const sync = (
  tripId: string,
  resource: string,
  payload: Record<string, unknown>,
  method: "POST" | "PATCH" = "POST",
) => {
  void fetch(`/api/trips/${tripId}/${resource}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
};
/* Legacy demo state intentionally removed. User-created trips start blank.
const initial: TripState = {
  dashboardItems: [],
  packingCategories: [
    { id: "cat-basics", name: "Basics", color: "#FEF3C7" },
    { id: "cat-clothing", name: "Clothing", color: "#DBEAFE" },
    { id: "cat-tech", name: "Tech", color: "#E0E7FF" },
    { id: "cat-toiletries", name: "Toiletries", color: "#FCE7F3" },
  ],
  packing: ["Passport", "Charger", "Comfortable shoes", "Toiletries"].map(
    (name, i) => ({
      id: `pack-${i}`,
      name,
      category: "Basics",
      checked: i === 0,
    }),
  ),
  preparation: [
    {
      id: "prep-1",
      name: "Activate eSIM",
      category: "Before you go",
      checked: false,
    },
    {
      id: "prep-2",
      name: "Travel insurance",
      category: "Before you go",
      checked: true,
    },
    {
      id: "prep-3",
      name: "Exchange some cash",
      category: "Money",
      checked: false,
    },
  ],
  budget: [
    {
      id: "bud-1",
      name: "항공권",
      category: "항공",
      amount: 620000,
      currency: "KRW",
      paymentMethod: "카드",
    },
    {
      id: "bud-2",
      name: "K5 호텔",
      category: "숙박",
      amount: 840000,
      currency: "KRW",
      paymentMethod: "카드",
    },
    {
      id: "bud-3",
      name: "아침 식사",
      category: "식비",
      amount: 420000,
      currency: "KRW",
      paymentMethod: "현금",
    },
    {
      id: "bud-4",
      name: "팀랩 티켓",
      category: "활동",
      amount: 300000,
      currency: "KRW",
      paymentMethod: "카드",
    },
  ],
  budgetCategories: ["항공", "숙박", "교통", "식비", "쇼핑", "활동", "기타"],
  paymentMethods: ["카드", "현금", "송금"],
  reservations: [
    {
      id: "res-1",
      title: "K5 Hotel",
      type: "Stay",
      date: "2026-09-10",
      time: "15:00",
      location: "Nihombashi, Tokyo",
      reservationNumber: "K5TOKYO",
      cost: 840000,
      memo: "Booking.com",
      link: "",
    },
  ],
  places: [
    {
      id: "place-1",
      name: "Tsukiji Outer Market",
      type: "Restaurant",
      address: "4 Chome-16-2 Tsukiji",
      latitude: 35.6655,
      longitude: 139.7708,
      expectedCost: 5000,
      visitDate: "2026-09-10",
      mustGo: false,
      visited: false,
      memo: "Breakfast",
    },
    {
      id: "place-2",
      name: "TeamLab Borderless",
      type: "Activity",
      address: "Azabudai Hills",
      latitude: 35.6626,
      longitude: 139.7388,
      expectedCost: 3800,
      visitDate: "2026-09-10",
      mustGo: true,
      visited: false,
      memo: "Tickets booked",
    },
    {
      id: "place-3",
      name: "Shibuya Sky",
      type: "Sightseeing",
      address: "Shibuya Scramble Square",
      latitude: 35.658,
      longitude: 139.7016,
      expectedCost: 2500,
      visitDate: "2026-09-10",
      mustGo: true,
      visited: false,
      memo: "Sunset view",
    },
  ],
  schedule: [
    {
      id: "sch-1",
      date: "2026-09-10",
      title: "Breakfast at Tsukiji",
      time: "09:00",
      type: "Food",
      placeId: "place-1",
      note: "",
      completed: false,
    },
    {
      id: "sch-2",
      date: "2026-09-10",
      title: "TeamLab Borderless",
      time: "11:30",
      type: "Activity",
      placeId: "place-2",
      note: "Must Go",
      completed: false,
    },
    {
      id: "sch-3",
      date: "2026-09-10",
      title: "Check in at K5 Hotel",
      time: "15:00",
      type: "Stay",
      note: "",
      completed: false,
    },
  ],
  expenses: [
    {
      id: "exp-1",
      amount: 2500,
      currency: "JPY",
      category: "Food",
      placeId: "place-1",
      payerId: "traveler-1",
      memo: "Breakfast",
      date: "2026-09-10",
      time: "08:30",
    },
  ],
  travelers: [
    { id: "traveler-1", name: "Minji" },
    { id: "traveler-2", name: "Jisu" },
  ],
  souvenirs: [
    {
      id: "sou-1",
      name: "Ceramic ramen bowl",
      estimatedPrice: 2800,
      purchased: false,
      actualPrice: 0,
      memo: "Kappabashi",
    },
    {
      id: "sou-2",
      name: "Matcha KitKat",
      estimatedPrice: 900,
      purchased: true,
      actualPrice: 780,
      memo: "Airport",
    },
  ],
  exchange: {
    from: "KRW",
    to: "JPY",
    rate: 0.11,
    expectedCash: 80000,
    cardEstimate: 120000,
    plannedExchange: 90000,
    actualExchange: 0,
  },
  weather: [
    { date: "2026-09-10", temperature: 28, condition: "Sunny", icon: "☀" },
    { date: "2026-09-11", temperature: 24, condition: "Cloudy", icon: "☁" },
    {
      date: "2026-09-12",
      temperature: 26,
      condition: "Light rain",
      icon: "🌦",
    },
  ],
  review: {
    rating: 0,
    comment: "",
    goodThings: "",
    badThings: "",
    revisitPlaces: "",
  },
};
*/

const blankState = (): TripState => ({
  dashboardItems: [],
  packingCategories: [{ id: "cat-general", name: "기타", color: "#FEF3C7" }],
  packing: [],
  preparation: [],
  budget: [],
  budgetCategories: ["항공", "숙박", "교통", "식비", "쇼핑", "활동", "기타"],
  paymentMethods: ["카드", "현금", "송금"],
  reservationCategories: ["Flight", "Stay", "Tour", "Transport", "Activity", "Other"],
  reservations: [],
  places: [],
  schedule: [],
  expenses: [],
  travelers: [],
  souvenirs: [],
  exchange: {
    from: "KRW",
    to: "JPY",
    rate: 0,
    expectedCash: 0,
    cardEstimate: 0,
    plannedExchange: 0,
    actualExchange: 0,
  },
  weather: [],
  review: {
    rating: 0,
    comment: "",
    goodThings: "",
    badThings: "",
    revisitPlaces: "",
  },
});

export function useTripStore(tripId = "tokyo") {
  const key = `voyage:trip:${tripId}`;
  const [state, setState] = useState<TripState>(blankState());
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setState(blankState());
    setHydrated(false);
    try {
      const saved = window.localStorage.getItem(key);
      if (saved)
        setState((current) => {
          const parsed = JSON.parse(saved) as Partial<TripState>;
          return {
            ...current,
            ...parsed,
            places:
              parsed.places?.map((item) => ({
                ...item,
                expectedCost: Number(item.expectedCost ?? 0),
                visitDate: item.visitDate || undefined,
              })) ?? current.places,
            expenses:
              parsed.expenses?.map((item) => ({
                ...item,
                time: item.time || "12:00",
              })) ?? current.expenses,
            schedule:
              parsed.schedule?.map((item) => ({
                ...item,
                date: item.date || current.weather[0]?.date || "2026-09-10",
              })) ?? current.schedule,
          };
        });
    } catch {
      /* demo fallback */
    }
    fetch(`/api/trips/${tripId}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!data) return;
        const remoteReservations = (
          data.reservations as Record<string, unknown>[] | undefined
        )?.map(
          (item: Record<string, unknown>) => ({
            id: String(item.id),
            title: String(item.title),
            type: String(item.type),
            date: String(item.date ?? "").slice(0, 10),
            endDate: item.end_date ? String(item.end_date).slice(0, 10) : undefined,
            time: item.time ? String(item.time).slice(0, 5) : undefined,
            location: item.location ? String(item.location) : undefined,
            departureLocation: item.departure_location ? String(item.departure_location) : undefined,
            arrivalLocation: item.arrival_location ? String(item.arrival_location) : undefined,
            departureTime: item.departure_time ? String(item.departure_time).slice(0, 5) : undefined,
            arrivalTime: item.arrival_time ? String(item.arrival_time).slice(0, 5) : undefined,
            airline: item.airline ? String(item.airline) : undefined,
            terminal: item.terminal ? String(item.terminal) : undefined,
            reservationNumber: item.reservation_number
              ? String(item.reservation_number)
              : undefined,
            cost: Number(item.cost ?? 0),
            memo: String(item.memo ?? ""),
            link: item.link ? String(item.link) : undefined,
          }),
        );
        setState((current) => ({
          ...current,
          places: data.places?.length
            ? data.places.map((item: Record<string, unknown>) => ({
                id: String(item.id),
                name: String(item.name),
                type: String(item.type ?? "other"),
                address: String(item.address ?? ""),
                latitude:
                  item.latitude == null ? undefined : Number(item.latitude),
                longitude:
                  item.longitude == null ? undefined : Number(item.longitude),
                expectedCost: Number(item.expected_cost ?? 0),
                visitDate: item.visit_date
                  ? String(item.visit_date)
                  : undefined,
                mustGo: Boolean(item.must_go),
                visited: Boolean(item.visited),
                memo: String(item.memo ?? ""),
              }))
            : current.places,
          packing: data.checklist?.filter(
            (item: Record<string, unknown>) => item.kind === "packing",
          ).length
            ? data.checklist
                .filter(
                  (item: Record<string, unknown>) => item.kind === "packing",
                )
                .map((item: Record<string, unknown>) => ({
                  id: String(item.id),
                  name: String(item.name),
                  category: String(item.category ?? "General"),
                  checked: Boolean(item.checked),
                }))
            : current.packing,
          packingCategories: data.categories?.length
            ? data.categories.map((item: Record<string, unknown>) => ({
                id: String(item.id),
                name: String(item.name),
                color: String(item.color ?? "#FEF3C7"),
              }))
            : current.packingCategories,
          preparation: data.checklist?.filter(
            (item: Record<string, unknown>) => item.kind === "preparation",
          ).length
            ? data.checklist
                .filter(
                  (item: Record<string, unknown>) =>
                    item.kind === "preparation",
                )
                .map((item: Record<string, unknown>) => ({
                  id: String(item.id),
                  name: String(item.name),
                  category: String(item.category ?? "General"),
                  checked: Boolean(item.checked),
                }))
            : current.preparation,
          expenses:
            data.expenses?.map((item: Record<string, unknown>) => ({
              id: String(item.id),
              amount: Number(item.amount),
              currency: String(item.currency),
              category: String(item.category),
              placeId: item.place_id ? String(item.place_id) : undefined,
              payerId: item.payer_id ? String(item.payer_id) : undefined,
              memo: String(item.memo ?? ""),
              date: String(item.spent_at ?? "").slice(0, 10),
              time: String(item.spent_at ?? "").slice(11, 16),
              krwAmount: item.krw_amount == null ? undefined : Number(item.krw_amount),
            })) ?? current.expenses,
          travelers:
            data.travelers?.map((item: Record<string, unknown>) => ({
              id: String(item.id),
              name: String(item.name),
            })) ?? current.travelers,
          schedule: data.schedule?.length
            ? data.schedule.map((item: Record<string, unknown>) => ({
                id: String(item.id),
                date: String(item.date ?? ""),
                title: String(item.title),
                time: String(item.time ?? ""),
                type: String(item.type),
                placeId: item.place_id ? String(item.place_id) : undefined,
                note: String(item.note ?? ""),
                completed: Boolean(item.completed),
              }))
            : current.schedule,
          reservations: remoteReservations?.length
            ? [
                ...current.reservations.filter(
                  (local) =>
                    !remoteReservations.some((remote) => remote.id === local.id),
                ),
                ...remoteReservations,
              ]
            : current.reservations,
          souvenirs:
            data.souvenirs?.map((item: Record<string, unknown>) => ({
              id: String(item.id),
              name: String(item.name),
              estimatedPrice: Number(item.estimated_price),
              purchased: Boolean(item.purchased),
              actualPrice: Number(item.actual_price),
              memo: String(item.memo ?? ""),
            })) ?? current.souvenirs,
          weather:
            data.weather?.map((item: Record<string, unknown>) => ({
              date: String(item.date),
              temperature: Number(item.temperature),
              condition: String(item.condition ?? ""),
              icon: String(item.icon ?? "☀"),
            })) ?? current.weather,
          budget: data.budget?.length
            ? data.budget.map((item: Record<string, unknown>) => ({
                id: String(item.id),
                name: item.name ? String(item.name) : undefined,
                detail: item.detail ? String(item.detail) : undefined,
                category: String(item.category),
                amount: Number(item.estimated_amount),
                currency: String(item.currency ?? "KRW"),
                paymentMethod: item.payment_method
                  ? String(item.payment_method)
                  : undefined,
              }))
            : current.budget,
          review: data.review
            ? {
                rating: Number(data.review.rating ?? 0),
                comment: String(data.review.comment ?? ""),
                goodThings: String(data.review.good_things ?? ""),
                badThings: String(data.review.bad_things ?? ""),
                revisitPlaces: String(data.review.revisit_places ?? ""),
              }
            : current.review,
          exchange: data.exchange
            ? {
                from: String(data.exchange.from_currency ?? "KRW"),
                to: String(data.exchange.to_currency ?? "JPY"),
                rate: Number(data.exchange.rate ?? 0),
                expectedCash: Number(data.exchange.expected_cash ?? 0),
                cardEstimate: Number(data.exchange.card_estimate ?? 0),
                plannedExchange: Number(data.exchange.planned_exchange ?? 0),
                actualExchange: Number(data.exchange.actual_exchange ?? 0),
              }
            : data.trip?.destination_currency
              ? { ...current.exchange, to: String(data.trip.destination_currency) }
              : current.exchange,
          dashboardItems: data.dashboard?.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            kind: String(item.kind) as DashboardItem["kind"],
            title: String(item.title),
            detail: item.detail ? String(item.detail) : undefined,
            url: item.url ? String(item.url) : undefined,
          })) ?? current.dashboardItems,
        }));
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, [tripId]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(key, JSON.stringify(state));
  }, [state, hydrated]);
  const update = (fn: (current: TripState) => TripState) =>
    setState((current) => fn(current));
  const toggleChecklist = (list: "packing" | "preparation", itemId: string) =>
    update((s) => {
      const next = s[list].map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      );
      const changed = next.find((item) => item.id === itemId);
      if (changed)
        sync(tripId, "checklist", { ...changed, kind: list }, "PATCH");
      return { ...s, [list]: next };
    });
  const addChecklist = (
    list: "packing" | "preparation",
    item: Omit<ChecklistItem, "id">,
  ) => {
    const next = { ...item, id: id() };
    update((s) => ({ ...s, [list]: [...s[list], next] }));
    sync(tripId, "checklist", { ...next, kind: list });
  };
  const removeChecklist = (list: "packing" | "preparation", itemId: string) => {
    update((s) => ({
      ...s,
      [list]: s[list].filter((item) => item.id !== itemId),
    }));
    void fetch(
      `/api/trips/${tripId}/checklist?id=${encodeURIComponent(itemId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  };
  const updateChecklistCategory = (
    list: "packing" | "preparation",
    itemId: string,
    category: string,
  ) => {
    update((s) => ({
      ...s,
      [list]: s[list].map((item) =>
        item.id === itemId ? { ...item, category } : item,
      ),
    }));
    const changed = state[list].find((item) => item.id === itemId);
    if (changed)
      sync(tripId, "checklist", { ...changed, category, kind: list }, "PATCH");
  };
  const renameChecklistCategory = (
    list: "packing" | "preparation",
    from: string,
    to: string,
  ) =>
    update((s) => ({
      ...s,
      [list]: s[list].map((item) =>
        item.category === from ? { ...item, category: to } : item,
      ),
    }));
  const removeChecklistCategory = (
    list: "packing" | "preparation",
    category: string,
  ) =>
    update((s) => ({
      ...s,
      [list]: s[list].map((item) =>
        item.category === category ? { ...item, category: "기타" } : item,
      ),
    }));
  const addPackingCategory = (category: Omit<ChecklistCategory, "id">) => {
    const next = { ...category, id: id() };
    update((s) => ({ ...s, packingCategories: [...s.packingCategories, next] }));
    sync(tripId, "checklist-categories", { ...next, kind: "packing" });
  };
  const updatePackingCategory = (categoryId: string, changes: Omit<ChecklistCategory, "id">) => {
    update((s) => {
      const previous = s.packingCategories.find((item) => item.id === categoryId);
      if (!previous) return s;
      return {
        ...s,
        packingCategories: s.packingCategories.map((item) => item.id === categoryId ? { ...changes, id: categoryId } : item),
        packing: s.packing.map((item) => item.category === previous.name ? { ...item, category: changes.name } : item),
      };
    });
    sync(tripId, "checklist-categories", { ...changes, id: categoryId, kind: "packing" }, "PATCH");
  };
  const removePackingCategory = (categoryId: string) => {
    update((s) => {
      const category = s.packingCategories.find((item) => item.id === categoryId);
      if (!category) return s;
      return {
        ...s,
        packingCategories: s.packingCategories.filter((item) => item.id !== categoryId),
        packing: s.packing.map((item) => item.category === category.name ? { ...item, category: "기타" } : item),
      };
    });
    void fetch(`/api/trips/${tripId}/checklist-categories?id=${encodeURIComponent(categoryId)}`, { method: "DELETE" }).catch(() => undefined);
  };
  const addPlace = (place: Omit<Place, "id">) => {
    const next = { ...place, id: id() };
    update((s) => ({ ...s, places: [...s.places, next] }));
    sync(tripId, "places", next);
  };
  const addSchedule = (schedule: Omit<ScheduleItem, "id">) => {
    const next = { ...schedule, id: id() };
    update((s) => ({ ...s, schedule: [...s.schedule, next] }));
    sync(tripId, "schedule", next);
  };
  const updateSchedule = (
    scheduleId: string,
    changes: Omit<ScheduleItem, "id">,
  ) => {
    update((s) => ({
      ...s,
      schedule: s.schedule.map((item) =>
        item.id === scheduleId ? { ...changes, id: scheduleId } : item,
      ),
    }));
    sync(tripId, "schedule", { ...changes, id: scheduleId }, "PATCH");
  };
  const removeSchedule = (scheduleId: string) => {
    update((s) => ({
      ...s,
      schedule: s.schedule.filter((item) => item.id !== scheduleId),
    }));
    void fetch(
      `/api/trips/${tripId}/schedule?id=${encodeURIComponent(scheduleId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  };
  const toggleScheduleComplete = (scheduleId: string) =>
    update((s) => {
      const next = s.schedule.map((item) =>
        item.id === scheduleId ? { ...item, completed: !item.completed } : item,
      );
      const changed = next.find((item) => item.id === scheduleId);
      if (changed) sync(tripId, "schedule", changed, "PATCH");
      return { ...s, schedule: next };
    });
  const togglePlace = (placeId: string, field: "mustGo" | "visited") =>
    update((s) => {
      const next = s.places.map((p) =>
        p.id === placeId ? { ...p, [field]: !p[field] } : p,
      );
      const changed = next.find((place) => place.id === placeId);
      if (changed) sync(tripId, "places", changed, "PATCH");
      return { ...s, places: next };
    });
  const addExpense = (expense: Omit<Expense, "id">) => {
    const next = { ...expense, id: id() };
    update((s) => ({ ...s, expenses: [...s.expenses, next] }));
    void fetch(`/api/trips/${tripId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => undefined);
  };
  const addTraveler = (name: string) => {
    const next = { id: id(), name };
    update((s) => ({ ...s, travelers: [...s.travelers, next] }));
    void fetch(`/api/trips/${tripId}/travelers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => undefined);
  };
  const addReservation = (reservation: Omit<Reservation, "id">) => {
    const next = { ...reservation, id: id() };
    update((s) => ({ ...s, reservations: [...s.reservations, next] }));
    sync(tripId, "reservations", next);
    return next.id;
  };
  const updateReservation = (reservationId: string, changes: Omit<Reservation, "id">) => {
    update((s) => ({
      ...s,
      reservations: s.reservations.map((item) =>
        item.id === reservationId ? { ...changes, id: reservationId } : item,
      ),
    }));
    sync(tripId, "reservations", { ...changes, id: reservationId }, "PATCH");
  };
  const removeReservation = (reservationId: string) => {
    update((s) => ({
      ...s,
      reservations: s.reservations.filter((item) => item.id !== reservationId),
    }));
    void fetch(
      `/api/trips/${tripId}/reservations?id=${encodeURIComponent(reservationId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  };
  const addReservationCategory = (name: string) =>
    update((s) =>
      s.reservationCategories.includes(name)
        ? s
        : { ...s, reservationCategories: [...s.reservationCategories, name] },
    );
  const renameReservationCategory = (from: string, to: string) =>
    update((s) => ({
      ...s,
      reservationCategories: s.reservationCategories.map((item) => item === from ? to : item),
      reservations: s.reservations.map((item) => item.type === from ? { ...item, type: to } : item),
    }));
  const removeReservationCategory = (name: string) =>
    update((s) => ({
      ...s,
      reservationCategories: s.reservationCategories.filter((item) => item !== name),
    }));
  const addBudget = (budget: Omit<BudgetItem, "id">) => {
    const next = { ...budget, id: id() };
    update((s) => ({ ...s, budget: [...s.budget, next] }));
    sync(tripId, "budget", next);
  };
  const updateBudget = (budgetId: string, changes: Omit<BudgetItem, "id">) => {
    update((s) => ({
      ...s,
      budget: s.budget.map((item) =>
        item.id === budgetId ? { ...changes, id: budgetId } : item,
      ),
    }));
    sync(tripId, "budget", { ...changes, id: budgetId }, "PATCH");
  };
  const addBudgetCategory = (name: string) =>
    update((s) =>
      s.budgetCategories.includes(name)
        ? s
        : { ...s, budgetCategories: [...s.budgetCategories, name] },
    );
  const renameBudgetCategory = (from: string, to: string) =>
    update((s) => ({
      ...s,
      budgetCategories: s.budgetCategories.map((item) =>
        item === from ? to : item,
      ),
      budget: s.budget.map((item) =>
        item.category === from ? { ...item, category: to } : item,
      ),
    }));
  const removeBudgetCategory = (name: string) =>
    update((s) => ({
      ...s,
      budgetCategories: s.budgetCategories.filter((item) => item !== name),
    }));
  const addPaymentMethod = (name: string) =>
    update((s) =>
      s.paymentMethods.includes(name)
        ? s
        : { ...s, paymentMethods: [...s.paymentMethods, name] },
    );
  const renamePaymentMethod = (from: string, to: string) =>
    update((s) => ({
      ...s,
      paymentMethods: s.paymentMethods.map((item) =>
        item === from ? to : item,
      ),
      budget: s.budget.map((item) =>
        item.paymentMethod === from ? { ...item, paymentMethod: to } : item,
      ),
    }));
  const removePaymentMethod = (name: string) =>
    update((s) => ({
      ...s,
      paymentMethods: s.paymentMethods.filter((item) => item !== name),
    }));
  const removeBudget = (budgetId: string) => {
    update((s) => ({
      ...s,
      budget: s.budget.filter((item) => item.id !== budgetId),
    }));
    void fetch(
      `/api/trips/${tripId}/budget?id=${encodeURIComponent(budgetId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  };
  const addSouvenir = (souvenir: Omit<Souvenir, "id">) => {
    const next = { ...souvenir, id: id() };
    update((s) => ({ ...s, souvenirs: [...s.souvenirs, next] }));
    sync(tripId, "souvenirs", next);
  };
  const toggleSouvenir = (souvenirId: string) =>
    update((s) => {
      const next = s.souvenirs.map((item) =>
        item.id === souvenirId ? { ...item, purchased: !item.purchased } : item,
      );
      const changed = next.find((item) => item.id === souvenirId);
      if (changed) sync(tripId, "souvenirs", { ...changed }, "PATCH");
      return { ...s, souvenirs: next };
    });
  const removeSouvenir = (souvenirId: string) => {
    update((s) => ({
      ...s,
      souvenirs: s.souvenirs.filter((item) => item.id !== souvenirId),
    }));
    void fetch(
      `/api/trips/${tripId}/souvenirs?id=${encodeURIComponent(souvenirId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  };
  const saveExchange = (exchange: ExchangePlan) => {
    update((s) => ({ ...s, exchange }));
    sync(tripId, "exchange", exchange);
  };
  const saveReview = (review: TripState["review"]) => {
    update((s) => ({ ...s, review }));
    sync(tripId, "review", review);
  };
  const addDashboardItem = (item: Omit<DashboardItem, "id">) => {
    const next = { ...item, id: id() };
    update((s) => ({ ...s, dashboardItems: [...s.dashboardItems, next] }));
    sync(tripId, "dashboard", next);
  };
  const removeDashboardItem = (itemId: string) => {
    update((s) => ({ ...s, dashboardItems: s.dashboardItems.filter((item) => item.id !== itemId) }));
    void fetch(`/api/trips/${tripId}/dashboard?id=${encodeURIComponent(itemId)}`, { method: "DELETE" }).catch(() => undefined);
  };
  return {
    state,
    toggleChecklist,
    addChecklist,
    removeChecklist,
    updateChecklistCategory,
    renameChecklistCategory,
    removeChecklistCategory,
    addPackingCategory,
    updatePackingCategory,
    removePackingCategory,
    addPlace,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleScheduleComplete,
    togglePlace,
    addExpense,
    addTraveler,
    addReservation,
    updateReservation,
    removeReservation,
    addReservationCategory,
    renameReservationCategory,
    removeReservationCategory,
    addBudget,
    updateBudget,
    removeBudget,
    addBudgetCategory,
    renameBudgetCategory,
    removeBudgetCategory,
    addPaymentMethod,
    renamePaymentMethod,
    removePaymentMethod,
    addSouvenir,
    toggleSouvenir,
    removeSouvenir,
    saveExchange,
    saveReview,
    addDashboardItem,
    removeDashboardItem,
  };
}

import type { Expense, Traveler } from "@/types/trip";
export type ExpenseGrouping = "time" | "date" | "category" | "participant" | "payer" | "paymentMethod" | "weekday";
export function groupExpenseEntries(expenses: Expense[], travelers: Traveler[], by: ExpenseGrouping, order: "asc" | "desc", ko: boolean) {
  const people = new Map(travelers.map((person) => [person.id, person.name]));
  const sorted = [...expenses].sort((a, b) => (order === "asc" ? 1 : -1) * (`${a.date}T${(a.time || "12:00").slice(0, 5)}`.localeCompare(`${b.date}T${(b.time || "12:00").slice(0, 5)}`) || a.id.localeCompare(b.id)));
  const groups = new Map<string, { key: string; label: string; entries: Expense[] }>();
  const add = (key: string, label: string, expense: Expense) => { const group = groups.get(key) || { key, label, entries: [] }; group.entries.push(expense); groups.set(key, group); };
  sorted.forEach((expense) => {
    if (by === "participant") { const ids = [...new Set(expense.participantIds || [])]; if (!ids.length) add("none", ko ? "분담자 미지정" : "No participants", expense); else ids.forEach((id) => add(id, people.get(id) || (ko ? "삭제된 여행자" : "Removed traveler"), expense)); }
    else if (by === "payer") add(expense.payerId || "none", people.get(expense.payerId || "") || (ko ? "결제자 미지정" : "No payer"), expense);
    else { const label = by === "time" ? (ko ? "시간순" : "Chronological") : by === "date" ? expense.date : by === "category" ? expense.category : by === "paymentMethod" ? expense.paymentMethod || (ko ? "미지정" : "Unspecified") : new Date(`${expense.date}T12:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", { weekday: "long" }); add(label, label, expense); }
  });
  return [...groups.values()];
}

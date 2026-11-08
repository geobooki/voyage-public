import type { Expense, Traveler } from "@/types/trip";
export function filterByParticipant(expenses: Expense[], travelers: Traveler[], filter: string) {
  if (filter === "everyone") {
    const people = new Set(travelers.map((person) => person.id));
    return expenses.filter((expense) => { const participants = new Set(expense.participantIds || []); return people.size > 0 && participants.size === people.size && [...people].every((id) => participants.has(id)); });
  }
  if (filter.startsWith("person:")) { const id = filter.slice(7); return expenses.filter((expense) => expense.participantIds?.includes(id)); }
  return expenses;
}

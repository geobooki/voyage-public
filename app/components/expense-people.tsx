import type { Expense, Traveler } from "@/types/trip";

export function ExpensePeople({ expense, travelers, ko }: { expense: Expense; travelers: Traveler[]; ko: boolean }) {
  const people = new Map(travelers.map((person) => [person.id, person.name]));
  const participants = [...new Set(expense.participantIds || [])];
  const everyone = people.size > 0 && participants.length === people.size && participants.every((id) => people.has(id));
  const participantNames = everyone ? (ko ? "모두" : "Everyone") : participants.map((id) => people.get(id) || (ko ? "삭제된 여행자" : "Removed traveler")).join(", ") || (ko ? "미지정" : "Unassigned");
  const payer = people.get(expense.payerId || "") || (ko ? "미지정" : "Unassigned");
  return <p className="mt-1 whitespace-normal break-words text-xs muted">{ko ? "결제자" : "Payer"}: {payer} · {ko ? "참여자" : "Participants"}: {participantNames}</p>;
}

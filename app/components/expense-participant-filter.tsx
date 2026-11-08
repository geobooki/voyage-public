"use client";
import type { Traveler } from "@/types/trip";
export function ExpenseParticipantFilter({ travelers, value, onChange, ko }: { travelers: Traveler[]; value: string; onChange: (value: string) => void; ko: boolean }) {
  return <label className="block min-w-0 text-xs">{ko ? "분담자 필터" : "Participant filter"}<select aria-label={ko ? "분담자 필터" : "Participant filter"} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"><option value="all">{ko ? "전체 내역" : "All expenses"}</option><option value="everyone">{ko ? "전원 분담 내역" : "Shared by everyone"}</option>{travelers.map((person) => <option key={person.id} value={`person:${person.id}`}>{person.name} {ko ? "분담 내역" : "shares"}</option>)}</select></label>;
}

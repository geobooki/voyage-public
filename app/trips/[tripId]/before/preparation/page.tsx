"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTripData } from "@/lib/trip-context";

export default function PreparationPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state, toggleChecklist, addChecklist, removeChecklist } =
    useTripData();
  const [name, setName] = useState("");
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    addChecklist("preparation", {
      name: name.trim(),
      category: "Added by you",
      checked: false,
    });
    setName("");
  };
  const completed = state.preparation.filter((item) => item.checked).length;
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/trips/${tripId}`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← Trip overview
        </Link>
        <p className="eyebrow mt-10 mb-3">Preparation checklist</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Take care of the details.</h1>
            <p className="mt-2 muted">
              The small tasks that make the journey smoother.
            </p>
          </div>
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            {completed} / {state.preparation.length} complete
          </span>
        </div>
        <div className="card mt-9 p-6 sm:p-8">
          <div className="h-2 rounded-full bg-[var(--color-surface-muted)]">
            <div
              className="h-2 rounded-full bg-[var(--color-accent)]"
              style={{
                width: `${state.preparation.length ? (completed / state.preparation.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-6 space-y-2">
            {state.preparation.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-[var(--color-background)]"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleChecklist("preparation", item.id)}
                  className="size-4 accent-[var(--color-primary)]"
                />
                <span
                  className={`flex-1 text-sm font-semibold ${item.checked ? "text-[var(--color-text-muted)] line-through" : ""}`}
                >
                  {item.name}
                </span>
                <span className="text-xs muted">{item.category}</span>
                <button
                  type="button"
                  onClick={() => removeChecklist("preparation", item.id)}
                  className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                  aria-label={`Delete ${item.name}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={add}
            className="mt-6 flex gap-2 border-t border-[var(--color-border)] pt-6"
          >
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reserve airport transfer"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"
            />
            <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">
              Add task
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

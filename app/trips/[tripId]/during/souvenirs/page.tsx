"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTripData } from "@/lib/trip-context";

const control =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export default function SouvenirsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state, addSouvenir, toggleSouvenir, removeSouvenir } = useTripData();
  const [form, setForm] = useState({
    name: "",
    estimatedPrice: "",
    actualPrice: "",
    memo: "",
  });
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    addSouvenir({
      name: form.name.trim(),
      estimatedPrice: Number(form.estimatedPrice) || 0,
      purchased: Boolean(form.actualPrice),
      actualPrice: Number(form.actualPrice) || 0,
      memo: form.memo.trim(),
    });
    setForm({ name: "", estimatedPrice: "", actualPrice: "", memo: "" });
  };
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/trips/${tripId}/during`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← During the trip
        </Link>
        <p className="eyebrow mt-10 mb-3">Souvenir wishlist</p>
        <h1 className="text-4xl font-bold">Little things to bring home.</h1>
        <p className="mt-2 muted">
          Track the idea, the purchase and the memory.
        </p>
        <form
          onSubmit={add}
          className="card mt-9 grid gap-3 p-5 sm:grid-cols-2"
        >
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Souvenir name"
            className={control}
          />
          <input
            type="number"
            value={form.estimatedPrice}
            onChange={(event) =>
              setForm({ ...form, estimatedPrice: event.target.value })
            }
            placeholder="Estimated price"
            className={control}
          />
          <input
            type="number"
            value={form.actualPrice}
            onChange={(event) =>
              setForm({ ...form, actualPrice: event.target.value })
            }
            placeholder="Actual price (optional)"
            className={control}
          />
          <input
            value={form.memo}
            onChange={(event) => setForm({ ...form, memo: event.target.value })}
            placeholder="Memo"
            className={control}
          />
          <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white sm:col-span-2">
            Add item
          </button>
        </form>
        <div className="mt-5 space-y-3">
          {state.souvenirs.map((item) => (
            <div key={item.id} className="card flex items-center gap-4 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-surface-muted)] text-xl">
                {item.purchased ? "✓" : "♡"}
              </span>
              <div className="flex-1">
                <p
                  className={`font-bold ${item.purchased ? "line-through text-[var(--color-text-muted)]" : ""}`}
                >
                  {item.name}
                </p>
                <p className="mt-1 text-xs muted">
                  Estimated ¥{item.estimatedPrice.toLocaleString()} · Actual{" "}
                  {item.actualPrice
                    ? `¥${item.actualPrice.toLocaleString()}`
                    : "not purchased"}
                  {item.memo ? ` · ${item.memo}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSouvenir(item.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold ${item.purchased ? "bg-[var(--color-surface-muted)] text-[var(--color-success)]" : "bg-[var(--color-background)] text-[var(--color-primary)]"}`}
                >
                  {item.purchased ? "Purchased" : "Mark purchased"}
                </button>
                <button
                  type="button"
                  onClick={() => removeSouvenir(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-danger)]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import { MoneyField } from "@/app/components/money-field";
import { DateField } from "@/app/components/date-field";
import { useLanguage } from "@/lib/i18n";
import { ReservationDocuments } from "@/app/components/reservation-documents";

const control =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";
type Form = {
  title: string;
  type: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  airline: string;
  terminal: string;
  reservationNumber: string;
  cost: string;
  memo: string;
  link: string;
};
const blank: Form = {
  title: "",
  type: "Stay",
  date: "",
  endDate: "",
  time: "",
  location: "",
  airline: "",
  terminal: "",
  reservationNumber: "",
  cost: "",
  memo: "",
  link: "",
};

export default function ReservationsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { state, addReservation, removeReservation } = useTripData();
  const [form, setForm] = useState<Form>(blank);
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    addReservation({
      ...form,
      title: form.title.trim(),
      cost: Number(form.cost) || 0,
    });
    setForm(blank);
  };
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/trips/${tripId}/before`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← Before overview
        </Link>
        <p className="eyebrow mt-10 mb-3">Reservations</p>
        <h1 className="text-4xl font-bold">Keep every confirmation close.</h1>
        <p className="mt-2 muted">
          Flights, stays, transport and activities in one place. Remove outdated
          bookings anytime.
        </p>
        <form
          onSubmit={add}
          className="card mt-9 grid gap-3 p-6 sm:grid-cols-2"
        >
          <label className="text-xs font-bold sm:col-span-2">
            Name
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="e.g. K5 Hotel"
              className={`mt-2 w-full ${control}`}
            />
          </label>
          <label className="text-xs font-bold">
            Type
            <select
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value })
              }
              className={`mt-2 w-full ${control}`}
            >
              <option>Flight</option>
              <option>Stay</option>
              <option>Transport</option>
              <option>Tour</option>
              <option>Activity</option>
              <option>Other</option>
            </select>
          </label>
          <label className="text-xs font-bold">
            Cost
            <MoneyField
              value={form.cost}
              onChange={(value) => setForm({ ...form, cost: value })}
              placeholder="KRW"
              className={`mt-2 w-full ${control}`}
            />
          </label>
          <DateField label={ko ? "예약일" : "Date"} value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <label className="text-xs font-bold">
            Time
            <input
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm({ ...form, time: event.target.value })
              }
              className={`mt-2 w-full ${control}`}
            />
          </label>
          {form.type === "Flight" && <>
            <label className="text-xs font-bold">
              Airline
              <input value={form.airline} onChange={(event) => setForm({ ...form, airline: event.target.value })} placeholder="e.g. Vietnam Airlines" className={`mt-2 w-full ${control}`} />
            </label>
            <label className="text-xs font-bold">
              Terminal
              <input value={form.terminal} onChange={(event) => setForm({ ...form, terminal: event.target.value })} placeholder="e.g. T2" className={`mt-2 w-full ${control}`} />
            </label>
          </>}
          {form.type === "Stay" && <DateField label={ko ? "체크아웃" : "Check-out"} value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} />}
          <label className="text-xs font-bold">
            Location
            <input
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              placeholder="Address or terminal"
              className={`mt-2 w-full ${control}`}
            />
          </label>
          <label className="text-xs font-bold">
            Confirmation number
            <input
              value={form.reservationNumber}
              onChange={(event) =>
                setForm({ ...form, reservationNumber: event.target.value })
              }
              placeholder="Optional"
              className={`mt-2 w-full ${control}`}
            />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Link
            <input
              type="url"
              value={form.link}
              onChange={(event) =>
                setForm({ ...form, link: event.target.value })
              }
              placeholder="https://..."
              className={`mt-2 w-full ${control}`}
            />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Memo
            <textarea
              value={form.memo}
              onChange={(event) =>
                setForm({ ...form, memo: event.target.value })
              }
              placeholder="Notes"
              className={`mt-2 min-h-20 w-full resize-none ${control}`}
            />
          </label>
          <button className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white sm:col-span-2">
            Save reservation
          </button>
        </form>
        <div className="mt-6 space-y-3">
          {state.reservations.map((item) => (
            <article className="card p-6" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">{item.type}</p>
                  <h2 className="text-xl font-bold">{item.title}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold">₩{item.cost.toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => removeReservation(item.id)}
                    className="text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    aria-label={`Delete ${item.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm muted sm:grid-cols-2">
                <span>
                  ▣ {item.date || "Date pending"} {item.time || ""}
                </span>
                <span>⌖ {item.location || "Location pending"}{item.terminal ? ` · ${item.terminal}` : ""}</span>
                {item.airline && <span>✈ {item.airline}</span>}
                <span>
                  № {item.reservationNumber || "No confirmation number"}
                </span>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[var(--color-primary)]"
                  >
                    Open booking link →
                  </a>
                )}
              </div>
              {item.memo && (
                <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm leading-6 muted">
                  {item.memo}
                </p>
              )}
              <ReservationDocuments tripId={tripId} reservationId={item.id} />
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

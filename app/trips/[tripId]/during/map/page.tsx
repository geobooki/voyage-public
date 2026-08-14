"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTripData } from "@/lib/trip-context";

const fallbackPositions = [{ left: 62, top: 36 }, { left: 47, top: 50 }, { left: 70, top: 62 }, { left: 35, top: 35 }];

function markerPosition(place: { latitude?: number; longitude?: number }, index: number, places: Array<{ latitude?: number; longitude?: number }>) {
  const located = places.filter((item) => item.latitude != null && item.longitude != null);
  if (place.latitude == null || place.longitude == null || located.length < 2) return fallbackPositions[index % fallbackPositions.length];
  const longitudes = located.map((item) => item.longitude as number);
  const latitudes = located.map((item) => item.latitude as number);
  const longitudeRange = Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.001);
  const latitudeRange = Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.001);
  return { left: 18 + ((place.longitude - Math.min(...longitudes)) / longitudeRange) * 64, top: 22 + (1 - (place.latitude - Math.min(...latitudes)) / latitudeRange) * 56 };
}

export default function TripMapPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state, togglePlace } = useTripData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = state.places.find((place) => place.id === selectedId);
  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-6xl"><Link href={`/trips/${tripId}/during`} className="text-sm font-bold text-[var(--color-primary)]">← During the trip</Link><p className="eyebrow mt-10 mb-3">Trip map</p><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-bold">Every place, in one view.</h1><p className="mt-2 muted">Markers use saved coordinates when available.</p></div><span className="text-sm font-bold text-[var(--color-primary)]">{state.places.length} saved places</span></div><div className="card relative mt-9 min-h-[480px] overflow-hidden bg-[var(--color-map-surface)] p-8"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(var(--color-map-dot) 1px, transparent 1px)", backgroundSize: "26px 26px" }}/>{state.places.map((place, index) => { const position = markerPosition(place, index, state.places); return <button key={place.id} onClick={() => setSelectedId(place.id)} style={{ left: `${position.left}%`, top: `${position.top}%` }} className={`absolute z-10 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white ${place.mustGo ? "bg-[var(--color-accent)]" : "bg-[var(--color-primary)]"} text-sm font-bold text-white shadow-lg`} aria-label={`Open ${place.name}`}>{index + 1}</button>; })}<div className="relative grid min-h-[410px] place-items-center text-center"><div><div className="mb-5 text-7xl">🗺️</div><p className="text-xl font-bold">Saved places map</p><p className="mt-2 text-sm muted">{state.places.filter((place) => place.mustGo).length} Must Go · {state.places.filter((place) => place.visited).length} visited</p></div></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{state.places.map((place, index) => <button key={place.id} onClick={() => setSelectedId(place.id)} className="card flex items-center gap-4 p-5 text-left"><span className={`grid size-10 place-items-center rounded-xl text-sm font-bold text-white ${place.mustGo ? "bg-[var(--color-accent)]" : "bg-[var(--color-primary)]"}`}>{index + 1}</span><span className="flex-1"><span className="block font-bold">{place.name}</span><span className="mt-1 block text-xs muted">{place.type} · {place.address || "No address"}</span></span><span className="text-[var(--color-primary)]">›</span></button>)}</div>{selected && <div className="fixed inset-0 z-20 flex items-end justify-center bg-[var(--color-text-primary)]/25 p-4 sm:items-center"><section className="card w-full max-w-md p-7"><div className="flex items-start justify-between"><div><p className="eyebrow mb-2">Map marker</p><h2 className="text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-sm muted">{selected.type} · {selected.address || "No address"}</p></div><button onClick={() => setSelectedId(null)} className="text-xl muted" aria-label="Close marker details">×</button></div><p className="mt-6 text-sm leading-6 muted">{selected.memo || "No memo yet."}</p><p className="mt-2 text-sm muted">Coordinates: {selected.latitude != null && selected.longitude != null ? `${selected.latitude}, ${selected.longitude}` : "Not set"}</p><div className="mt-6 flex gap-2"><button onClick={() => togglePlace(selected.id, "mustGo")} className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">{selected.mustGo ? "★ Must Go" : "☆ Must Go"}</button><button onClick={() => togglePlace(selected.id, "visited")} className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{selected.visited ? "✓ Visited" : "Mark visited"}</button></div></section></div>}</div></main>;
}

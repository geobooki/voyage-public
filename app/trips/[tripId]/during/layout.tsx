import Link from "next/link";

export default async function DuringLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ tripId: string }> }>) {
  const { tripId } = await params;
  return <><nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-10 lg:px-20"><div className="mx-auto flex max-w-6xl gap-5 overflow-auto text-sm font-bold"><Link href={`/trips/${tripId}/during`} className="whitespace-nowrap text-[var(--color-primary)]">Today</Link><Link href={`/trips/${tripId}/during/schedule`} className="whitespace-nowrap muted">Schedule</Link><Link href={`/trips/${tripId}/during/map`} className="whitespace-nowrap muted">Map</Link><Link href={`/trips/${tripId}/during/souvenirs`} className="whitespace-nowrap muted">Souvenirs</Link><Link href={`/trips/${tripId}/during/weather`} className="whitespace-nowrap muted">Weather</Link></div></nav>{children}</>;
}

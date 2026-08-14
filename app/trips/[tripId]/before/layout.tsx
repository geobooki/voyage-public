import Link from "next/link";

export default async function BeforeLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}>) {
  const { tripId } = await params;
  return (
    <>
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-10 lg:px-20">
        <div className="mx-auto flex max-w-5xl gap-5 overflow-auto text-sm font-bold">
          <Link
            href={`/trips/${tripId}/before`}
            className="whitespace-nowrap text-[var(--color-primary)]"
          >
            Overview
          </Link>
          <Link
            href={`/trips/${tripId}/before/preparation`}
            className="whitespace-nowrap muted"
          >
            Preparation
          </Link>
          <Link
            href={`/trips/${tripId}/before/budget`}
            className="whitespace-nowrap muted"
          >
            Budget & exchange
          </Link>
          <Link
            href={`/trips/${tripId}/before/reservations`}
            className="whitespace-nowrap muted"
          >
            Reservations
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}

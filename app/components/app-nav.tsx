import Link from "next/link";

const items = [
  { href: "/", label: "Overview", icon: "⌂" },
  { href: "/trips", label: "Trips", icon: "✦" },
  { href: "/map", label: "World map", icon: "◎" },
];

export function AppNav() {
  return <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:inset-y-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:px-2 md:py-6"><div className="mx-auto flex max-w-md justify-around gap-2 md:h-full md:flex-col md:justify-start">{items.map((item) => <Link key={item.href} href={item.href} className="flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]"><span className="text-xl text-[var(--color-primary)]">{item.icon}</span>{item.label}</Link>)}</div></nav>;
}

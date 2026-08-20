"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { isCurrentOrSoonTrip } from "@/lib/trip-selection";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "Overview", icon: "⌂" },
  { href: "/trips", label: "Trips", icon: "✦" },
  // 지도 기능은 보류 중입니다. 대시보드와 여행 관리에 집중하기 위해 메뉴에서 숨깁니다.
  // { href: "/map", label: "World map", icon: "◎" },
];

export function AppNav() {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const tripId = pathname.match(/^\/trips\/([^/]+)/)?.[1];
  const inTrip = Boolean(tripId && tripId !== "new");
  const [hasNowTrip, setHasNowTrip] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    void fetch("/api/trips")
      .then((response) => (response.ok ? response.json() : { trips: [] }))
      .then((result) => setHasNowTrip(Array.isArray(result.trips) && result.trips.some(isCurrentOrSoonTrip)))
      .catch(() => setHasNowTrip(false));
  }, [pathname]);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateKeyboardState = () => setKeyboardOpen(window.innerHeight - viewport.height > 120);
    updateKeyboardState();
    viewport.addEventListener("resize", updateKeyboardState);
    return () => viewport.removeEventListener("resize", updateKeyboardState);
  }, []);
  const navigationItems = hasNowTrip
    ? [{ href: "/now", label: t("overview"), icon: "◉" }, ...items]
    : items;
  const labels = {
    "/": t("overview"),
    "/trips": t("trips"),
  };
  const tripItems = tripId
    ? [
        { href: `/trips/${tripId}/before/budget`, label: language === "ko" ? "예산" : "Budget", icon: "₩" },
        { href: `/trips/${tripId}/before/reservations`, label: language === "ko" ? "예약" : "Bookings", icon: "🎟️" },
        { href: `/trips/${tripId}/during/schedule`, label: language === "ko" ? "일정" : "Schedule", icon: "🗓️" },
      ]
    : [];
  return (
    <nav
      aria-label="Primary navigation"
      data-component="side-navigation"
      className={`${keyboardOpen ? "hidden md:block" : ""} fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:inset-y-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:px-2 md:py-6`}
    >
      <div className="mx-auto flex max-w-md justify-around gap-2 md:flex md:h-full md:flex-col md:justify-start">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${inTrip ? "hidden md:flex" : "flex"} ds-nav-item min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)] ${pathname === item.href ? "ds-nav-item-active" : ""}`}
          >
            <span className="text-xl text-[var(--color-primary)]">
              {item.icon}
            </span>
            {item.href === "/now" ? (language === "ko" ? "지금 여행" : "Now") : labels[item.href as keyof typeof labels]}
          </Link>
        ))}
        {inTrip && <div className="hidden w-full border-t border-[var(--color-border)] pt-4 md:block"><p className="mb-2 text-center text-[10px] font-bold text-[var(--color-text-muted)]">{language === "ko" ? "여행" : "Trip"}</p>{tripItems.map((item) => <Link key={item.href} href={item.href} className={`ds-nav-item mb-1 flex min-w-20 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)] ${pathname === item.href ? "ds-nav-item-active" : ""}`}><span className="text-lg text-[var(--color-primary)]">{item.icon}</span>{item.label}</Link>)}</div>}
        {inTrip && <div className="flex flex-1 justify-around gap-2 md:hidden">{[{ href: `/trips/${tripId}`, label: language === "ko" ? "개요" : "Overview", icon: "⌂" }, ...tripItems].map((item) => <Link key={item.href} href={item.href} className={`ds-nav-item flex min-w-16 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)] ${pathname === item.href ? "ds-nav-item-active" : ""}`}><span className="text-xl text-[var(--color-primary)]">{item.icon}</span>{item.label}</Link>)}</div>}
        <Link
          href="/settings"
          className={`${inTrip ? "hidden md:flex" : "flex"} ds-nav-item min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)] md:mt-auto ${pathname === "/settings" ? "ds-nav-item-active" : ""}`}
        >
          <span className="text-xl text-[var(--color-primary)]">⚙</span>
          {t("settings")}
        </Link>
      </div>
    </nav>
  );
}

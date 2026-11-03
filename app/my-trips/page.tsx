"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyTripsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/trips"); }, [router]);
  return <main className="grid min-h-screen place-items-center"><p className="muted">여행 목록으로 이동 중…</p></main>;
}

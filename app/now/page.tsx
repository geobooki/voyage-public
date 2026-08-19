"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { selectCurrentOrSoonTrip } from "@/lib/trip-selection";

export default function NowPage() {
  const router = useRouter();
  const [message, setMessage] = useState("여행을 불러오는 중이에요.");
  useEffect(() => {
    void fetch("/api/trips")
      .then((response) => (response.ok ? response.json() : { trips: [] }))
      .then((result) => {
        const trip = selectCurrentOrSoonTrip(Array.isArray(result.trips) ? result.trips : []);
        if (trip) router.replace(`/trips/${trip.slug || trip.id}`);
        else setMessage("지금 진행 중이거나 7일 안에 시작하는 여행이 없어요.");
      })
      .catch(() => setMessage("여행 정보를 불러오지 못했어요."));
  }, [router]);
  return <main className="grid min-h-screen place-items-center px-6"><p className="muted">{message}</p></main>;
}

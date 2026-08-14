"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatTotals } from "@/lib/money";
import { useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";

type TripMeta = { title: string; dates: string; status: string };

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { state } = useTripData();
  const [trip, setTrip] = useState<TripMeta>({
    title: tripId === "tokyo" ? "Tokyo, Japan" : "Your new journey",
    dates:
      tripId === "tokyo"
        ? "Sep 10 — Sep 15, 2026 · 5 nights"
        : "Dates to be planned",
    status: "planning",
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"view" | "edit">(
    "view",
  );
  useEffect(() => {
    const load = async () => {
      try {
        const local = JSON.parse(
          window.localStorage.getItem("voyage:trips") || "[]",
        ).find((item: { id: string }) => item.id === tripId);
        if (local)
          setTrip({
            title: local.title || `${local.city}, ${local.country}`,
            dates: `${local.startDate} — ${local.endDate}`,
            status: String(local.status || "planning").toLowerCase(),
          });
        const response = await fetch(`/api/trips/${tripId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.trip)
            setTrip({
              title: String(result.trip.title),
              dates: `${String(result.trip.start_date ?? "Dates to be planned")} — ${String(result.trip.end_date ?? "")}`,
              status: String(result.trip.status ?? "planning"),
            });
        }
      } catch {
        /* fallback title */
      }
    };
    void load();
  }, [tripId]);
  const completeTrip = async () => {
    setSavingStatus(true);
    setTrip((current) => ({ ...current, status: "completed" }));
    try {
      const trips = JSON.parse(
        window.localStorage.getItem("voyage:trips") || "[]",
      );
      window.localStorage.setItem(
        "voyage:trips",
        JSON.stringify(
          trips.map((item: { id: string }) =>
            item.id === tripId ? { ...item, status: "Completed" } : item,
          ),
        ),
      );
      await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    } finally {
      setSavingStatus(false);
    }
  };
  const createShareLink = async () => {
    setSharing(true);
    setShareMessage("");
    try {
      const response = await fetch(`/api/trips/${tripId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          permission: invitePermission,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "공유 링크를 만들지 못했습니다.");
      setShareUrl(result.shareUrl);
      await navigator.clipboard?.writeText(result.shareUrl);
      setShareMessage(
        inviteEmail
          ? `${inviteEmail} 초대 링크를 만들었어요.`
          : "링크를 복사했어요.",
      );
      if (inviteEmail)
        window.location.href = `mailto:${inviteEmail}?subject=${encodeURIComponent(`${trip.title} 여행 초대`)}&body=${encodeURIComponent(`${trip.title} 여행에 초대합니다. ${result.shareUrl}`)}`;
    } catch (caught) {
      setShareMessage(
        caught instanceof Error
          ? caught.message
          : "공유 링크를 만들지 못했습니다.",
      );
    } finally {
      setSharing(false);
    }
  };
  const packed = state.packing.length
    ? Math.round(
        (state.packing.filter((item) => item.checked).length /
          state.packing.length) *
          100,
      )
    : 0;
  const total = formatTotals(state.expenses);
  const sections = ko
    ? [
        {
          key: "before",
          label: "여행 전",
          title: "준비하기",
          text: `준비물 ${packed}% 완료`,
          emoji: "◌",
        },
        {
          key: "during",
          label: "여행 중",
          title: "추억 만들기",
          text: `일정 ${state.schedule.length}개 · 장소 ${state.places.length}곳`,
          emoji: "✦",
        },
        {
          key: "after",
          label: "여행 후",
          title: "기록 남기기",
          text: total || "아직 지출 없음",
          emoji: "♡",
        },
      ]
    : [
        {
          key: "before",
          label: "Before",
          title: "Get ready",
          text: `${packed}% packing complete`,
          emoji: "◌",
        },
        {
          key: "during",
          label: "During",
          title: "Make memories",
          text: `${state.schedule.length} plans · ${state.places.length} places`,
          emoji: "✦",
        },
        {
          key: "after",
          label: "After",
          title: "Keep the story",
          text: `${total || "No spend yet"}`,
          emoji: "♡",
        },
      ];
  return (
    <main
      data-section="trip-overview"
      className="min-h-screen px-5 py-8 sm:px-10 lg:px-20 lg:py-12"
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/trips"
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← {ko ? "내 여행" : "My trips"}
        </Link>
        <div
          data-section="trip-heading"
          className="mt-8 flex flex-wrap items-end justify-between gap-5"
        >
          <div>
            <p className="eyebrow mb-3">
              {trip.status === "completed"
                ? ko
                  ? "여행 기록"
                  : "Travel archive"
                : ko
                  ? "다음 여행"
                  : "Your next adventure"}
            </p>
            <h1 className="text-4xl font-bold">{trip.title}</h1>
            <p className="mt-2 muted">{trip.dates}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {trip.status !== "completed" && (
              <button
                onClick={completeTrip}
                disabled={savingStatus}
                className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingStatus ? "저장 중…" : "여행 완료 처리"}
              </button>
            )}
            <button
              onClick={() =>
                setShareMessage((current) =>
                  current ? "" : "초대할 이메일과 권한을 선택하세요.",
                )
              }
              className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-primary)]"
            >
              여행 공유
            </button>
          </div>
        </div>
        {shareMessage !== "" && (
          <div data-section="trip-sharing-controls" className="card mt-4 p-4">
            <p className="text-sm font-bold">이메일로 여행 초대</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="초대할 이메일 주소 (선택)"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
              <select
                value={invitePermission}
                onChange={(event) =>
                  setInvitePermission(event.target.value as "view" | "edit")
                }
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <option value="view">보기 전용</option>
                <option value="edit">공동 편집</option>
              </select>
              <button
                onClick={createShareLink}
                disabled={sharing}
                className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white"
              >
                {sharing ? "생성 중…" : "초대 링크 만들기"}
              </button>
            </div>
            {shareUrl && (
              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs"
                />
                <button
                  onClick={() => void navigator.clipboard?.writeText(shareUrl)}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold"
                >
                  복사
                </button>
              </div>
            )}
            <p className="mt-2 text-xs muted">
              공동 편집 링크에서는 공유 일정의 완료 상태를 함께 업데이트할 수
              있습니다.
            </p>
          </div>
        )}
        <div
          data-section="trip-phases"
          className="mt-10 grid gap-5 md:grid-cols-3"
        >
          {sections.map((item) => (
            <Link
              key={item.key}
              href={`/trips/${tripId}/${item.key}`}
              className="card p-7 hover:-translate-y-1"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-[var(--color-surface-muted)] text-xl text-[var(--color-primary)]">
                {item.emoji}
              </span>
              <p className="eyebrow mt-8">{item.label}</p>
              <h2 className="mt-2 text-2xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm muted">{item.text}</p>
              <span className="mt-8 block text-sm font-bold text-[var(--color-primary)]">
                {ko ? "열기 →" : "Open section →"}
              </span>
            </Link>
          ))}
        </div>
        <section data-section="trip-snapshot" className="card mt-7 p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow mb-3">
                {ko ? "여행 한눈에 보기" : "Trip snapshot"}
              </p>
              <h2 className="text-2xl font-bold">
                {ko
                  ? "매일 조금씩 더 준비돼요."
                  : "A little more ready every day."}
              </h2>
            </div>
            <span className="text-sm font-bold text-[var(--color-primary)]">
              {packed}% {ko ? "완료" : "ready"}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              [String(state.places.length), "장소"],
              [total || "—", "지출"],
              [
                String(state.schedule.filter((item) => item.completed).length),
                "완료 일정",
              ],
            ].map(([value, label]) => (
              <div
                data-section="trip-snapshot-metric"
                key={label}
                className="rounded-2xl bg-[var(--color-background)] p-4"
              >
                <p className="text-xl font-bold">{value}</p>
                <p className="mt-1 text-xs muted">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

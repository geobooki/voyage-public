"use client";

import Link from "next/link";
import { SettlementPanel } from "@/app/components/settlement-panel";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { formatTotals, totalsByCurrency } from "@/lib/money";
import { useTripData } from "@/lib/trip-context";

const expenseCategories = [
  "Food",
  "Transport",
  "Shopping",
  "Activity",
  "Stay",
  "Other",
];
const control =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export default function AfterPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { state, saveReview } = useTripData();
  const [review, setReview] = useState(state.review);
  useEffect(() => setReview(state.review), [state.review]);
  const totalLabel = formatTotals(state.expenses);
  const plannedLabel = formatTotals(state.budget);
  const currencyTotals = totalsByCurrency(state.expenses);
  const categoryTotals = expenseCategories.map((category) => {
    const expenses = state.expenses.filter(
      (expense) => expense.category === category,
    );
    return {
      category,
      expenses,
      label: formatTotals(expenses),
      amount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    };
  });
  const primaryCurrency = Object.keys(currencyTotals)[0];
  const primaryTotal = primaryCurrency ? currencyTotals[primaryCurrency] : 0;
  const dominantCategory = [...categoryTotals].sort(
    (a, b) => b.amount - a.amount,
  )[0];
  const style = dominantCategory?.amount
    ? {
        Food: "Food Lover",
        Shopping: "Shopping Lover",
        Activity: "Activity Explorer",
        Transport: "City Roamer",
        Stay: "Slow Traveler",
      }[dominantCategory.category] || "Curious Explorer"
    : "Curious Explorer";
  const foodFrequency = state.places
    .map((place) => ({
      name: place.name,
      count: state.expenses.filter(
        (expense) =>
          expense.placeId === place.id && expense.category === "Food",
      ).length,
    }))
    .filter((place) => place.count > 0)
    .sort((a, b) => b.count - a.count);
  const expenseViews = state.expenses.map((expense) => {
    const participants = expense.participantIds?.length
      ? state.travelers.filter((traveler) => expense.participantIds?.includes(traveler.id))
      : state.travelers;
    return {
      expense,
      participants,
      payer: state.travelers.find((traveler) => traveler.id === expense.payerId)?.name,
      shared: participants.length > 1,
    };
  });
  const sharedExpenses = expenseViews.filter((item) => item.shared);
  const personalExpenses = expenseViews.filter((item) => !item.shared);
  const save = (event: FormEvent) => {
    event.preventDefault();
    saveReview(review);
  };
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/trips/${tripId}`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← Trip overview
        </Link>
        <p className="eyebrow mt-10 mb-3">After the trip</p>
        <h1 className="text-4xl font-bold">Keep the story.</h1>
        <p className="mt-2 muted">A few numbers, a lot of memories.</p>
        <div className="card mt-5 p-4"><p className="text-sm">여행이 끝나도 지출을 수정하고 정산을 이어갈 수 있어요.</p><div className="mt-3 flex flex-wrap gap-2"><Link href={`/trips/${tripId}/before/budget`} className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm text-white">지출 내역·추가·수정</Link><Link href={`/trips/${tripId}/report`} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm">지출·정산 보고서</Link></div></div><section className="card mt-5 p-4 sm:p-6" id="settlement"><h2 className="mb-4 text-xl font-semibold">여행 경비 정산</h2><SettlementPanel tripId={tripId}/></section>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="card p-6">
            <p className="text-2xl font-bold">{totalLabel || "—"}</p>
            <p className="mt-2 text-sm muted">
              Total recorded spend · by currency
            </p>
          </div>
          <div className="card p-6">
            <p className="text-3xl font-bold">
              {state.places.filter((place) => place.visited).length}
            </p>
            <p className="mt-2 text-sm muted">Places visited</p>
          </div>
          <div className="card p-6">
            <p className="text-3xl font-bold text-[var(--color-accent)]">
              {state.review.rating ? "★".repeat(state.review.rating) : "—"}
            </p>
            <p className="mt-2 text-sm muted">Your rating</p>
          </div>
        </div>
        <section className="card mt-5 p-7">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow mb-2">예산 기록</p><h2 className="text-xl font-bold">여행 전 예산과 환전 내역</h2><p className="mt-2 text-sm muted">완료된 여행에서도 예산과 지출 기록은 그대로 보관됩니다.</p></div>
            <Link href={`/trips/${tripId}/before/budget`} className="shrink-0 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)]">예산 보기</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[var(--color-background)] p-4"><p className="text-xs muted">예상 총액</p><p className="mt-1 font-bold">{plannedLabel || "—"}</p></div><div className="rounded-xl bg-[var(--color-background)] p-4"><p className="text-xs muted">실제 사용액</p><p className="mt-1 font-bold">{totalLabel || "—"}</p></div></div>
          <div className="mt-4 space-y-2">{state.budget.length ? state.budget.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm"><span className="min-w-0 truncate">{item.name || item.category}</span><strong className="shrink-0">{item.currency || "KRW"} {item.amount.toLocaleString()}</strong></div>) : <p className="text-sm muted">저장된 예산 항목이 없습니다.</p>}</div>
        </section>
        <section className="card mt-5 p-7">
          <p className="eyebrow mb-2">동행자별 지출</p>
          <h2 className="text-xl font-bold">같이 쓴 돈과 개인 지출</h2>
          <p className="mt-2 text-sm muted">분담자에 여러 명이 선택된 지출은 공동 지출로, 한 명만 부담하는 지출은 개인 지출로 정리했어요.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-primary)]">공동 지출 {sharedExpenses.length}건</h3>
              <div className="mt-3 space-y-2">
                {sharedExpenses.length ? sharedExpenses.map(({ expense, participants, payer }) => <div key={expense.id} className="rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm"><div className="flex items-start justify-between gap-3"><span className="min-w-0 font-bold">{expense.name || expense.category}</span><strong className="shrink-0">{expense.currency} {expense.amount.toLocaleString()}</strong></div><p className="mt-1 text-xs muted">참여: {participants.map((traveler) => traveler.name).join(", ")} · 1인 약 {expense.currency} {Math.round(expense.amount / participants.length).toLocaleString()}{payer ? ` · 결제자 ${payer}` : ""}</p></div>) : <p className="text-sm muted">공동 지출이 없습니다.</p>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-primary)]">개인 지출 {personalExpenses.length}건</h3>
              <div className="mt-3 space-y-2">
                {personalExpenses.length ? personalExpenses.map(({ expense, participants, payer }) => <div key={expense.id} className="rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm"><div className="flex items-start justify-between gap-3"><span className="min-w-0 font-bold">{expense.name || expense.category}</span><strong className="shrink-0">{expense.currency} {expense.amount.toLocaleString()}</strong></div><p className="mt-1 text-xs muted">대상: {participants[0]?.name || payer || "개인"}{payer && participants[0]?.id !== expense.payerId ? ` · 결제자 ${payer}` : ""}</p></div>) : <p className="text-sm muted">개인 지출이 없습니다.</p>}
              </div>
            </div>
          </div>
        </section>
        <section className="card mt-5 p-7">
          <p className="eyebrow mb-2">전체 지출</p>
          <h2 className="text-xl font-bold">여행 중 사용한 내역</h2>
          <div className="mt-5 space-y-2">{state.expenses.length ? [...state.expenses].sort((a, b) => `${b.date}T${b.time || "12:00"}`.localeCompare(`${a.date}T${a.time || "12:00"}`)).map((expense) => <div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-bold">{expense.name || expense.category}</p><p className="mt-1 text-xs muted">{expense.date} {expense.time || "12:00"} · {expense.category} · {expense.paymentMethod || "결제수단 미지정"}</p></div><strong className="shrink-0">{expense.currency} {expense.amount.toLocaleString()}</strong></div>) : <p className="text-sm muted">저장된 지출 내역이 없습니다.</p>}</div>
        </section>
        <section className="card mt-5 p-7">
          <p className="eyebrow mb-2">Travel personality</p>
          <h2 className="text-2xl font-bold">{style}</h2>
          <p className="mt-2 text-sm muted">
            Based on recorded expense categories.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categoryTotals.map(({ category, label, amount }) => (
              <div key={category}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="muted">{category}</span>
                  <span className="font-bold">{label || "—"}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface-muted)]">
                  <div
                    className="h-2 rounded-full bg-[var(--color-primary)]"
                    style={{
                      width: `${primaryTotal ? Math.min(100, Math.max(2, (amount / primaryTotal) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card mt-5 p-7">
          <p className="eyebrow mb-2">Food preferences</p>
          <h2 className="text-xl font-bold">Places that fed the story</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {foodFrequency.length ? (
              foodFrequency.map((place) => (
                <div
                  key={place.name}
                  className="rounded-xl bg-[var(--color-background)] px-4 py-3"
                >
                  <p className="font-bold">{place.name}</p>
                  <p className="mt-1 text-xs muted">
                    {place.count} food expense{place.count === 1 ? "" : "s"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm muted">
                Link food expenses to restaurants to build your food profile.
              </p>
            )}
          </div>
        </section>
        <section className="card mt-5 p-7">
          <p className="eyebrow mb-2">Trip statistics</p>
          <h2 className="text-xl font-bold">Where your money went</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categoryTotals.map(({ category, label }) => (
              <div
                className="flex justify-between rounded-xl bg-[var(--color-background)] px-4 py-3 text-sm"
                key={category}
              >
                <span className="muted">{category}</span>
                <span className="font-bold">{label || "—"}</span>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={save} className="card mt-5 p-7">
          <p className="eyebrow mb-2">Your reflection</p>
          <h2 className="text-xl font-bold">What will you remember most?</h2>
          <div className="mt-5 flex gap-1" aria-label="Rating">
            <span className="mr-3 text-sm font-bold muted">Rating</span>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                type="button"
                key={rating}
                onClick={() => setReview({ ...review, rating })}
                className={`text-2xl ${rating <= review.rating ? "text-[var(--color-accent)]" : "text-[var(--color-border)]"}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              One-line review
              <input
                value={review.comment}
                onChange={(event) =>
                  setReview({ ...review, comment: event.target.value })
                }
                placeholder="This trip was..."
                className={`mt-2 w-full ${control}`}
              />
            </label>
            <label className="text-xs font-bold">
              Places to revisit
              <input
                value={review.revisitPlaces}
                onChange={(event) =>
                  setReview({ ...review, revisitPlaces: event.target.value })
                }
                placeholder="Shibuya Sky, Tsukiji..."
                className={`mt-2 w-full ${control}`}
              />
            </label>
            <label className="text-xs font-bold">
              What went well
              <textarea
                value={review.goodThings}
                onChange={(event) =>
                  setReview({ ...review, goodThings: event.target.value })
                }
                className={`mt-2 min-h-24 w-full resize-none ${control}`}
              />
            </label>
            <label className="text-xs font-bold">
              What could improve
              <textarea
                value={review.badThings}
                onChange={(event) =>
                  setReview({ ...review, badThings: event.target.value })
                }
                className={`mt-2 min-h-24 w-full resize-none ${control}`}
              />
            </label>
          </div>
          <button className="mt-4 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">
            Save reflection
          </button>
        </form>
      </div>
    </main>
  );
}

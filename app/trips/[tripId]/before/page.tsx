"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useTripData } from "@/lib/trip-context";
import { formatTotals } from "@/lib/money";

const control =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";
const money = (amount: number | string) =>
  typeof amount === "number" ? `₩${amount.toLocaleString("ko-KR")}` : amount;

function MoneyInput({ value, onChange, className }: { value: number; onChange: (value: number) => void; className: string }) {
  const display = value === 0 ? "" : value.toLocaleString("ko-KR");
  return <input type="text" inputMode="decimal" value={display} placeholder="0" onFocus={(event) => event.currentTarget.select()} onChange={(event) => onChange(Number(event.target.value.replace(/,/g, "")) || 0)} className={className} />;
}

export default function BeforePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const {
    state,
    toggleChecklist,
    addChecklist,
    removeChecklist,
    addPackingCategory,
    updatePackingCategory,
    removePackingCategory,
    addReservation,
    saveExchange,
  } = useTripData();
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [category, setCategory] = useState("기타");
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortMode, setSortMode] = useState("category");
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryDraft, setCategoryDraft] = useState({
    name: "",
    color: "#FEF3C7",
  });
  const [showReservation, setShowReservation] = useState(false);
  const [reservation, setReservation] = useState({
    title: "",
    type: "Stay",
    date: "",
    cost: "",
  });
  const [exchange, setExchange] = useState(state.exchange);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateDate, setRateDate] = useState<string | null>(null);
  useEffect(() => setExchange(state.exchange), [state.exchange]);
  useEffect(() => {
    setRateLoading(true);
    fetch("/api/exchange-rates")
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        const rate = result?.rates?.[state.exchange.to];
        setRateDate(result?.date || null);
        if (typeof rate === "number" && rate > 0)
          setExchange((current) => ({ ...current, rate }));
      })
      .catch(() => undefined)
      .finally(() => setRateLoading(false));
  }, [state.exchange.to]);
  const categories = state.packingCategories;
  useEffect(() => {
    if (!category && categories[0]) setCategory(categories[0].name);
    if (!selectedCategoryId && categories[0]) {
      setSelectedCategoryId(categories[0].id);
      setCategoryDraft({ name: categories[0].name, color: categories[0].color });
    }
  }, [categories, category, selectedCategoryId]);
  const completed = state.packing.filter((item) => item.checked);
  const exchangeUnit = exchange.to === "JPY" || exchange.to === "VND" ? 100 : 1;
  const exchangeUnitLabel = exchangeUnit === 100 ? `100 ${exchange.to}` : exchange.to;
  const displayedRate = (exchange.rate * exchangeUnit).toFixed(2);
  const incomplete = state.packing.filter((item) => !item.checked);
  const ordered = (items: typeof state.packing) =>
    [...items].sort((a, b) =>
      sortMode === "category"
        ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
  const boards = (items: typeof state.packing) => {
    const knownBoards = categories.map((categoryItem) => ({
        category: categoryItem,
        items: ordered(items).filter((item) => item.category === categoryItem.name),
      }))
      .filter((board) => board.items.length > 0);
    const knownNames = new Set(categories.map((item) => item.name));
    const unknownNames = [...new Set(items.map((item) => item.category).filter((name) => !knownNames.has(name)))];
    return [...knownBoards, ...unknownNames.map((name, index) => ({ category: { id: `legacy-${index}-${name}`, name, color: "#FEF3C7" }, items: ordered(items).filter((item) => item.category === name) }))];
  };
  const submitItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newItem.trim()) return;
    addChecklist("packing", {
      name: newItem.trim(),
      category: category || categories[0]?.name || "기타",
      checked: false,
    });
    setNewItem("");
  };
  const addNewCategory = (event: FormEvent) => {
    event.preventDefault();
    const value = newCategory.trim();
    if (!value) return;
    addPackingCategory({ name: value, color: "#FEF3C7" });
    setCategory(value);
    setNewCategory("");
  };
  const submitReservation = (event: FormEvent) => {
    event.preventDefault();
    if (!reservation.title.trim()) return;
    addReservation({
      title: reservation.title,
      type: reservation.type,
      date: reservation.date,
      cost: Number(reservation.cost) || 0,
      memo: "",
    });
    setReservation({ title: "", type: "Stay", date: "", cost: "" });
    setShowReservation(false);
  };
  const submitExchange = (event: FormEvent) => {
    event.preventDefault();
    saveExchange(exchange);
  };
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/trips/${tripId}`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← {ko ? "여행 개요" : "Trip overview"}
        </Link>
        <p className="eyebrow mt-10 mb-3">
          {ko ? "여행 전" : "Before the trip"}
        </p>
        <h1 className="text-4xl font-bold">
          {ko ? "여행 준비를 시작해요." : "Let’s get ready."}
        </h1>
        <p className="mt-2 muted">
          {ko
            ? "차분한 여행은 명확한 계획에서 시작됩니다."
            : "A calm trip starts with a clear plan."}
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="card p-6 sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow mb-2">
                  {ko ? "준비물 목록" : "Packing list"}
                </p>
                <h2 className="text-xl font-bold">
                  {ko ? "필요한 것을 챙겨요" : "Take what you need"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs font-bold">
                  <option value="category">{ko ? "카테고리순" : "Category"}</option>
                  <option value="name">{ko ? "이름순" : "Name"}</option>
                </select>
                <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                  {state.packing.filter((item) => item.checked).length} / {state.packing.length} {ko ? "완료" : "complete"}
                </span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {boards(incomplete).map((board) => (
                <div key={board.category.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                  <div className="mb-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ backgroundColor: board.category.color }}>{board.category.name}</div>
                  <div className="space-y-1">
                    {board.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2">
                        <input type="checkbox" checked={item.checked} onChange={() => toggleChecklist("packing", item.id)} className="size-4 accent-[var(--color-primary)]" />
                        <span className="flex-1 text-sm font-semibold">{item.name}</span>
                        <button type="button" onClick={() => removeChecklist("packing", item.id)} className="text-sm font-bold text-[var(--color-danger)]" aria-label={ko ? `${item.name} 삭제` : `Delete ${item.name}`}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {completed.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCompleted((current) => !current)}
                className="mt-4 text-sm font-bold text-[var(--color-primary)]"
              >
                {showCompleted
                  ? ko
                    ? "완료한 준비물 숨기기"
                    : "Hide completed"
                  : ko
                    ? `완료한 준비물 ${completed.length}개 보기`
                    : `Show ${completed.length} completed`}
              </button>
            )}
            {showCompleted && completed.length > 0 && (
              <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                <p className="mb-2 text-xs font-bold muted">
                  {ko ? "완료된 준비물" : "Completed items"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {boards(completed).map((board) => (
                    <div key={board.category.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                      <div className="mb-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ backgroundColor: board.category.color }}>{board.category.name}</div>
                      <div className="space-y-1">{board.items.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2"><input type="checkbox" checked onChange={() => toggleChecklist("packing", item.id)} className="size-4 accent-[var(--color-primary)]"/><span className="flex-1 text-sm font-semibold line-through text-[var(--color-text-muted)]">{item.name}</span><button type="button" onClick={() => removeChecklist("packing", item.id)} className="text-sm font-bold text-[var(--color-danger)]">×</button></div>)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form
              onSubmit={submitItem}
              className="mt-5 grid gap-2 border-t border-[var(--color-border)] pt-5 sm:grid-cols-[1fr_auto]"
            >
              <input
                value={newItem}
                onChange={(event) => setNewItem(event.target.value)}
                placeholder={ko ? "준비물 추가" : "Add an item"}
                className={`min-w-0 ${control}`}
              />
              <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">
                {ko ? "추가" : "Add"}
              </button>
              <div className="relative sm:col-span-2">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={`w-full appearance-none pr-10 ${control}`}
                >
                  {categories.map((item) => (
                    <option key={item.id}>{item.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm muted">
                  ⌄
                </span>
              </div>
            </form>
            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold muted">{ko ? "카테고리 관리" : "Category management"}</p>
                <button type="button" onClick={() => setCategoryManagerOpen(true)} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-bold">{ko ? "관리" : "Manage"}</button>
              </div>
              <form onSubmit={addNewCategory} className="mt-3 flex gap-2">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder={ko ? "새 카테고리" : "New category"}
                  className={`min-w-0 flex-1 ${control}`}
                />
                <button className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold">
                  {ko ? "추가" : "Add"}
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {categories.map((item) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{ backgroundColor: item.color }}
                    key={item.id}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            {categoryManagerOpen && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-5">
                <div className="card w-full max-w-md p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      {ko ? "카테고리 관리" : "Manage categories"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCategoryManagerOpen(false)}
                      className="text-xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {categories.map((item) => <button type="button" key={item.id} onClick={() => { setSelectedCategoryId(item.id); setCategoryDraft({ name: item.name, color: item.color }); }} className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${selectedCategoryId === item.id ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"}`} style={{ backgroundColor: item.color }}>{item.name}</button>)}
                  </div>
                  <input
                    value={categoryDraft.name}
                    onChange={(event) =>
                      setCategoryDraft({
                        ...categoryDraft,
                        name: event.target.value,
                      })
                    }
                    className={`mt-3 w-full ${control}`}
                    placeholder={ko ? "카테고리 이름" : "Category name"}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "#FEF3C7",
                      "#DBEAFE",
                      "#E0E7FF",
                      "#FCE7F3",
                      "#DCFCE7",
                      "#FECACA",
                    ].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() =>
                          setCategoryDraft({ ...categoryDraft, color })
                        }
                        className={`size-8 rounded-full border-2 ${categoryDraft.color === color ? "border-black" : "border-white"}`}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                      />
                    ))}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCategoryId && categoryDraft.name.trim())
                          updatePackingCategory(selectedCategoryId, {
                            name: categoryDraft.name.trim(),
                            color: categoryDraft.color,
                          });
                        setCategoryManagerOpen(false);
                      }}
                      className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-bold text-white"
                    >
                      {ko ? "저장" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCategoryId)
                          removePackingCategory(selectedCategoryId);
                        setCategoryManagerOpen(false);
                      }}
                      className="rounded-xl border border-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-[var(--color-danger)]"
                    >
                      {ko ? "삭제" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
          <div className="space-y-5">
            <section className="card p-6">
              <p className="eyebrow mb-2">
                {ko ? "예상 예산" : "Estimated budget"}
              </p>
              <p className="text-3xl font-bold">
                {formatTotals(state.budget) || "₩0"}
              </p>
              <Link
                href={`/trips/${tripId}/before/budget`}
                className="mt-5 block text-sm font-bold text-[var(--color-primary)]"
              >
                {ko ? "예산 관리 →" : "Manage budget →"}
              </Link>
            </section>
            <section className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow mb-2">{ko ? "예약" : "Reservations"}</p>
                  <h2 className="text-xl font-bold">
                    {state.reservations.length}
                    {ko ? "건 확인됨" : " confirmed"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowReservation((value) => !value)}
                  className="text-sm font-bold text-[var(--color-primary)]"
                >
                  + {ko ? "추가" : "Add"}
                </button>
              </div>
              {state.reservations.map((item) => (
                <div
                  key={item.id}
                  className="mt-5 rounded-2xl bg-[var(--color-background)] p-4"
                >
                  <div className="flex justify-between">
                    <p className="text-sm font-bold">{item.title}</p>
                    <span className="text-xs muted">{item.type}</span>
                  </div>
                  <p className="mt-2 text-xs muted">
                    {item.date ||
                      (ko ? "날짜 확인 중" : "Date to be confirmed")}{" "}
                    · {money(item.cost)}
                  </p>
                </div>
              ))}
              {showReservation && (
                <form
                  onSubmit={submitReservation}
                  className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5"
                >
                  <input
                    required
                    value={reservation.title}
                    onChange={(event) =>
                      setReservation({
                        ...reservation,
                        title: event.target.value,
                      })
                    }
                    placeholder={ko ? "예약 이름" : "Reservation name"}
                    className={`w-full ${control}`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={reservation.type}
                      onChange={(event) =>
                        setReservation({
                          ...reservation,
                          type: event.target.value,
                        })
                      }
                      className={control}
                    >
                      <option>Stay</option>
                      <option>Flight</option>
                      <option>Tour</option>
                      <option>Transport</option>
                    </select>
                    <input
                      type="number"
                      value={reservation.cost}
                      onChange={(event) =>
                        setReservation({
                          ...reservation,
                          cost: event.target.value,
                        })
                      }
                      placeholder={ko ? "비용 (원)" : "Cost (KRW)"}
                      className={control}
                    />
                  </div>
                  <input
                    type="date"
                    lang="ko-KR"
                    value={reservation.date}
                    onChange={(event) =>
                      setReservation({
                        ...reservation,
                        date: event.target.value,
                      })
                    }
                    className={`w-full ${control}`}
                  />
                  <button className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-bold text-white">
                    {ko ? "예약 저장" : "Save reservation"}
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
        <section className="card mt-5 p-6 sm:p-7" id="currency-plan">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">
                {ko ? "환전 계획" : "Currency plan"}
              </p>
              <h2 className="text-xl font-bold">
                {ko ? "환전 계획 세우기" : "Plan your exchange"}
              </h2>
              <p className="mt-1 text-sm muted">
                {ko ? "최신 자동 환율 ·" : "Latest automatic rate ·"} {exchange.from} →{" "}
                {exchange.to}
              </p>
            </div>
            <Link
              href={`/trips/${tripId}/before/budget`}
              className="text-sm font-bold text-[var(--color-primary)]"
            >
              {ko ? "예산 상세 →" : "Budget details →"}
            </Link>
          </div>
          <form
            onSubmit={submitExchange}
            className="mt-6 grid gap-3 sm:grid-cols-3"
          >
            <label className="text-xs font-bold">
              {ko ? "출발 통화" : "From"}
              <select
                value={exchange.from}
                onChange={(event) =>
                  setExchange({ ...exchange, from: event.target.value })
                }
                className={`mt-2 w-full ${control}`}
              >
                <option>KRW</option>
                <option>USD</option>
              </select>
            </label>
            <label className="text-xs font-bold">
              {ko ? "도착 통화" : "To"}
              <select
                value={exchange.to}
                onChange={(event) =>
                  setExchange({ ...exchange, to: event.target.value })
                }
                className={`mt-2 w-full ${control}`}
              >
                {['JPY', 'VND', 'EUR', 'USD', 'THB', 'TWD', 'CNY', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD'].map((currency) => <option key={currency}>{currency}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold">
              {ko ? `환율 (${exchangeUnitLabel} 기준)` : `Rate (per ${exchangeUnitLabel})`}
              <div className={`mt-2 flex min-h-11 items-center justify-between ${control} ${rateLoading ? "opacity-60" : ""}`}>
                <span>{rateLoading ? (ko ? "불러오는 중…" : "Loading…") : Number(displayedRate).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[11px] font-normal muted">{rateDate ? `${ko ? "기준일" : "As of"} ${rateDate}` : ko ? "자동" : "Automatic"}</span>
              </div>
            </label>
            <label className="text-xs font-bold">
              {ko ? "예상 현금" : "Expected cash"}
              <MoneyInput
                value={exchange.expectedCash}
                onChange={(value) => setExchange({ ...exchange, expectedCash: value })}
                className={`mt-2 w-full ${control}`}
              />
            </label>
            <label className="text-xs font-bold">
              {ko ? "카드 예상액" : "Card estimate"}
              <MoneyInput
                value={exchange.cardEstimate}
                onChange={(value) => setExchange({ ...exchange, cardEstimate: value })}
                className={`mt-2 w-full ${control}`}
              />
            </label>
            <label className="text-xs font-bold">
              {ko ? "실제 환전액" : "Actual exchanged"}
              <MoneyInput
                value={exchange.actualExchange}
                onChange={(value) => setExchange({ ...exchange, actualExchange: value })}
                className={`mt-2 w-full ${control}`}
              />
            </label>
            <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white sm:col-span-3">
              {ko ? "환전 계획 저장" : "Save currency plan"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

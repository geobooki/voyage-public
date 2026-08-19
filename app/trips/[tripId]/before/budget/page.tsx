"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { totalsByCurrency } from "@/lib/money";
import { useLanguage } from "@/lib/i18n";
import { useTripData } from "@/lib/trip-context";

const control =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]";
const defaultRates: Record<string, number> = {
  KRW: 1,
  JPY: 9.2,
  USD: 1350,
  EUR: 1500,
  GBP: 1750,
  CNY: 190,
  TWD: 42,
  THB: 39,
  VND: 0.054,
  SGD: 1050,
  AUD: 880,
  CAD: 980,
  HKD: 175,
  PHP: 24,
};
const currencies = Object.keys(defaultRates);
const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString()}`;

type FormState = {
  name: string;
  detail: string;
  category: string;
  amount: string;
  currency: string;
  paymentMethod: string;
};

export default function BudgetPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const {
    state,
    addBudget,
    updateBudget,
    removeBudget,
    addBudgetCategory,
    renameBudgetCategory,
    removeBudgetCategory,
    addPaymentMethod,
    renamePaymentMethod,
    removePaymentMethod,
  } = useTripData();
  const [item, setItem] = useState<FormState>({
    name: "",
    detail: "",
    category: state.budgetCategories[0] || "기타",
    amount: "",
    currency: "KRW",
    paymentMethod: state.paymentMethods[0] || "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rates, setRates] = useState(defaultRates);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const loadRates = async () => {
    setRateLoading(true);
    setRateError("");
    try {
      const response = await fetch("/api/exchange-rates", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        rates?: Record<string, number>;
        date?: string;
        error?: string;
      };
      if (!response.ok || !data.rates)
        throw new Error(data.error || "환율을 불러오지 못했습니다.");
      setRates((current) => ({ ...current, ...data.rates }));
      setRateDate(data.date || null);
    } catch (error) {
      setRateError(
        error instanceof Error
          ? error.message
          : ko
            ? "환율을 불러오지 못했습니다."
            : "Could not load exchange rates.",
      );
    } finally {
      setRateLoading(false);
    }
  };
  useEffect(() => {
    void loadRates();
  }, []);
  const totalKrw = useMemo(
    () =>
      state.budget.reduce(
        (sum, entry) =>
          sum + entry.amount * (rates[entry.currency || "KRW"] || 0),
        0,
      ),
    [rates, state.budget],
  );
  const totals = totalsByCurrency(state.budget);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !item.name.trim() ||
      !item.amount ||
      !item.category ||
      !item.currency ||
      !item.paymentMethod
    )
      return;
    const payload = {
      name: item.name.trim(),
      detail: item.detail.trim() || undefined,
      category: item.category,
      amount: Number(item.amount),
      currency: item.currency,
      paymentMethod: item.paymentMethod,
    };
    if (editingId) updateBudget(editingId, payload);
    else addBudget(payload);
    setEditingId(null);
    setItem({ ...item, name: "", detail: "", amount: "" });
  };
  const edit = (entry: (typeof state.budget)[number]) => {
    setEditingId(entry.id);
    setItem({
      name: entry.name || "",
      detail: entry.detail || "",
      category: entry.category,
      amount: String(entry.amount),
      currency: entry.currency || "KRW",
      paymentMethod: entry.paymentMethod || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const value = newCategory.trim();
    if (!value) return;
    addBudgetCategory(value);
    setItem((current) => ({ ...current, category: value }));
    setNewCategory("");
  };
  const addPayment = (event: FormEvent) => {
    event.preventDefault();
    const value = newPayment.trim();
    if (!value) return;
    addPaymentMethod(value);
    setItem((current) => ({ ...current, paymentMethod: value }));
    setNewPayment("");
  };
  const manageList = (
    list: string[],
    rename: (from: string, to: string) => void,
    remove: (name: string) => void,
    kind: string,
  ) =>
    list.map((entry) => (
      <div className="flex items-center gap-2" key={entry}>
        <span className="min-w-0 flex-1 truncate text-sm">{entry}</span>
        <button
          type="button"
          onClick={() => {
            const next = window
              .prompt(
                ko ? `${kind} 이름을 수정하세요` : `Rename ${kind}`,
                entry,
              )
              ?.trim();
            if (next && next !== entry) rename(entry, next);
          }}
          className="text-xs font-bold text-[var(--color-primary)]"
        >
          {ko ? "수정" : "Edit"}
        </button>
        <button
          type="button"
          onClick={() => remove(entry)}
          className="text-xs font-bold text-[var(--color-danger)]"
        >
          {ko ? "삭제" : "Delete"}
        </button>
      </div>
    ));
  return (
    <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/trips/${tripId}/before`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← {ko ? "여행 전 개요" : "Before overview"}
        </Link>
        <p className="eyebrow mt-10 mb-3">{ko ? "예산" : "Estimated budget"}</p>
        <h1 className="text-4xl font-bold">
          {ko ? "여행 비용을 미리 계획해요." : "Give every cost a purpose."}
        </h1>
        <p className="mt-2 muted">
          {ko
            ? "원화 환산 총액과 통화별 합계를 함께 확인하세요."
            : "See the KRW estimate and totals separated by currency."}
        </p>
        <section className="mt-9 grid gap-5 md:grid-cols-3">
          <div className="card bg-[var(--color-primary)] p-6 text-white md:col-span-2">
            <p className="text-sm font-semibold text-white/70">
              {ko ? "원화 기준 예상 총액" : "Estimated total in KRW"}
            </p>
            <p className="mt-3 text-4xl font-bold">
              ₩{Math.round(totalKrw).toLocaleString("ko-KR")}
            </p>
            <p className="mt-3 text-xs text-white/70">
              {rateLoading
                ? ko
                  ? "최신 환율을 불러오는 중…"
                  : "Loading latest rates…"
                : rateDate
                  ? ko
                    ? `기준일: ${rateDate}`
                    : `Rate date: ${rateDate}`
                  : ko
                    ? "저장된 환율을 사용 중입니다."
                    : "Using saved rates."}
            </p>
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-2">{ko ? "통화별 합계" : "By currency"}</p>
            <div className="space-y-2">
              {Object.entries(totals).length ? (
                Object.entries(totals).map(([currency, amount]) => (
                  <p className="flex justify-between text-sm" key={currency}>
                    <span className="muted">{currency}</span>
                    <strong>{amount.toLocaleString()}</strong>
                  </p>
                ))
              ) : (
                <p className="text-sm muted">
                  {ko ? "아직 항목이 없습니다." : "No items yet."}
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="card mt-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">
                {ko ? "예산 항목" : "Budget items"}
              </p>
              <h2 className="text-xl font-bold">
                {editingId
                  ? ko
                    ? "항목 수정"
                    : "Edit item"
                  : ko
                    ? "새 항목 추가"
                    : "Add an item"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setItem({ ...item, name: "", detail: "", amount: "" });
                }}
                className="text-sm font-bold text-[var(--color-primary)]"
              >
                {ko ? "편집 취소" : "Cancel"}
              </button>
            )}
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              value={item.name}
              onChange={(event) =>
                setItem({ ...item, name: event.target.value })
              }
              placeholder={
                ko ? "항목 이름 (예: 도쿄 왕복 항공권)" : "Item name"
              }
              className={control}
            />
            <select
              value={item.category}
              onChange={(event) =>
                setItem({ ...item, category: event.target.value })
              }
              className={control}
            >
              {state.budgetCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <input
              value={item.detail}
              onChange={(event) =>
                setItem({ ...item, detail: event.target.value })
              }
              placeholder={ko ? "세부사항 (예: 수하물 포함)" : "Details"}
              className={control}
            />
            <select
              value={item.paymentMethod}
              onChange={(event) =>
                setItem({ ...item, paymentMethod: event.target.value })
              }
              className={control}
            >
              <option value="">
                {ko ? "결제수단 선택" : "Payment method"}
              </option>
              {state.paymentMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
            <input
              required
              type="number"
              min="0"
              value={item.amount}
              onChange={(event) =>
                setItem({ ...item, amount: event.target.value })
              }
              placeholder={ko ? "금액" : "Amount"}
              className={control}
            />
            <select
              value={item.currency}
              onChange={(event) =>
                setItem({ ...item, currency: event.target.value })
              }
              className={control}
            >
              {currencies.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
            <button className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white sm:col-span-2">
              {editingId
                ? ko
                  ? "항목 저장"
                  : "Save item"
                : ko
                  ? "예산 항목 추가"
                  : "Add budget item"}
            </button>
          </form>
          <div className="mt-7 space-y-3">
            {state.budget.map((entry) => (
              <article
                className="rounded-2xl bg-[var(--color-background)] p-4"
                key={entry.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{entry.name || entry.category}</p>
                    <p className="mt-1 text-xs muted">
                      {entry.category}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                      {entry.paymentMethod ? ` · ${entry.paymentMethod}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong>
                      {money(entry.amount, entry.currency || "KRW")}
                    </strong>
                    <button
                      type="button"
                      onClick={() => edit(entry)}
                      className="text-xs font-bold text-[var(--color-primary)]"
                    >
                      {ko ? "수정" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBudget(entry.id)}
                      className="text-xs font-bold text-[var(--color-danger)]"
                    >
                      {ko ? "삭제" : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="card mt-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">
                {ko ? "환율 설정" : "Exchange rates"}
              </p>
              <h2 className="text-xl font-bold">
                {ko ? "최신 환율로 원화 환산" : "Latest rates for KRW totals"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void loadRates()}
              disabled={rateLoading}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-primary)] disabled:opacity-50"
            >
              {rateLoading
                ? ko
                  ? "불러오는 중…"
                  : "Loading…"
                : ko
                  ? "환율 새로고침"
                  : "Refresh rates"}
            </button>
          </div>
          {rateError && (
            <p className="mt-4 rounded-xl bg-[var(--color-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">
              {rateError}
            </p>
          )}
          <p className="mt-3 text-sm muted">
            {ko
              ? "무료 공개 환율 API의 최신 영업일 기준입니다. 엔화와 베트남동은 100단위 기준으로 표시합니다."
              : "Latest working-day reference rates from a free public API. JPY and VND are shown per 100 units."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {currencies
              .filter((currency) => currency !== "KRW")
              .map((currency) => (
                <label className="text-xs font-bold" key={currency}>
                  {currency === "JPY" || currency === "VND" ? `100 ${currency}` : currency} → KRW
                  <input
                    type="number"
                    step="0.01"
                    value={(rates[currency] * (currency === "JPY" || currency === "VND" ? 100 : 1)).toFixed(2)}
                    readOnly
                    className={`mt-2 ${control}`}
                  />
                </label>
              ))}
          </div>
        </section>
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="eyebrow mb-2">
              {ko ? "카테고리 관리" : "Category management"}
            </p>
            <form onSubmit={addCategory} className="mt-4 flex gap-2">
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder={ko ? "새 카테고리" : "New category"}
                className={`min-w-0 flex-1 ${control}`}
              />
              <button className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white">
                {ko ? "추가" : "Add"}
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {manageList(
                state.budgetCategories,
                renameBudgetCategory,
                removeBudgetCategory,
                ko ? "카테고리" : "category",
              )}
            </div>
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-2">
              {ko ? "결제수단 관리" : "Payment methods"}
            </p>
            <form onSubmit={addPayment} className="mt-4 flex gap-2">
              <input
                value={newPayment}
                onChange={(event) => setNewPayment(event.target.value)}
                placeholder={ko ? "새 결제수단" : "New payment method"}
                className={`min-w-0 flex-1 ${control}`}
              />
              <button className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white">
                {ko ? "추가" : "Add"}
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {manageList(
                state.paymentMethods,
                renamePaymentMethod,
                removePaymentMethod,
                ko ? "결제수단" : "payment method",
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

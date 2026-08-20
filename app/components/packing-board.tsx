"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { usePacking } from "@/lib/packing-context";

const control = "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export function PackingBoard({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const ko = language === "ko";
  const { items, categories, toggleItem, addItem, removeItem, addCategory, updateCategories, removeCategory } = usePacking();
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [category, setCategory] = useState("기타");
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortMode, setSortMode] = useState<"category" | "name">("category");
  const [managerOpen, setManagerOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { name: string; color: string }>>({});
  const itemInputRef = useRef<HTMLInputElement>(null);
  const previousItemCount = useRef(items.length);

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((item) => item.name === category)) setCategory(categories[0].name);
  }, [categories, category]);
  useEffect(() => {
    if (items.length > previousItemCount.current) {
      itemInputRef.current?.focus();
      itemInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    previousItemCount.current = items.length;
  }, [items.length]);

  const completed = items.filter((item) => item.checked);
  const incomplete = items.filter((item) => !item.checked);
  const ordered = (list: typeof items) => [...list].sort((a, b) =>
    sortMode === "category" ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name),
  );
  const boards = (list: typeof items) => {
    const known = categories.map((item) => ({ category: item, items: ordered(list).filter((entry) => entry.category === item.name) })).filter((board) => board.items.length);
    const knownNames = new Set(categories.map((item) => item.name));
    const unknown = [...new Set(list.map((item) => item.category).filter((name) => !knownNames.has(name)))];
    return [...known, ...unknown.map((name) => ({ category: { id: `legacy-${name}`, name, color: "#FEF3C7" }, items: ordered(list).filter((item) => item.category === name) }))];
  };
  const categoryBoards = boards(items);
  const submitItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newItem.trim()) return;
    addItem({ name: newItem.trim(), category: category || categories[0]?.name || "기타", checked: false });
    setNewItem("");
  };
  const submitCategory = (event: FormEvent) => {
    event.preventDefault();
    if (!newCategory.trim()) return;
    addCategory({ name: newCategory.trim(), color: "" });
    setCategory(newCategory.trim());
    setNewCategory("");
  };
  const openManager = () => {
    setDrafts(Object.fromEntries(categories.map((item) => [item.id, { name: item.name, color: item.color }])));
    setManagerOpen(true);
  };
  const saveCategories = () => {
    const next = categories.map((item) => ({ ...item, ...drafts[item.id], name: drafts[item.id]?.name.trim() || item.name }));
    updateCategories(next);
    setManagerOpen(false);
  };
  const title = compact ? (ko ? "준비물 현황" : "Packing status") : (ko ? "준비물 목록" : "Packing list");

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">{ko ? "여행 전" : "Before the trip"}</p>
          <h2 className="text-2xl font-bold">{title}</h2>
          {!compact && <p className="mt-2 muted">{ko ? "카테고리별로 필요한 준비물을 관리해요." : "Keep every item organized by category."}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as "category" | "name")} className="rounded-lg border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs font-bold">
            <option value="category">{ko ? "카테고리순" : "Category"}</option>
            <option value="name">{ko ? "이름순" : "Name"}</option>
          </select>
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            {completed.length} / {items.length} {ko ? "완료" : "complete"}
          </span>
          {completed.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCompleted((value) => !value)}
              aria-pressed={showCompleted}
              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary)]"
            >
              {showCompleted ? (ko ? "숨기기" : "Hide") : ko ? "보기" : "Show"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {categoryBoards.map((board) => {
          const pending = board.items.filter((item) => !item.checked);
          const done = board.items.filter((item) => item.checked);
          return (
            <div
              key={board.category.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              <div
                className="mb-2 rounded-xl px-3 py-2 text-xs font-bold"
                style={{ backgroundColor: board.category.color }}
              >
                {board.category.name}
              </div>
              <div className="space-y-1">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleItem(item.id)}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    <span className="flex-1 text-sm font-semibold">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-bold text-[var(--color-danger)]"
                      aria-label={
                        ko ? `${item.name} 삭제` : `Delete ${item.name}`
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                {showCompleted && done.length > 0 && (
                  <>
                    <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[11px] font-bold muted">
                      {ko ? "완료된 준비물" : "Completed"}
                    </p>
                    {done.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2"
                      >
                        <input
                          type="checkbox"
                          checked
                          onChange={() => toggleItem(item.id)}
                          className="size-4 accent-[var(--color-primary)]"
                        />
                        <span className="flex-1 text-sm font-semibold line-through text-[var(--color-text-muted)]">
                          {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-sm font-bold text-[var(--color-danger)]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {!pending.length && (!showCompleted || !done.length) && (
                  <p className="py-2 text-xs muted">
                    {ko ? "아직 준비물이 없어요." : "No items yet."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {!items.length && (
          <p className="py-6 text-sm muted">
            {ko
              ? "아직 준비물이 없어요. 아래에서 추가해 주세요."
              : "No packing items yet. Add one below."}
          </p>
        )}
      </div>

      <form
        onSubmit={submitItem}
        className="mt-5 grid gap-2 border-t border-[var(--color-border)] pt-5 sm:grid-cols-[1fr_auto]"
      >
        <input
          ref={itemInputRef}
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder={ko ? "준비물 추가" : "Add an item"}
          className={`min-w-0 ${control}`}
        />
        <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">
          {ko ? "추가" : "Add"}
        </button>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={`sm:col-span-2 ${control}`}
          aria-label={ko ? "준비물 카테고리" : "Packing category"}
        >
          {categories.map((item) => (
            <option key={item.id}>{item.name}</option>
          ))}
        </select>
      </form>

      <div className="mt-5 border-t border-[var(--color-border)] pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold muted">
            {ko ? "카테고리 관리" : "Category management"}
          </p>
          <button
            type="button"
            onClick={openManager}
            className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-bold"
          >
            {ko ? "관리" : "Manage"}
          </button>
        </div>
        <form onSubmit={submitCategory} className="mt-3 flex gap-2">
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
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => (
            <span
              key={item.id}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: item.color }}
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>

      {managerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-5">
          <div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {ko ? "카테고리 관리" : "Manage categories"}
                </h3>
                <p className="mt-1 text-xs muted">
                  {ko
                    ? "변경사항은 저장할 때 한 번에 반영돼요."
                    : "All changes are applied together when you save."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagerOpen(false)}
                className="text-xl"
              >
                ×
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {categories.map((item) => {
                const draft = drafts[item.id] || item;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--color-border)] p-3"
                  >
                    <div className="flex gap-2">
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, name: event.target.value },
                          }))
                        }
                        className={`min-w-0 flex-1 ${control}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          removeCategory(item.id);
                          setDrafts((current) => {
                            const next = { ...current };
                            delete next[item.id];
                            return next;
                          });
                        }}
                        className="rounded-xl border border-[var(--color-danger)] px-3 text-sm font-bold text-[var(--color-danger)]"
                        aria-label={
                          ko ? `${item.name} 삭제` : `Delete ${item.name}`
                        }
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        "#D9F99D",
                        "#BAE6FD",
                        "#DDD6FE",
                        "#FBCFE8",
                        "#BBF7D0",
                        "#FED7AA",
                      ].map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() =>
                            setDrafts((current) => ({
                              ...current,
                              [item.id]: { ...draft, color },
                            }))
                          }
                          className={`size-8 rounded-full border-2 ${draft.color === color ? "border-black" : "border-white"}`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
              <button
                type="button"
                onClick={() => setManagerOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold"
              >
                {ko ? "취소" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={saveCategories}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
              >
                {ko ? "일괄 저장" : "Save all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

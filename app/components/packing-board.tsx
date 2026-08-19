"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { usePacking } from "@/lib/packing-context";

const control = "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";

export function PackingBoard({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const ko = language === "ko";
  const { items, categories, toggleItem, addItem, removeItem, addCategory, updateCategory, removeCategory } = usePacking();
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [category, setCategory] = useState("기타");
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortMode, setSortMode] = useState<"category" | "name">("category");
  const [managerOpen, setManagerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState({ name: "", color: "#FEF3C7" });

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((item) => item.name === category)) setCategory(categories[0].name);
    if (!selectedId) {
      setSelectedId(categories[0].id);
      setDraft({ name: categories[0].name, color: categories[0].color });
    }
  }, [categories, category, selectedId]);

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
  const submitItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newItem.trim()) return;
    addItem({ name: newItem.trim(), category: category || categories[0]?.name || "기타", checked: false });
    setNewItem("");
  };
  const submitCategory = (event: FormEvent) => {
    event.preventDefault();
    if (!newCategory.trim()) return;
    addCategory({ name: newCategory.trim(), color: "#FEF3C7" });
    setCategory(newCategory.trim());
    setNewCategory("");
  };
  const openManager = () => {
    const first = categories[0];
    if (first) {
      setSelectedId(first.id);
      setDraft({ name: first.name, color: first.color });
    }
    setManagerOpen(true);
  };
  const selected = categories.find((item) => item.id === selectedId);
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
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{completed.length} / {items.length} {ko ? "완료" : "complete"}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {boards(incomplete).map((board) => (
          <div key={board.category.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <div className="mb-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ backgroundColor: board.category.color }}>{board.category.name}</div>
            <div className="space-y-1">
              {board.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2">
                  <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} className="size-4 accent-[var(--color-primary)]" />
                  <span className="flex-1 text-sm font-semibold">{item.name}</span>
                  <button type="button" onClick={() => removeItem(item.id)} className="text-sm font-bold text-[var(--color-danger)]" aria-label={ko ? `${item.name} 삭제` : `Delete ${item.name}`}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!incomplete.length && <p className="py-6 text-sm muted">{ko ? "아직 준비물이 없어요. 아래에서 추가해 주세요." : "No packing items yet. Add one below."}</p>}
      </div>

      {completed.length > 0 && <button type="button" onClick={() => setShowCompleted((value) => !value)} className="mt-4 text-sm font-bold text-[var(--color-primary)]">{showCompleted ? (ko ? "완료한 준비물 숨기기" : "Hide completed") : (ko ? `완료한 준비물 ${completed.length}개 보기` : `Show ${completed.length} completed`)}</button>}
      {showCompleted && <div className="mt-5 border-t border-[var(--color-border)] pt-4"><p className="mb-2 text-xs font-bold muted">{ko ? "완료된 준비물" : "Completed items"}</p><div className="grid gap-3 sm:grid-cols-2">{boards(completed).map((board) => <div key={board.category.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"><div className="mb-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ backgroundColor: board.category.color }}>{board.category.name}</div>{board.items.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-2 py-2"><input type="checkbox" checked onChange={() => toggleItem(item.id)} className="size-4 accent-[var(--color-primary)]" /><span className="flex-1 text-sm font-semibold line-through text-[var(--color-text-muted)]">{item.name}</span><button type="button" onClick={() => removeItem(item.id)} className="text-sm font-bold text-[var(--color-danger)]">×</button></div>)}</div>)}</div></div>}

      <form onSubmit={submitItem} className="mt-5 grid gap-2 border-t border-[var(--color-border)] pt-5 sm:grid-cols-[1fr_auto]">
        <input value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder={ko ? "준비물 추가" : "Add an item"} className={`min-w-0 ${control}`} />
        <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "추가" : "Add"}</button>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className={`sm:col-span-2 ${control}`} aria-label={ko ? "준비물 카테고리" : "Packing category"}>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select>
      </form>

      <div className="mt-5 border-t border-[var(--color-border)] pt-5">
        <div className="flex items-center justify-between"><p className="text-xs font-bold muted">{ko ? "카테고리 관리" : "Category management"}</p><button type="button" onClick={openManager} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-bold">{ko ? "관리" : "Manage"}</button></div>
        <form onSubmit={submitCategory} className="mt-3 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={ko ? "새 카테고리" : "New category"} className={`min-w-0 flex-1 ${control}`} /><button className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold">{ko ? "추가" : "Add"}</button></form>
        <div className="mt-3 flex flex-wrap gap-2">{categories.map((item) => <span key={item.id} className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: item.color }}>{item.name}</span>)}</div>
      </div>

      {managerOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-5"><div className="card w-full max-w-md p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">{ko ? "카테고리 관리" : "Manage categories"}</h3><button type="button" onClick={() => setManagerOpen(false)} className="text-xl">×</button></div><div className="mt-4 grid grid-cols-2 gap-2">{categories.map((item) => <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setDraft({ name: item.name, color: item.color }); }} className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${selectedId === item.id ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"}`} style={{ backgroundColor: item.color }}>{item.name}</button>)}</div>{selected && <><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={`mt-3 w-full ${control}`} /><div className="mt-3 flex flex-wrap gap-2">{["#FEF3C7", "#DBEAFE", "#E0E7FF", "#FCE7F3", "#DCFCE7", "#FECACA"].map((color) => <button type="button" key={color} onClick={() => setDraft({ ...draft, color })} className={`size-8 rounded-full border-2 ${draft.color === color ? "border-black" : "border-white"}`} style={{ backgroundColor: color }} aria-label={color} />)}</div><div className="mt-5 flex gap-2"><button type="button" onClick={() => { if (draft.name.trim()) updateCategory(selected.id, { name: draft.name.trim(), color: draft.color }); setManagerOpen(false); }} className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-bold text-white">{ko ? "저장" : "Save"}</button><button type="button" onClick={() => { removeCategory(selected.id); setManagerOpen(false); }} className="rounded-xl border border-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-[var(--color-danger)]">{ko ? "삭제" : "Delete"}</button></div></>}</div></div>}
    </section>
  );
}

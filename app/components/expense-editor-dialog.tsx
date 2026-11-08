"use client";
import { useEffect, useId, useRef } from "react";
export function ExpenseEditorDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: React.ReactNode }) {
  const id = useId(), root = useRef<HTMLElement>(null), close = useRef(onClose), saving = useRef(busy); close.current = onClose; saving.current = busy;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; root.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving.current) { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary') || []).filter((node) => node.getClientRects().length && node.getAttribute("type") !== "hidden");
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    };
    document.addEventListener("keydown", key); return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", key); previous?.focus({ preventScroll: true }); };
  }, []);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-3 py-4"><section ref={root} role="dialog" aria-modal="true" aria-labelledby={id} style={{ maxHeight: "88dvh", overflowY: "auto" }} className="card max-h-[88dvh] w-full max-w-2xl overflow-y-auto p-4 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 id={id} className="text-lg font-semibold">{title}</h2><button type="button" disabled={busy} aria-label="닫기" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-xl">×</button></div>{children}</section></div>;
}

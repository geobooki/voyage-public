"use client";
import { themes } from "@/lib/themes";
import { useTheme } from "./theme-provider";
import { useLanguage } from "@/lib/i18n";
export function ThemePicker() {
  const { theme, setTheme } = useTheme(); const { language } = useLanguage(); const ko = language === "ko";
  return <section className="card mt-5 p-6 sm:p-7"><h2 className="text-xl font-semibold">{ko ? "색상 테마" : "Color theme"}</h2><p className="mt-2 text-sm muted">{ko ? "배경과 버튼, 메뉴 색상이 함께 바뀌어요. 이 브라우저에 저장돼요." : "Changes backgrounds, buttons and menus. Saved in this browser."}</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{themes.map((option) => <button type="button" key={option.id} aria-pressed={theme === option.id} onClick={() => setTheme(option.id)} className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm ${theme === option.id ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)]" : "border-[var(--color-border)] bg-white"}`}><span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-black/10" style={{ background: option.swatch }}/><span className="min-w-0">{ko ? option.ko : option.en}{theme === option.id ? " ✓" : ""}</span></button>)}</div></section>;
}

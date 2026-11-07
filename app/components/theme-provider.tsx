"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { THEME_KEY, ThemeId, validTheme } from "@/lib/themes";
const ThemeContext = createContext<{ theme: ThemeId; setTheme: (theme: ThemeId) => void }>({ theme: "blue", setTheme: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<ThemeId>("blue");
  useEffect(() => {
    const read = () => { let next: ThemeId = "blue"; try { next = validTheme(localStorage.getItem(THEME_KEY)); } catch {} updateTheme(next); document.documentElement.dataset.theme = next; };
    read(); const sync = (event: StorageEvent) => { if (event.key === THEME_KEY || event.key === null) read(); };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  const setTheme = (value: ThemeId) => { const next = validTheme(value); updateTheme(next); document.documentElement.dataset.theme = next; try { localStorage.setItem(THEME_KEY, next); } catch {} };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);

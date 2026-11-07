export const THEME_KEY = "voyage:color-theme";
export const themes = [
  { id: "blue", ko: "기본 파랑", en: "Blue", swatch: "#B9D7F5" },
  { id: "lavender", ko: "파스텔 보라", en: "Lavender", swatch: "#D9CBEA" },
  { id: "pink", ko: "연분홍", en: "Soft pink", swatch: "#F1CDD9" },
  { id: "mint", ko: "민트", en: "Mint", swatch: "#BFE2D5" },
  { id: "brown", ko: "연한 갈색", en: "Light brown", swatch: "#DDC9B8" },
  { id: "yellow", ko: "연노랑", en: "Soft yellow", swatch: "#F1E3A8" },
  { id: "coral", ko: "연다홍", en: "Soft coral", swatch: "#F2C8B9" },
  { id: "mauve", ko: "연자주", en: "Mauve", swatch: "#DFC3D6" },
] as const;
export type ThemeId = (typeof themes)[number]["id"];
export const validTheme = (value: unknown): ThemeId => themes.find((theme) => theme.id === value)?.id || "blue";
// Runs before the app paints, so the saved palette does not flash blue.
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});document.documentElement.dataset.theme=${JSON.stringify(themes.map(theme => theme.id))}.includes(t)?t:"blue"}catch{}`;

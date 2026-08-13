import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "./components/app-nav";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = { title: "Voyage — 여행 기록", description: "여행 전·중·후를 한 곳에서 관리하는 여행 기록 앱" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><LanguageProvider><AppNav /><div className="md:pl-24">{children}</div></LanguageProvider></body></html>;
}

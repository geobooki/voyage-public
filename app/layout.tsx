import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "./components/app-nav";

export const metadata: Metadata = { title: "Voyage — travel, beautifully kept", description: "여행 전·중·후를 한 곳에서 관리하는 여행 기록 앱" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><AppNav /><div className="md:pl-24">{children}</div></body></html>;
}

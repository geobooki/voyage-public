import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "./components/app-nav";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { LocaleBridge } from "@/lib/locale-bridge";

export const metadata: Metadata = {
  title: "Voyage — 여행 기록",
  description: "여행 전·중·후를 한 곳에서 관리하는 여행 기록 앱",
  icons: { icon: "/icon.svg" },
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <AppNav />
            <LocaleBridge />
            <div className="md:pl-24">{children}</div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

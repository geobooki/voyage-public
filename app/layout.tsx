import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "./components/app-nav";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { LocaleBridge } from "@/lib/locale-bridge";
import { AuthGuard } from "./components/auth-guard";

import { ThemeProvider } from "./components/theme-provider";
import { themeInitScript } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Voyage — 여행 기록",
  description: "여행 전·중·후를 한 곳에서 관리하는 여행 기록 앱",
  manifest: "/manifest.webmanifest?v=20261107-brown",
  icons: {
    icon: [{ url: "/icon.svg?v=20261107-brown", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png?v=20261107-brown", sizes: "180x180", type: "image/png" }],
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5EBE2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider><LanguageProvider>
          <AuthProvider>
            <AuthGuard>
              <AppNav />
              <LocaleBridge />
              <div className="md:pl-24">{children}</div>
            </AuthGuard>
          </AuthProvider>
        </LanguageProvider></ThemeProvider>
      </body>
    </html>
  );
}

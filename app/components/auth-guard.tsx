"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const publicPaths = ["/auth", "/auth/callback"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!loading && !user && !isPublic) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [isPublic, loading, pathname, router, user]);

  if (isPublic || user) return <>{children}</>;
  return <main className="grid min-h-screen place-items-center px-6"><p className="muted">로그인 확인 중…</p></main>;
}

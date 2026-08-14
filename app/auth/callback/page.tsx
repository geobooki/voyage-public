"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter(); const [error, setError] = useState("");
  useEffect(() => { const complete = async () => { if (!supabaseBrowser) { setError("Supabase is not configured."); return; } const code = new URLSearchParams(window.location.search).get("code"); const result = code ? await supabaseBrowser.auth.exchangeCodeForSession(code) : { error: null }; if (result.error) setError(result.error.message); else router.replace("/account"); }; void complete(); }, [router]);
  return <main className="grid min-h-screen place-items-center px-5"><div className="card max-w-md p-7 text-center"><p className="eyebrow mb-3">Voyage account</p><h1 className="text-2xl font-bold">{error || "이메일 인증을 확인하는 중입니다…"}</h1></div></main>;
}

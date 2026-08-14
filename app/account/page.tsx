"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";

export default function AccountPage() {
  const { language } = useLanguage(); const ko = language === "ko"; const { user, loading, signOut, updatePassword } = useAuth();
  const [resetMode, setResetMode] = useState(false); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => setResetMode(new URLSearchParams(window.location.search).get("reset") === "1"), []);
  const savePassword = async (event: FormEvent) => { event.preventDefault(); setError(""); setMessage(""); if (password !== confirm) { setError(ko ? "비밀번호가 일치하지 않습니다." : "Passwords do not match."); return; } const result = await updatePassword(password); if (result.error) setError(result.error); else window.location.href = "/"; };
  if (loading) return <main className="grid min-h-screen place-items-center">Loading…</main>;
  if (!user) return <main className="grid min-h-screen place-items-center px-5"><div className="card p-7 text-center"><h1 className="text-2xl font-bold">{ko ? "로그인이 필요합니다." : "Sign in required."}</h1><Link href="/auth" className="mt-5 inline-block rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{ko ? "로그인하기" : "Sign in"}</Link></div></main>;
  return <main className="min-h-screen px-5 py-8 pb-24 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-2xl"><Link href="/settings" className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "설정" : "Settings"}</Link><p className="eyebrow mt-10 mb-3">{ko ? "계정 설정" : "Account settings"}</p><h1 className="text-4xl font-bold">{ko ? "내 계정" : "Your account"}</h1><section className="card mt-9 p-7"><p className="eyebrow mb-2">Email</p><p className="text-xl font-bold break-all">{user.email}</p><p className="mt-2 text-sm muted">{user.email_confirmed_at ? (ko ? "이메일 인증 완료" : "Email verified") : (ko ? "이메일 인증 대기 중" : "Email verification pending")}</p></section><section className="card mt-5 p-7"><h2 className="text-xl font-bold">{ko ? "비밀번호 변경" : "Change password"}</h2>{(resetMode || user) && <form onSubmit={savePassword} className="mt-5 space-y-3"><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={ko ? "새 비밀번호" : "New password"} className={control} autoComplete="new-password"/><input required minLength={6} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder={ko ? "새 비밀번호 확인" : "Confirm new password"} className={control} autoComplete="new-password"/>{error && <p className="text-sm font-semibold text-[var(--color-warning)]">{error}</p>}{message && <p className="text-sm font-semibold text-[var(--color-primary)]">{message}</p>}<button className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">{ko ? "비밀번호 저장" : "Save password"}</button></form>}</section><button type="button" onClick={() => void signOut().then(() => { window.location.href = "/auth"; })} className="mt-6 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">{ko ? "로그아웃" : "Sign out"}</button></div></main>;
}

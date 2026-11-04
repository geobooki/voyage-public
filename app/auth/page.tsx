"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

type Mode = "signin" | "signup" | "forgot";
const control = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 outline-none focus:border-[var(--color-primary)]";
const withTimeout = <T,>(promise: Promise<T>, milliseconds = 12000) => Promise.race([
  promise,
  new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")), milliseconds)),
]);

export default function AuthPage() {
  const { language } = useLanguage();
  const ko = language === "ko";
  const { signIn, signInWithUsername, signUp, sendPasswordReset, configured } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState<"email" | "username">("email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailSent = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("emailSent") === "1";
  const title = mode === "signin" ? (ko ? "여행을 계속해요." : "Continue your journey.") : mode === "signup" ? (ko ? "계정을 만들어 보세요." : "Create your account.") : (ko ? "비밀번호를 찾아볼게요." : "Find your password.");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signin") {
        const result = identifier === "email" ? await signIn(email, password) : await signInWithUsername(username, password);
        if (result.error) setError(result.error); else window.location.href = "/";
      } else if (mode === "signup") {
        if (password !== confirm) { setError(ko ? "비밀번호가 일치하지 않습니다." : "Passwords do not match."); return; }
        if (identifier === "username" && !/^[a-zA-Z0-9가-힣_]{3,24}$/.test(username)) { setError(ko ? "아이디는 3~24자의 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다." : "Username must be 3–24 characters using letters, numbers, Korean, or underscore."); return; }
        const result = await signUp(email, password, identifier === "username" ? username : undefined);
        if (result.error) setError(result.error); else if (result.needsConfirmation) window.location.href = "/auth?emailSent=1"; else window.location.href = "/";
      } else {
        const result = await withTimeout(sendPasswordReset(email));
        if (result.error) setError(result.error); else setMessage(ko ? "비밀번호 재설정 메일을 확인하세요." : "Check your email for a password reset link.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (ko ? "요청에 실패했습니다." : "The request failed."));
    } finally { setBusy(false); }
  };

  const identifierToggle = mode !== "forgot" && <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1"><button type="button" onClick={() => setIdentifier("email")} className={`rounded-lg px-3 py-2 text-sm font-bold ${identifier === "email" ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm" : "muted"}`}>{ko ? "이메일" : "Email"}</button><button type="button" onClick={() => setIdentifier("username")} className={`rounded-lg px-3 py-2 text-sm font-bold ${identifier === "username" ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm" : "muted"}`}>{ko ? "아이디" : "Username"}</button></div>;
  return <main className="min-h-screen px-5 py-8 pb-24 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-md"><Link href="/settings" className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "설정" : "Settings"}</Link><div className="card mt-10 p-7 sm:p-9"><p className="eyebrow mb-3">Voyage account</p><h1 className="text-3xl font-bold">{title}</h1>{emailSent && <p className="mt-5 rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">{ko ? "인증 메일을 보냈습니다. 인증 후 로그인해 주세요." : "Confirmation email sent. Verify your email, then sign in."}</p>}{!configured && <p className="mt-5 rounded-xl bg-[var(--color-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">{ko ? "Supabase 환경변수를 먼저 설정하세요." : "Configure Supabase environment variables first."}</p>}<form onSubmit={submit} className="mt-7 space-y-4">{identifierToggle}{identifier === "email" || mode === "forgot" ? <label className="block text-sm font-bold">{ko ? "이메일" : "Email"}<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`mt-2 ${control}`} autoComplete="email" /></label> : <><label className="block text-sm font-bold">{ko ? "아이디" : "Username"}<input required value={username} onChange={(event) => setUsername(event.target.value)} className={`mt-2 ${control}`} autoComplete="username" placeholder="voyage_user" /></label>{mode === "signup" && <label className="block text-sm font-bold">{ko ? "인증·복구 이메일" : "Verification and recovery email"}<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`mt-2 ${control}`} autoComplete="email" /></label>}</>}{mode !== "forgot" && <label className="block text-sm font-bold">{ko ? "비밀번호" : "Password"}<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`mt-2 ${control}`} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>}{mode === "signup" && <label className="block text-sm font-bold">{ko ? "비밀번호 확인" : "Confirm password"}<input required minLength={6} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className={`mt-2 ${control}`} autoComplete="new-password" /></label>}{error && <p className="rounded-xl bg-[var(--color-error-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">{error}</p>}{message && <p className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">{message}</p>}<button disabled={busy || !configured} className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? (ko ? "처리 중…" : "Working…") : mode === "signin" ? (ko ? "로그인" : "Sign in") : mode === "signup" ? (ko ? "회원가입" : "Create account") : (ko ? "재설정 메일 보내기" : "Send reset email")}</button></form><div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-[var(--color-primary)]">{mode !== "signin" && <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }}>{ko ? "로그인으로" : "Back to sign in"}</button>}{mode === "signin" && <><button type="button" onClick={() => { setMode("signup"); setIdentifier("email"); }}>{ko ? "회원가입" : "Create account"}</button><button type="button" onClick={() => setMode("forgot")}>{ko ? "비밀번호 찾기" : "Forgot password"}</button></>}</div></div></div></main>;
}

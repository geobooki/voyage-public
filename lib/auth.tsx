"use client";

import { clearTripsCache } from "@/lib/trips-client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (
    email: string,
    password: string,
    username?: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signInWithUsername: (
    username: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  configured: false,
  signUp: async () => ({ error: null, needsConfirmation: false }),
  signIn: async () => ({ error: null }),
  signInWithUsername: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => undefined,
  sendPasswordReset: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

const message = (error: { message: string } | null) => error?.message || null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabaseBrowser) {
      setLoading(false);
      return;
    }
    let previousUser: string | null | undefined;
    const updateSession = (next: Session | null) => { const id = next?.user.id || null; if (id !== previousUser) { clearTripsCache(); previousUser = id; } setSession(next); };
    void supabaseBrowser.auth.getSession().then(({ data }) => {
      updateSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, nextSession) => updateSession(nextSession),
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user || null,
      session,
      loading,
      configured: Boolean(supabaseBrowser),
      signUp: async (email, password, username) => {
        if (!supabaseBrowser)
          return {
            error: "Supabase 환경변수가 설정되지 않았습니다.",
            needsConfirmation: false,
          };
        const { data, error } = await supabaseBrowser.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: username ? { username } : undefined,
          },
        });
        return {
          error: message(error),
          needsConfirmation: Boolean(data.user && !data.session),
        };
      },
      signIn: async (email, password) => {
        if (!supabaseBrowser)
          return { error: "Supabase 환경변수가 설정되지 않았습니다." };
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });
        return { error: message(error) };
      },
      signInWithUsername: async (username, password) => {
        if (!supabaseBrowser) return { error: "Supabase 환경변수가 설정되지 않았습니다." };
        const response = await fetch("/api/auth/username-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) return { error: String(result.error || "아이디 로그인에 실패했습니다.") };
        const { error } = await supabaseBrowser.auth.setSession({
          access_token: String(result.access_token),
          refresh_token: String(result.refresh_token),
        });
        return { error: message(error) };
      },
      signInWithGoogle: async () => {
        if (!supabaseBrowser)
          return { error: "Supabase 환경변수가 설정되지 않았습니다." };
        const { error } = await supabaseBrowser.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        return { error: message(error) };
      },
      signOut: async () => {
        if (supabaseBrowser) await supabaseBrowser.auth.signOut();
      },
      sendPasswordReset: async (email) => {
        if (!supabaseBrowser)
          return { error: "Supabase 환경변수가 설정되지 않았습니다." };
        const { error } = await supabaseBrowser.auth.resetPasswordForEmail(
          email,
          { redirectTo: `${window.location.origin}/account?reset=1` },
        );
        return { error: message(error) };
      },
      updatePassword: async (password) => {
        if (!supabaseBrowser)
          return { error: "Supabase 환경변수가 설정되지 않았습니다." };
        const { error } = await supabaseBrowser.auth.updateUser({ password });
        return { error: message(error) };
      },
    }),
    [loading, session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase-server";

const usernamePattern = /^[a-zA-Z0-9가-힣_]{3,24}$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!usernamePattern.test(username) || password.length < 6) {
    return NextResponse.json({ error: "아이디 또는 비밀번호를 확인하세요." }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseServer) {
    return NextResponse.json({ error: "아이디 로그인을 위해 Vercel에 SUPABASE_SERVICE_ROLE_KEY를 설정하세요." }, { status: 503 });
  }
  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("email")
    .eq("username", username)
    .maybeSingle();
  if (profileError || !profile?.email) return NextResponse.json({ error: "아이디 또는 비밀번호를 확인하세요." }, { status: 401 });
  const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await authClient.auth.signInWithPassword({ email: profile.email, password });
  if (error || !data.session) return NextResponse.json({ error: "아이디 또는 비밀번호를 확인하세요." }, { status: 401 });
  return NextResponse.json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
}

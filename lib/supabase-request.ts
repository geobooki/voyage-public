import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/** Create an anon-key Supabase client carrying the browser's access token. */
export function getRequestSupabase(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !token) return supabase;
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function requireRequestUser(request: Request) {
  const client = getRequestSupabase(request);
  if (!client) return { client: null, user: null, error: "Supabase environment variables are not configured." };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { client, user: null, error: "로그인이 필요합니다." };
  return { client, user: data.user, error: null };
}

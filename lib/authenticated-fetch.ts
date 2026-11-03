"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (supabaseBrowser) {
    const { data } = await supabaseBrowser.auth.getSession();
    if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}

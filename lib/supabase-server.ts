import { createClient } from "@supabase/supabase-js";
import { supabase as publicClient } from "@/lib/supabase";

// Storage routes use the service role when it is configured server-side.
// It must never be exposed through a NEXT_PUBLIC_ environment variable.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const supabaseServer =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : publicClient;

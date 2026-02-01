import { createClient } from "@supabase/supabase-js";
import { mustEnv } from "@/lib/env";

let _client;

export function supabaseServer() {
  if (_client) return _client;
  const url = mustEnv("SUPABASE_URL");
  const key = mustEnv("SUPABASE_SERVICE_ROLE_KEY"); // server-only
  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

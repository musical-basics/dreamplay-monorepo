import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Service-role Supabase client. Bypasses RLS — server-side only (route
 * handlers, server actions, webhooks, scripts). Never import from client
 * components and never expose the key to the browser.
 *
 * No session persistence or token refresh: every call authenticates with the
 * service-role key directly.
 */
export function createAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;

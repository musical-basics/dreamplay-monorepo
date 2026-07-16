import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Supabase client for browser / client components.
 *
 * Uses the public anon key; row access is governed by RLS (deny-by-default in
 * this schema, so this client is mostly useful for auth flows).
 * `@supabase/ssr` reuses a singleton under the hood, so calling this in every
 * component is fine.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}

export type BrowserClient = ReturnType<typeof createBrowserClient>;

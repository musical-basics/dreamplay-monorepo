import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Cookie adapter accepted by {@link createServerClient}.
 *
 * Structurally identical to `@supabase/ssr`'s `CookieMethodsServer`. This
 * package deliberately does NOT import `next/headers` (so it typechecks and
 * tests standalone); the caller passes an adapter built from the framework's
 * cookie store instead. See packages/db/README.md for the Next.js App Router
 * recipes (server components, route handlers, middleware).
 */
export type CookieAdapter = CookieMethodsServer;

/**
 * Supabase client for server components, route handlers, and server actions.
 *
 * Anon key + the user's auth cookies: queries run as the signed-in user under
 * RLS (e.g. reading their own reservation_decisions).
 *
 * Usage in Next.js (App Router):
 * ```ts
 * import { cookies } from "next/headers";
 * import { createServerClient } from "@dreamplay/db";
 *
 * const cookieStore = await cookies();
 * const supabase = createServerClient({
 *   getAll: () => cookieStore.getAll(),
 *   setAll: (cookiesToSet) => {
 *     try {
 *       cookiesToSet.forEach(({ name, value, options }) =>
 *         cookieStore.set(name, value, options)
 *       );
 *     } catch {
 *       // `set` throws in server components; middleware refreshes sessions.
 *     }
 *   },
 * });
 * ```
 */
export function createServerClient(cookies: CookieAdapter) {
  return createSupabaseServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies,
  });
}

export type ServerClient = ReturnType<typeof createServerClient>;

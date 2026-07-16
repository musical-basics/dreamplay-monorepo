import { cookies } from "next/headers";
import {
    createAdminClient,
    createServerClient,
    type AdminClient,
    type ServerClient,
} from "@dreamplay/db";

/**
 * Shared Supabase client helpers for apps/web.
 *
 * - `getServerDb()` — anon-key client bound to the request's auth cookies.
 *   Use in server components, route handlers, and server actions that act
 *   as the signed-in user (RLS applies).
 * - `getAdminDb()` — service-role client. Server-side only; bypasses RLS.
 *
 * Browser/client components should import `createBrowserClient` from
 * `@dreamplay/db` directly.
 */

export async function getServerDb(): Promise<ServerClient> {
    const cookieStore = await cookies();

    return createServerClient({
        getAll() {
            return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
            try {
                cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                );
            } catch {
                // `set` throws when called from a Server Component.
                // Safe to ignore — middleware refreshes user sessions.
            }
        },
    });
}

export function getAdminDb(): AdminClient {
    return createAdminClient();
}

/**
 * Internal env-var access with descriptive failures.
 *
 * IMPORTANT: the NEXT_PUBLIC_* vars MUST be read as static literal member
 * expressions (`process.env.NEXT_PUBLIC_X`) — Next.js inlines those into the
 * browser bundle at build time. Dynamic access (`process.env[name]`) is never
 * inlined, which makes the value undefined in the browser even when it is set
 * correctly in Vercel (server code keeps working, client code throws).
 */

function missing(name: string, hint: string): never {
  throw new Error(
    `@dreamplay/db: missing required environment variable ${name} (${hint}). ` +
      `Add it to apps/web/.env.local (see .env.example at the repo root).`
  );
}

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    missing("NEXT_PUBLIC_SUPABASE_URL", "the Supabase project URL, e.g. https://xyz.supabase.co")
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    missing("NEXT_PUBLIC_SUPABASE_ANON_KEY", "the public anon key from Supabase project settings > API")
  );
}

export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    missing(
      "SUPABASE_SERVICE_ROLE_KEY",
      "the secret service-role key from Supabase project settings > API — server-side only, never expose to the browser"
    )
  );
}

/** Internal env-var access with descriptive failures. */

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `@dreamplay/db: missing required environment variable ${name} (${hint}). ` +
        `Add it to apps/web/.env.local (see .env.example at the repo root).`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", "the Supabase project URL, e.g. https://xyz.supabase.co");
}

export function getSupabaseAnonKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "the public anon key from Supabase project settings > API"
  );
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "the secret service-role key from Supabase project settings > API — server-side only, never expose to the browser"
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDb, getServerDb } from "@/lib/db";

/**
 * /admin gate (Phase 3 task 6): Supabase-auth session + allowlist from the
 * `settings` table key `admin_emails` (jsonb array of emails). Replaces the
 * legacy shared-password HMAC. No list (or key absent) = nobody is admin —
 * a signed-in user then sees the bootstrap instructions instead of the
 * dashboards; everyone else is sent to /login.
 */

export const dynamic = "force-dynamic";

async function getSessionEmail(): Promise<string | null> {
  try {
    const db = await getServerDb();
    const { data } = await db.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    // Missing Supabase env / transient auth failure — treat as signed out.
    return null;
  }
}

async function getAdminEmails(): Promise<string[]> {
  try {
    const db = getAdminDb();
    const { data } = await db
      .from("settings")
      .select("value")
      .eq("key", "admin_emails")
      .maybeSingle();
    if (!data || !Array.isArray(data.value)) return [];
    return data.value.filter((v): v is string => typeof v === "string" && v.length > 0);
  } catch {
    // Key absent / unreadable = empty list = nobody is admin.
    return [];
  }
}

function SetupNotice({ email }: { email: string }) {
  // Empty-state bootstrap doc: admin_emails is seeded via SQL against the
  // settings table (NOT a migration — it's per-environment operational data).
  const seedSql = `insert into settings (key, value, description)
values (
  'admin_emails',
  '["${email}"]'::jsonb,
  'Emails allowed into /admin (jsonb array of strings)'
)
on conflict (key) do update set value = excluded.value;`;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full border border-white/10 bg-white/[0.03] p-8 md:p-10">
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">
          Admin setup required
        </p>
        <h1 className="font-serif text-2xl md:text-3xl mb-4">No admins are configured yet.</h1>
        <p className="font-sans text-sm text-white/60 leading-relaxed mb-6">
          You are signed in as <span className="text-white">{email}</span>, but the{" "}
          <code className="text-white/80">admin_emails</code> key in the <code className="text-white/80">settings</code>{" "}
          table is missing or empty, so nobody can access /admin. Seed it once with SQL (Supabase
          SQL editor or <code className="text-white/80">psql</code>) — no migration needed:
        </p>
        <pre className="bg-black/60 border border-white/10 p-4 overflow-x-auto text-xs font-mono text-emerald-300/90 leading-relaxed mb-6">
          {seedSql}
        </pre>
        <p className="font-sans text-xs text-white/40 leading-relaxed">
          Add more emails to the JSON array to grant more admins. Changes apply on the next page
          load — reload this page after running the SQL.
        </p>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail();
  if (!email) {
    redirect("/login?next=/admin");
  }

  const adminEmails = await getAdminEmails();
  const authorized = adminEmails.some((a) => a.toLowerCase() === email.toLowerCase());

  if (!authorized) {
    if (adminEmails.length === 0) {
      return <SetupNotice email={email} />;
    }
    redirect("/login?next=/admin");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-serif text-lg tracking-tight">
              DreamPlay <span className="text-white/50">Admin</span>
            </Link>
            <nav className="flex items-center gap-5 font-sans text-xs uppercase tracking-widest text-white/60">
              <Link href="/admin/analytics" className="hover:text-white transition-colors">
                Analytics
              </Link>
              <Link href="/admin/visitors" className="hover:text-white transition-colors">
                Visitors
              </Link>
              <Link href="/admin/ab-tests" className="hover:text-white transition-colors">
                A/B Tests
              </Link>
              <Link href="/admin/buyers" className="hover:text-white transition-colors">
                Buyers
              </Link>
            </nav>
          </div>
          <p className="font-sans text-xs text-white/40 truncate">{email}</p>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import {
    AUDIENCE_SETTING,
    CHECKOUT_INTENT_SIGNAL,
    parseAudienceSetting,
    signalsForTags,
} from "@/lib/marketing-calendar";
import { AudienceTable, type AudiencePerson } from "./AudienceTable";

/**
 * /admin/marketing-calendar/audience — review the high-intent group.
 *
 * The snapshot (built by scripts/email/setup-marketing-calendar.mjs) lives in
 * app_settings. This page lists every person with the signals that qualified
 * them; Lionel can exclude/restore individuals and the removals persist in
 * the same setting, surviving snapshot rebuilds.
 */

export const dynamic = "force-dynamic";

export default async function MarketingAudiencePage() {
    const db = getAdminDb();
    const { data: row } = await db.from("app_settings").select("value").eq("key", AUDIENCE_SETTING).maybeSingle();
    const setting = parseAudienceSetting(row?.value);

    if (!setting) {
        return (
            <div>
                <h1 className="font-serif text-3xl tracking-tight mb-4">Marketing Audience</h1>
                <p className="font-sans text-sm text-white/40 border border-white/10 bg-white/[0.02] p-6">
                    No audience snapshot found. Run{" "}
                    <code className="text-emerald-300">node scripts/email/setup-marketing-calendar.mjs --audience-only</code>{" "}
                    to build it.
                </p>
            </div>
        );
    }

    // Fetch the snapshot members in chunks (PostgREST URL-length limits).
    const people: AudiencePerson[] = [];
    const removed = new Set(setting.removedIds);
    for (let i = 0; i < setting.subscriberIds.length; i += 150) {
        const chunk = setting.subscriberIds.slice(i, i + 150);
        const { data } = await db
            .from("subscribers")
            .select("id, email, first_name, last_name, country, tags, created_at")
            .in("id", chunk);
        for (const s of data ?? []) {
            const signals = signalsForTags(s.tags);
            people.push({
                id: s.id,
                email: s.email,
                name: [s.first_name, s.last_name].filter(Boolean).join(" "),
                country: s.country ?? "",
                signals: signals.length > 0 ? signals : [CHECKOUT_INTENT_SIGNAL],
                signedUp: (s.created_at ?? "").slice(0, 10),
                removed: removed.has(s.id),
            });
        }
    }
    people.sort((a, b) => b.signals.length - a.signals.length || a.email.localeCompare(b.email));

    const signalCounts = new Map<string, number>();
    for (const p of people) {
        if (p.removed) continue;
        for (const s of p.signals) signalCounts.set(s, (signalCounts.get(s) ?? 0) + 1);
    }

    return (
        <div>
            <div className="flex items-end justify-between gap-6 mb-2">
                <h1 className="font-serif text-3xl tracking-tight">Marketing Audience</h1>
                <Link
                    href="/admin/marketing-calendar"
                    className="font-sans text-xs uppercase tracking-widest text-amber-300 underline hover:text-amber-200"
                >
                    Back to calendar
                </Link>
            </div>
            <p className="font-sans text-sm text-white/40 mb-6 max-w-3xl">
                Everyone below left their email with us and shows at least one purchase-intent signal. Buyers,
                suppressed addresses and test accounts are already excluded. Toggle anyone out, then save.
                Snapshot built {setting.builtAt.slice(0, 10) || "n/a"}.
            </p>

            <div className="border border-white/10 bg-white/[0.02] p-4 mb-8">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">How this group was selected</p>
                <ul className="font-sans text-xs text-white/50 space-y-1 list-disc pl-4">
                    {setting.rules.map((r) => (
                        <li key={r}>{r}</li>
                    ))}
                </ul>
            </div>

            <AudienceTable
                people={people}
                signalCounts={[...signalCounts.entries()].sort((a, b) => b[1] - a[1])}
            />
        </div>
    );
}

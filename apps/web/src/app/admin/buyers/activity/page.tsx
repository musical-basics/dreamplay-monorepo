import Link from "next/link";
import type { Tables } from "@dreamplay/db";
import { getAdminDb } from "@/lib/db";

/**
 * /admin/buyers/activity — how buyers are responding to the latest buyer
 * update email: opens, clicks, the site pages they visit, configuration
 * changes and Pro-upgrade requests, per buyer and in aggregate.
 *
 * Email opens/clicks come from email_events (open pixel + append-mode click
 * receiver) scoped to the update wave's campaigns; browsing comes from the
 * analytics events table via sid/email enrichment; config activity from
 * buyer_preference_changes.
 */

export const dynamic = "force-dynamic";

type Buyer = Tables<"buyers">;

interface BuyerActivity {
    buyer: Buyer;
    sentAt: string | null;
    opens: number;
    firstOpenAt: string | null;
    clicks: number;
    pageViews: Map<string, number>;
    actions: string[];
    lastActivityAt: string | null;
    prefChanges: number;
    latestPref: Tables<"buyer_preference_changes"> | null;
}

function stripQuery(path: string | null): string {
    if (!path) return "?";
    return path.split("?")[0] || "/";
}

function fmtWhen(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function BuyerActivityPage() {
    const db = getAdminDb();

    const { data: wave } = await db
        .from("buyer_update_emails")
        .select("*")
        .eq("update_key", "july-2026-prototype-update")
        .maybeSingle();

    if (!wave || !wave.sent_first_at) {
        return <p className="font-sans text-white/50">The July update has not been sent yet.</p>;
    }

    const [{ data: buyers }, { data: sentRows }, { data: emailEvents }, { data: prefChanges }] = await Promise.all([
        db.from("buyers").select("*").eq("kind", "buyer").limit(1000),
        db
            .from("sent_history")
            .select("subscriber_id, sent_at, subscribers(email)")
            .in("campaign_id", wave.campaign_ids)
            .limit(1000),
        db
            .from("email_events")
            .select("subscriber_id, type, url, created_at")
            .in("campaign_id", wave.campaign_ids)
            .order("created_at", { ascending: true })
            .limit(10000),
        db.from("buyer_preference_changes").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);

    const subIdToEmail = new Map<string, string>();
    const sentAtByEmail = new Map<string, string>();
    for (const r of sentRows ?? []) {
        const email = (r.subscribers as { email: string } | null)?.email?.toLowerCase();
        if (email && r.subscriber_id) {
            subIdToEmail.set(r.subscriber_id, email);
            sentAtByEmail.set(email, r.sent_at);
        }
    }

    const buyerEmails = (buyers ?? []).map((b) => b.email.toLowerCase());
    const subIds = [...subIdToEmail.keys()];

    // Browsing since the send, attributed by subscriber id OR resolved email.
    const [bySub, byEmail] = await Promise.all([
        db
            .from("events")
            .select("id, event_name, path, email, subscriber_id, created_at")
            .gte("created_at", wave.sent_first_at)
            .in("subscriber_id", subIds)
            .limit(10000),
        db
            .from("events")
            .select("id, event_name, path, email, subscriber_id, created_at")
            .gte("created_at", wave.sent_first_at)
            .in("email", buyerEmails)
            .limit(10000),
    ]);
    const siteEvents = new Map<number, NonNullable<typeof bySub.data>[number]>();
    for (const e of [...(bySub.data ?? []), ...(byEmail.data ?? [])]) siteEvents.set(e.id as number, e);

    const byBuyer = new Map<string, BuyerActivity>();
    for (const b of buyers ?? []) {
        const email = b.email.toLowerCase();
        if (!sentAtByEmail.has(email) && !b.email.endsWith("@no-email.invalid")) {
            // not part of the send (suppressed etc.) — still listed, marked not sent
        }
        byBuyer.set(email, {
            buyer: b,
            sentAt: sentAtByEmail.get(email) ?? null,
            opens: 0,
            firstOpenAt: null,
            clicks: 0,
            pageViews: new Map(),
            actions: [],
            lastActivityAt: null,
            prefChanges: 0,
            latestPref: null,
        });
    }

    const bump = (email: string | null | undefined, at: string | null, fn: (a: BuyerActivity) => void) => {
        if (!email) return;
        const a = byBuyer.get(email.toLowerCase());
        if (!a) return;
        fn(a);
        if (at && (!a.lastActivityAt || at > a.lastActivityAt)) a.lastActivityAt = at;
    };

    for (const e of emailEvents ?? []) {
        const email = e.subscriber_id ? subIdToEmail.get(e.subscriber_id) : null;
        if (e.type === "open") {
            bump(email, e.created_at, (a) => {
                a.opens++;
                if (!a.firstOpenAt) a.firstOpenAt = e.created_at;
            });
        } else if (e.type === "click") {
            bump(email, e.created_at, (a) => a.clicks++);
        }
    }

    for (const e of siteEvents.values()) {
        const email = e.email?.toLowerCase() ?? (e.subscriber_id ? subIdToEmail.get(e.subscriber_id) : null);
        const name = e.event_name ?? "";
        if (name === "pageview") {
            bump(email, e.created_at, (a) => {
                const p = stripQuery(e.path);
                a.pageViews.set(p, (a.pageViews.get(p) ?? 0) + 1);
            });
        } else if (name !== "page_leave") {
            bump(email, e.created_at, (a) => {
                if (!a.actions.includes(name)) a.actions.push(name);
            });
        }
    }

    const buyerById = new Map((buyers ?? []).map((b) => [b.id, b.email.toLowerCase()]));
    for (const c of prefChanges ?? []) {
        const email = buyerById.get(c.buyer_id);
        bump(email, c.created_at, (a) => {
            a.prefChanges++;
            if (!a.latestPref) a.latestPref = c;
        });
    }

    const rows = [...byBuyer.values()].sort((x, y) => (y.lastActivityAt ?? "").localeCompare(x.lastActivityAt ?? ""));
    const sentCount = rows.filter((r) => r.sentAt).length;
    const opened = rows.filter((r) => r.opens > 0).length;
    const clicked = rows.filter((r) => r.clicks > 0).length;
    const visited = rows.filter((r) => r.pageViews.size > 0).length;
    const changed = rows.filter((r) => r.prefChanges > 0).length;
    const upgrades = rows.filter((r) => r.buyer.pro_upgrade_requested).length;
    const pct = (n: number) => (sentCount ? `${Math.round((n / sentCount) * 100)}%` : "");

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <Link href="/admin/buyers" className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                        &larr; All buyers
                    </Link>
                    <h1 className="font-serif text-3xl tracking-tight mt-2">July update: buyer activity</h1>
                    <p className="font-sans text-sm text-white/40 mt-1">
                        Sent {fmtWhen(wave.sent_first_at)} · opens and clicks from email tracking, pages from on-site analytics · most recent activity first
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
                {[
                    { label: "Emails sent", value: String(sentCount), sub: "" },
                    { label: "Opened", value: String(opened), sub: pct(opened) },
                    { label: "Clicked", value: String(clicked), sub: pct(clicked) },
                    { label: "Visited site", value: String(visited), sub: pct(visited) },
                    { label: "Config saved", value: String(changed), sub: "" },
                    { label: "Pro upgrades", value: String(upgrades), sub: "", gold: upgrades > 0 },
                ].map((s) => (
                    <div key={s.label} className={`border p-4 ${s.gold ? "border-amber-400/40 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                        <p className="font-sans text-2xl">
                            {s.value}
                            {s.sub && <span className="text-sm text-white/40 ml-2">{s.sub}</span>}
                        </p>
                        <p className={`font-sans text-[11px] uppercase tracking-widest mt-1 ${s.gold ? "text-amber-300/80" : "text-white/40"}`}>{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto border border-white/10">
                <table className="w-full font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                            {["Buyer", "Sent", "Opens", "Clicks", "Pages visited", "Config activity", "Last activity"].map((h) => (
                                <th key={h} className="px-3 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white/40 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.buyer.id} className={`border-b border-white/5 hover:bg-white/[0.03] ${!r.lastActivityAt ? "opacity-50" : ""}`}>
                                <td className="px-3 py-2.5">
                                    <p className="text-white/90">{r.buyer.email.endsWith("@no-email.invalid") ? `phone-only ${r.buyer.shopify_order_number}` : r.buyer.email}</p>
                                    {r.buyer.pro_upgrade_requested && (
                                        <span className="inline-block border border-amber-400/50 px-2 py-0.5 mt-1 text-[10px] uppercase tracking-widest text-amber-300">Pro upgrade requested</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-white/50">{r.sentAt ? fmtWhen(r.sentAt) : "not sent"}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-white/70">
                                    {r.opens > 0 ? `${r.opens}` : ""}
                                    {r.firstOpenAt && <span className="text-white/35 text-xs ml-1.5">first {fmtWhen(r.firstOpenAt)}</span>}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-white/70">{r.clicks > 0 ? r.clicks : ""}</td>
                                <td className="px-3 py-2.5 max-w-[340px]">
                                    {[...r.pageViews.entries()].map(([path, count]) => (
                                        <span key={path} className="inline-block border border-white/15 px-2 py-0.5 mr-1.5 mb-1 text-xs text-white/70">
                                            {path}
                                            {count > 1 && <span className="text-white/40"> ×{count}</span>}
                                        </span>
                                    ))}
                                    {r.actions.length > 0 && (
                                        <p className="text-xs text-emerald-300/80 mt-0.5">{r.actions.join(", ")}</p>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-white/70">
                                    {r.latestPref ? (
                                        <>
                                            <p>
                                                {[r.latestPref.size_variant, r.latestPref.finish].filter(Boolean).join(" · ")}
                                                {r.latestPref.upgrade_to_pro && <span className="text-amber-300"> + Pro</span>}
                                            </p>
                                            {r.prefChanges > 1 && <p className="text-xs text-white/35">{r.prefChanges} changes</p>}
                                        </>
                                    ) : null}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-white/50">{fmtWhen(r.lastActivityAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="font-sans text-xs text-white/35 mt-4 leading-relaxed">
                Opens undercount Apple Mail privacy users and Gmail proxy quirks; clicks are append-mode (recorded when
                the buyer lands on our site). Pages visited only count identified visits since the send. Buyers marked
                &quot;not sent&quot; were suppressed or have no email on file.
            </p>
        </div>
    );
}

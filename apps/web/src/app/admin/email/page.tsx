import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import { EmailNav } from "./EmailNav";

/**
 * /admin/email — campaign list with per-campaign send status derived from
 * sent_history counts (the authoritative completion signal) vs the audience
 * recorded on the campaign.
 *
 * Note: the legacy AI copilot is deliberately NOT ported here — deferred to
 * Phase 8 (hardening/extras) per the phase-5 plan.
 */
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string {
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function audienceLabel(variableValues: unknown): string {
    const vv = (variableValues ?? {}) as Record<string, unknown>;
    if (Array.isArray(vv.subscriber_ids) && vv.subscriber_ids.length) return `${vv.subscriber_ids.length} ids`;
    if (vv.subscriber_id) return "1 id";
    if (vv.target_tag) return `tag: ${String(vv.target_tag)}`;
    return "—";
}

export default async function EmailAdminPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const statusFilter = first(params.status);
    const showTemplates = first(params.templates) === "1";

    const db = getAdminDb();
    let query = db
        .from("campaigns")
        .select("id,name,subject_line,status,is_template,scheduled_at,scheduled_status,total_recipients,total_opens,total_clicks,variable_values,workspace,updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);
    if (statusFilter) query = query.eq("status", statusFilter as import("@dreamplay/db").CampaignStatus);
    if (!showTemplates) query = query.eq("is_template", false);
    else query = query.eq("is_template", true);

    const { data: campaigns, error } = await query;

    // One grouped query for sent_history counts across the listed campaigns.
    const sentCounts = new Map<string, number>();
    if (campaigns && campaigns.length) {
        const ids = campaigns.map((c) => c.id);
        const { data: sentRows } = await db
            .from("sent_history")
            .select("campaign_id")
            .in("campaign_id", ids);
        for (const row of sentRows ?? []) {
            sentCounts.set(row.campaign_id, (sentCounts.get(row.campaign_id) ?? 0) + 1);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h1 className="font-serif text-3xl tracking-tight">Email</h1>
                <Link
                    href="/admin/email/campaigns/new"
                    className="border border-white/20 px-4 py-2 font-sans text-xs uppercase tracking-widest hover:border-white/60 transition-colors"
                >
                    New campaign
                </Link>
            </div>
            <p className="font-sans text-xs text-white/40 mb-8">
                Campaign copilot is deferred to Phase 8. Sends run through the agent API / Inngest pipeline.
            </p>
            <EmailNav active="campaigns" />

            <div className="flex items-center gap-3 mb-6 font-sans text-xs">
                <Link href="/admin/email" className={!showTemplates ? "text-white" : "text-white/40 hover:text-white"}>
                    Sends
                </Link>
                <span className="text-white/20">|</span>
                <Link
                    href="/admin/email?templates=1"
                    className={showTemplates ? "text-white" : "text-white/40 hover:text-white"}
                >
                    Templates
                </Link>
            </div>

            {error ? (
                <p className="font-sans text-sm text-red-400">Failed to load campaigns: {error.message}</p>
            ) : !campaigns || campaigns.length === 0 ? (
                <p className="font-sans text-sm text-white/40">No campaigns yet.</p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Audience</th>
                                <th className="px-4 py-3">Sent (history)</th>
                                <th className="px-4 py-3">Opens</th>
                                <th className="px-4 py-3">Clicks</th>
                                <th className="px-4 py-3">Workspace</th>
                                <th className="px-4 py-3">Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => {
                                const sent = sentCounts.get(c.id) ?? 0;
                                return (
                                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/email/campaigns/${c.id}`} className="hover:underline">
                                                {c.name}
                                            </Link>
                                            {c.subject_line ? (
                                                <span className="block text-xs text-white/40">{c.subject_line}</span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {c.status}
                                            {c.scheduled_status ? (
                                                <span className="block text-xs text-white/40">
                                                    sched: {c.scheduled_status}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-white/70">{audienceLabel(c.variable_values)}</td>
                                        <td className="px-4 py-3 text-white/70">
                                            {sent}
                                            {c.total_recipients ? ` / ${c.total_recipients}` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-white/70">{c.total_opens}</td>
                                        <td className="px-4 py-3 text-white/70">{c.total_clicks}</td>
                                        <td className="px-4 py-3 text-white/40">{c.workspace}</td>
                                        <td className="px-4 py-3 text-white/40">
                                            {new Date(c.updated_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

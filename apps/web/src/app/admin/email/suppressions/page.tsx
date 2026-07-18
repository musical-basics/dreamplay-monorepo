import { getAdminDb } from "@/lib/db";
import { EmailNav } from "../EmailNav";
import { removeSuppression } from "../actions";

/**
 * /admin/email/suppressions — the do-not-send list (bounces, complaints,
 * unsubscribes, manual). Removal is deliberate and rare (e.g. a subscriber
 * asks to be re-added after unsubscribing by mistake).
 */
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SuppressionsPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const search = Array.isArray(params.q) ? (params.q[0] ?? "") : (params.q ?? "");

    const db = getAdminDb();
    let query = db
        .from("suppressions")
        .select("id,email,reason,source,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);
    if (search) query = query.ilike("email", `%${search}%`);
    const { data: rows, count, error } = await query;

    return (
        <div>
            <h1 className="font-serif text-3xl tracking-tight mb-8">Suppressions</h1>
            <EmailNav active="suppressions" />

            <form className="flex gap-3 mb-6 font-sans" action="/admin/email/suppressions">
                <input
                    name="q"
                    defaultValue={search}
                    placeholder="Search email..."
                    className="bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                />
                <button className="border border-white/20 px-4 py-2 text-xs uppercase tracking-widest hover:border-white/60">
                    Search
                </button>
                <span className="self-center text-xs text-white/40">{count ?? 0} suppressed</span>
            </form>

            {error ? (
                <p className="font-sans text-sm text-red-400">Failed to load suppressions: {error.message}</p>
            ) : !rows || rows.length === 0 ? (
                <p className="font-sans text-sm text-white/40">
                    No suppressions. Bounces, complaints, and unsubscribes will land here automatically.
                </p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Added</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                    <td className="px-4 py-3">{r.email}</td>
                                    <td className="px-4 py-3 text-white/70">{r.reason}</td>
                                    <td className="px-4 py-3 text-white/40">{r.source ?? "—"}</td>
                                    <td className="px-4 py-3 text-white/40">
                                        {new Date(r.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <form action={removeSuppression}>
                                            <input type="hidden" name="id" value={r.id} />
                                            <button className="text-xs text-white/40 hover:text-red-400 uppercase tracking-widest">
                                                Remove
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

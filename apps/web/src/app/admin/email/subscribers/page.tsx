import { getAdminDb } from "@/lib/db";
import { EmailNav } from "../EmailNav";

/** /admin/email/subscribers — browse, search, tag/status filter. */
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string {
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function SubscribersPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const search = first(params.q);
    const tag = first(params.tag);
    const status = first(params.status);
    const page = Math.max(0, Number(first(params.page)) || 0);
    const PAGE_SIZE = 50;

    const db = getAdminDb();
    let query = db
        .from("subscribers")
        .select("id,email,first_name,last_name,status,tags,workspace,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (search) query = query.ilike("email", `%${search}%`);
    if (tag) query = query.contains("tags", [tag]);
    if (status) query = query.eq("status", status as import("@dreamplay/db").SubscriberStatus);

    const { data: subscribers, count, error } = await query;

    const qs = (overrides: Record<string, string | number>) => {
        const u = new URLSearchParams();
        if (search) u.set("q", search);
        if (tag) u.set("tag", tag);
        if (status) u.set("status", status);
        for (const [k, v] of Object.entries(overrides)) u.set(k, String(v));
        return `/admin/email/subscribers?${u.toString()}`;
    };

    return (
        <div>
            <h1 className="font-serif text-3xl tracking-tight mb-8">Subscribers</h1>
            <EmailNav active="subscribers" />

            <form className="flex flex-wrap gap-3 mb-6 font-sans text-sm" action="/admin/email/subscribers">
                <input
                    name="q"
                    defaultValue={search}
                    placeholder="Search email..."
                    className="bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                />
                <input
                    name="tag"
                    defaultValue={tag}
                    placeholder="Tag filter"
                    className="bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                />
                <select
                    name="status"
                    defaultValue={status}
                    className="bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                >
                    <option value="">Any status</option>
                    <option value="active">active</option>
                    <option value="unsubscribed">unsubscribed</option>
                    <option value="bounced">bounced</option>
                    <option value="complained">complained</option>
                    <option value="inactive">inactive</option>
                    <option value="deleted">deleted</option>
                </select>
                <button className="border border-white/20 px-4 py-2 text-xs uppercase tracking-widest hover:border-white/60">
                    Filter
                </button>
                <span className="self-center text-xs text-white/40">{count ?? 0} matching</span>
            </form>

            {error ? (
                <p className="font-sans text-sm text-red-400">Failed to load subscribers: {error.message}</p>
            ) : !subscribers || subscribers.length === 0 ? (
                <p className="font-sans text-sm text-white/40">No subscribers found.</p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tags</th>
                                <th className="px-4 py-3">Workspace</th>
                                <th className="px-4 py-3">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((s) => (
                                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                    <td className="px-4 py-3">{s.email}</td>
                                    <td className="px-4 py-3 text-white/70">
                                        {[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-white/70">{s.status}</td>
                                    <td className="px-4 py-3 text-white/50 max-w-[300px]">
                                        <span className="line-clamp-2">{(s.tags ?? []).join(", ") || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3 text-white/40">{s.workspace}</td>
                                    <td className="px-4 py-3 text-white/40">
                                        {new Date(s.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex gap-3 mt-6 font-sans text-xs">
                {page > 0 ? (
                    <a href={qs({ page: page - 1 })} className="text-white/50 hover:text-white">
                        ← Previous
                    </a>
                ) : null}
                {(count ?? 0) > (page + 1) * PAGE_SIZE ? (
                    <a href={qs({ page: page + 1 })} className="text-white/50 hover:text-white">
                        Next →
                    </a>
                ) : null}
            </div>
        </div>
    );
}

import type { Candidate } from "./types";
import type { SendWaveClient } from "./api-client";

type EnsureOptions = {
    concurrency: number;
    tags: string[];
};

/** Upsert one subscriber via the agent API and return its id. */
async function ensureSubscriber(client: SendWaveClient, cand: Candidate, tags: string[]): Promise<string> {
    const body: Record<string, unknown> = { email: cand.email, status: "active", tags };
    const fn = cand.first_name?.trim();
    const ln = cand.last_name?.trim();
    if (fn && fn.length >= 3 && fn.toLowerCase() !== "blank") body.first_name = fn;
    if (ln && ln.length >= 2 && ln.toLowerCase() !== "blank") body.last_name = ln;
    if (cand.country) body.country_code = cand.country;
    if (cand.city) body.shipping_city = cand.city;
    if (cand.zip) body.shipping_zip = cand.zip;

    const res = await client.api<{ data: { id: string } }>(`/api/agent/${client.workspace}/subscribers`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    return res.data.id;
}

/**
 * Ensure many subscribers in parallel. Returns lowercased email -> id.
 * Individual failures are logged, not fatal; the caller aborts if the final
 * pool ratio is too low.
 */
export async function ensureAllSubscribers(
    client: SendWaveClient,
    candidates: Candidate[],
    opts: EnsureOptions
): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    let next = 0;
    let done = 0;
    const total = candidates.length;
    await Promise.all(
        Array.from({ length: opts.concurrency }, async () => {
            for (;;) {
                const idx = next++;
                if (idx >= total) return;
                const cand = candidates[idx]!;
                try {
                    const id = await ensureSubscriber(client, cand, opts.tags);
                    map.set(cand.email.toLowerCase(), id);
                } catch (e) {
                    console.error(`  ensureSub failed for ${cand.email}: ${(e as Error).message}`);
                }
                done++;
                if (done % 100 === 0 || done === total) console.log(`  ensured ${done}/${total}`);
            }
        })
    );
    return map;
}

/**
 * runWaveSend — one-shot orchestrator for a multi-arm staggered send.
 *
 * Idempotency model (all three legs must hold):
 *   1. Each wave child is found-or-created by a DETERMINISTIC send key
 *      `${doneTag}:${armKey}:${chunkIdx}` (campaigns.send_key, unique index)
 *      — a re-run reuses children instead of minting duplicates.
 *   2. Inside each child, sent_history dedupes recipients (send engine).
 *   3. Done markers are applied ONLY from sent_history via finalizeWaveSend
 *      (--finalize), never at schedule time — fixing the legacy race where a
 *      failed send left recipients tagged done and excluded from retries.
 */

import type { ScheduledChild, RunWaveSendOptions, Candidate, ArmDef, Wave } from "./types";
import { createAgentClient, type SendWaveClient } from "./api-client";
import { assertNoEmDash, assertNoPlaceholders, assertScheduledFresh, isValidEmail } from "./guards";
import { chunkArm, interleaveWaves } from "./chunker";
import { getDoneTagged } from "./done-markers";
import { ensureAllSubscribers } from "./ensure-pool";
import { retryDb } from "../retry";

const DEFAULT_CHUNK_SIZE = 250;
const DEFAULT_STAGGER_SEC = 240;
const DEFAULT_ENSURE_CONCURRENCY = 8;
const DEFAULT_COPY_VARIABLE_KEYS = ["logo_src"];

/** Print the wave plan (chunks, timings, keys) without any writes. */
function planDryRun(arms: ArmDef[], opts: RunWaveSendOptions, chunkSize: number, staggerSec: number): void {
    const chunksByArm: Record<string, Candidate[][]> = {};
    for (const a of arms) chunksByArm[a.key] = chunkArm(a.audience, chunkSize);
    const waves = interleaveWaves(arms, chunksByArm);
    const firstFire = new Date(opts.scheduledFirstFire).getTime();
    for (let w = 0; w < waves.length; w++) {
        const wave = waves[w]!;
        const scheduledAt = new Date(firstFire + w * staggerSec * 1000).toISOString();
        const waveKey = `${opts.doneTag}:${wave.arm.key}:${wave.chunkIdx}`;
        console.log(
            `  [DRY ${w + 1}/${waves.length}] ${wave.arm.key} #${wave.chunkIdx + 1} (${wave.chunk.length} recips) @ ${scheduledAt} key=${waveKey}`
        );
    }
}

async function scheduleOneWave(
    client: SendWaveClient,
    wave: Wave,
    subIds: string[],
    opts: {
        parentCampaignId: string;
        baseVariableValues: Record<string, unknown>;
        scheduledAt: string;
        fromName: string;
        fromEmail: string;
        clickTrackingMode: "append" | "redirect";
        waveKey: string;
        namePrefix: string;
    }
): Promise<ScheduledChild> {
    const { arm, chunkIdx } = wave;
    if (!subIds.length) throw new Error(`scheduleOneWave: empty subIds for ${arm.key} #${chunkIdx + 1}`);

    // 1. Reuse the child from a previous run when it exists (sendKey idempotency).
    const existing = await retryDb(() =>
        client.db.from("campaigns").select("id,scheduled_status,status").eq("send_key", opts.waveKey).limit(1)
    );
    if (existing.error) throw new Error(`child lookup failed: ${existing.error.message}`);
    const prior = existing.data?.[0];
    if (prior) {
        const alreadyDispatched =
            prior.scheduled_status === "pending" ||
            prior.scheduled_status === "scheduled" ||
            prior.scheduled_status === "sent" ||
            prior.status === "sending" ||
            prior.status === "completed";
        if (alreadyDispatched) {
            console.log(`  [reuse] ${arm.key} #${chunkIdx + 1} already dispatched as ${prior.id}; skipping.`);
            return {
                armKey: arm.key,
                chunkIdx,
                childId: prior.id,
                scheduledAt: opts.scheduledAt,
                recipients: subIds.length,
                reused: true,
            };
        }
    }

    let childId = prior?.id ?? null;
    if (!childId) {
        const name = `${opts.namePrefix} ${arm.key} #${chunkIdx + 1} / ${opts.scheduledAt.slice(11, 16)}Z`;
        const clone = await client.api<{ data: { id: string } }>(
            `/api/agent/${client.workspace}/campaigns/${opts.parentCampaignId}/clone`,
            { method: "POST", body: JSON.stringify({ name, subscriber_ids: subIds }) }
        );
        childId = clone.data.id;
    }

    // 2. Patch content + audience + send_key, then round-trip verify (catches
    //    mid-air divergence that has bitten past sends).
    const mergedVV: Record<string, unknown> = { ...opts.baseVariableValues, subscriber_ids: subIds };
    const upd = await client.db
        .from("campaigns")
        .update({
            html_content: arm.html,
            subject_line: arm.subject,
            variable_values: mergedVV as never,
            send_key: opts.waveKey,
            updated_at: new Date().toISOString(),
        })
        .eq("id", childId);
    if (upd.error) throw new Error(`patch failed for ${childId}: ${upd.error.message}`);

    const verify = await client.db
        .from("campaigns")
        .select("html_content,subject_line,variable_values,send_key")
        .eq("id", childId)
        .single();
    const got = verify.data;
    if (!got) throw new Error(`could not re-fetch child ${childId} for verification`);
    if (got.subject_line !== arm.subject) throw new Error(`subject mismatch on ${childId}`);
    if (got.send_key !== opts.waveKey) throw new Error(`send_key mismatch on ${childId}`);
    const ids = (got.variable_values as { subscriber_ids?: unknown } | null)?.subscriber_ids;
    if (!Array.isArray(ids) || ids.length !== subIds.length) {
        throw new Error(`subscriber_ids wrong on ${childId}`);
    }
    assertNoEmDash(got.html_content ?? "", `child ${childId} html_content`);

    // 3. Dispatch the scheduled send (audience-size echo satisfied explicitly).
    await client.api(`/api/agent/${client.workspace}/campaigns/${childId}/send`, {
        method: "POST",
        body: JSON.stringify({
            fromName: opts.fromName,
            fromEmail: opts.fromEmail,
            clickTracking: true,
            clickTrackingMode: opts.clickTrackingMode,
            openTracking: true,
            scheduledAt: opts.scheduledAt,
            confirmRecipientCount: subIds.length,
        }),
    });

    return {
        armKey: arm.key,
        chunkIdx,
        childId,
        scheduledAt: opts.scheduledAt,
        recipients: subIds.length,
        reused: Boolean(prior),
    };
}

export async function runWaveSend(opts: RunWaveSendOptions): Promise<ScheduledChild[]> {
    const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const staggerSec = opts.staggerSec ?? DEFAULT_STAGGER_SEC;
    const ensureConcurrency = opts.ensureConcurrency ?? DEFAULT_ENSURE_CONCURRENCY;
    const clickTrackingMode = opts.clickTrackingMode ?? "append";
    const copyKeys = opts.copyVariableKeys ?? DEFAULT_COPY_VARIABLE_KEYS;
    const namePrefix = opts.doneTag.replace(/^done-/, "");

    if (clickTrackingMode === "redirect") {
        console.warn(
            "WARN: clickTrackingMode=redirect caused the 2026-05-03 Gmail bulk-flagging incident. Reconsider before firing."
        );
    }

    console.log(`Now:               ${new Date().toISOString()}`);
    console.log(`First scheduledAt: ${opts.scheduledFirstFire}`);
    console.log(`DONE_TAG:          ${opts.doneTag}`);
    console.log(`Workspace:         ${opts.workspace}`);
    for (const a of opts.arms) {
        console.log(`  [${a.key}] subject="${a.subject}" html=${a.html.length}b audience=${a.audience.length}`);
    }
    if (opts.dryRun) console.log("MODE: dry-run (no clone / send / tag)");

    // Guards.
    for (const a of opts.arms) {
        assertNoEmDash(a.html, `${a.key} HTML`);
        assertNoEmDash(a.subject, `${a.key} subject`);
        assertNoPlaceholders(a.html, `${a.key} HTML`);
    }
    assertScheduledFresh(opts.scheduledFirstFire);

    const workingArms: ArmDef[] = opts.arms.map((a) => ({ ...a, audience: [...a.audience] }));

    // Invalid-email pre-filter.
    for (const a of workingArms) {
        const before = a.audience.length;
        a.audience = a.audience.filter((c) => {
            const ok = isValidEmail(c.email);
            if (!ok) console.log(`  [${a.key}] dropping invalid email: ${c.email}`);
            return ok;
        });
        if (before !== a.audience.length) {
            console.log(`  [${a.key}] dropped ${before - a.audience.length} invalid email(s)`);
        }
    }

    // Done-marker resumability filter: skip anyone whose send is CONFIRMED
    // (done tags derive from sent_history via finalizeWaveSend).
    let client: SendWaveClient;
    try {
        client = createAgentClient({ workspace: opts.workspace });
    } catch (err) {
        if (opts.dryRun) {
            // Dry runs stay useful without full env: plan chunking/timing only.
            console.warn(`WARN: ${(err as Error).message} — dry-run continues WITHOUT the done-tag filter.`);
            planDryRun(workingArms, opts, chunkSize, staggerSec);
            return [];
        }
        throw err;
    }
    const allEmails = workingArms.flatMap((a) => a.audience.map((c) => c.email));
    if (allEmails.length) {
        const done = await getDoneTagged(client.db, allEmails, opts.doneTag);
        if (done.size) {
            console.log(`  Already done-tagged (skipping): ${done.size}`);
            for (const a of workingArms) {
                a.audience = a.audience.filter((c) => !done.has(c.email.toLowerCase()));
            }
        }
    }

    const totalToSchedule = workingArms.reduce((s, a) => s + a.audience.length, 0);
    console.log(`Total to schedule: ${totalToSchedule}`);
    if (!totalToSchedule) {
        console.log("Nothing to do.");
        return [];
    }

    // Source variable copy.
    const baseVV: Record<string, unknown> = {};
    if (opts.sourceCampaignId) {
        const src = await client.db
            .from("campaigns")
            .select("variable_values")
            .eq("id", opts.sourceCampaignId)
            .single();
        if (src.error || !src.data) throw new Error(`fetch source vars failed: ${src.error?.message}`);
        const srcVV = (src.data.variable_values ?? {}) as Record<string, unknown>;
        for (const k of copyKeys) if (srcVV[k] !== undefined) baseVV[k] = srcVV[k];
    }

    // Ensure subscribers.
    const subMap = new Map<string, string>();
    if (!opts.dryRun) {
        console.log("Ensuring subscribers (parallel)...");
        const tagsFor = (armKey: string): string[] =>
            typeof opts.prospectTags === "function" ? opts.prospectTags(armKey) : (opts.prospectTags ?? []);
        let requested = 0;
        for (const a of workingArms) {
            requested += a.audience.length;
            const partial = await ensureAllSubscribers(client, a.audience, {
                concurrency: ensureConcurrency,
                tags: tagsFor(a.key),
            });
            for (const [k, v] of partial) subMap.set(k, v);
        }
        console.log(`  Got ${subMap.size} subscriber IDs (of ${requested})`);
        if (subMap.size < requested * 0.95) {
            throw new Error(`Only ${subMap.size}/${requested} subscribers ensured (< 95%), aborting`);
        }
    }

    // Chunk + interleave.
    const chunksByArm: Record<string, Candidate[][]> = {};
    for (const a of workingArms) chunksByArm[a.key] = chunkArm(a.audience, chunkSize);
    const waves = interleaveWaves(workingArms, chunksByArm);
    console.log(`${waves.length} total send-children to schedule`);

    // Schedule each wave. NOTE: no done-tagging here — run the CLI with
    // --finalize after the last fire to apply markers from sent_history.
    const firstFire = new Date(opts.scheduledFirstFire).getTime();
    const scheduled: ScheduledChild[] = [];
    for (let w = 0; w < waves.length; w++) {
        const wave = waves[w]!;
        const scheduledAt = new Date(firstFire + w * staggerSec * 1000).toISOString();
        const waveKey = `${opts.doneTag}:${wave.arm.key}:${wave.chunkIdx}`;

        if (opts.dryRun) {
            console.log(
                `  [DRY ${w + 1}/${waves.length}] ${wave.arm.key} #${wave.chunkIdx + 1} (${wave.chunk.length} recips) @ ${scheduledAt} key=${waveKey}`
            );
            continue;
        }

        const subIds = wave.chunk
            .map((c) => subMap.get(c.email.toLowerCase()))
            .filter((v): v is string => Boolean(v));
        if (!subIds.length) {
            console.log(`  [skip] wave ${w + 1}: no subscriber ids`);
            continue;
        }

        const child = await scheduleOneWave(client, wave, subIds, {
            parentCampaignId: opts.parentCampaignId,
            baseVariableValues: baseVV,
            scheduledAt,
            fromName: opts.fromName,
            fromEmail: opts.fromEmail,
            clickTrackingMode,
            waveKey,
            namePrefix,
        });
        scheduled.push(child);
        console.log(
            `  [${w + 1}/${waves.length}] ${child.armKey} #${child.chunkIdx + 1} (${child.recipients} recips) -> ${child.childId} @ ${child.scheduledAt}${child.reused ? " (reused)" : ""}`
        );
    }

    console.log(`Done. ${scheduled.length} children scheduled.`);
    console.log(`After the last fire, apply done markers: send-wave <plan> --finalize`);
    return scheduled;
}

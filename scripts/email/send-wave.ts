/**
 * Send-wave CLI — staggered multi-arm campaign sends, checked into the repo
 * (replacing the legacy gitignored _work/schedule-*.ts scripts).
 *
 * Usage (from repo root):
 *   pnpm --filter @dreamplay/email send-wave <plan.json> [--dry-run]
 *   pnpm --filter @dreamplay/email send-wave <plan.json> --finalize
 *
 * Modes:
 *   default     schedule the waves described by the plan. Fully resumable:
 *               re-running the same plan reuses child campaigns via their
 *               deterministic send_key (`<doneTag>:<armKey>:<chunkIdx>`),
 *               skips already-dispatched children, and the send engine's
 *               sent_history dedupe skips already-sent recipients.
 *   --finalize  AFTER the last wave has fired: apply the done marker tag to
 *               every recipient CONFIRMED by sent_history (never at schedule
 *               time — that was the legacy done-marker race).
 *   --dry-run   print the plan (chunks, timings, keys); no writes.
 *
 * Plan JSON shape (paths resolve relative to the plan file):
 * {
 *   "workspace": "musicalbasics",
 *   "parentCampaignId": "<uuid>",
 *   "sourceCampaignId": "<uuid, optional>",
 *   "doneTag": "done-belgium-2026-08",
 *   "scheduledFirstFire": "2026-08-01T16:00:00.000Z",
 *   "staggerSec": 240,
 *   "chunkSize": 250,
 *   "fromName": "Lionel",
 *   "fromEmail": "lionel@musicalbasics.com",
 *   "prospectTags": ["belgium-2026-08"],
 *   "arms": [
 *     { "key": "A", "subject": "...", "htmlFile": "./arm-a.html", "audienceFile": "./audience-a.json" }
 *   ]
 * }
 * audienceFile: JSON array of { email, first_name?, last_name?, country?, city?, zip? }.
 *
 * Required env (loaded from apps/web/.env.local if present): AGENT_API_KEY,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * DREAMPLAY_EMAIL_BASE_URL or NEXT_PUBLIC_APP_URL (agent API host).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
    runWaveSend,
    finalizeWaveSend,
    type ArmDef,
    type Candidate,
    type RunWaveSendOptions,
} from "../../packages/email/src/send-wave/index";
import { createAdminClient } from "../../packages/db/src/admin";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** dotenv-lite: load KEY=VALUE lines without overwriting existing env. */
function loadDotEnv(path: string): void {
    let raw: string;
    try {
        raw = readFileSync(path, "utf8");
    } catch {
        return;
    }
    for (const line of raw.split("\n")) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m) continue;
        if (process.env[m[1]!] !== undefined) continue;
        process.env[m[1]!] = m[2]!.replace(/^"(.*)"$/, "$1");
    }
}

type PlanArm = {
    key: string;
    subject: string;
    html?: string;
    htmlFile?: string;
    audience?: Candidate[];
    audienceFile?: string;
};

type Plan = Omit<RunWaveSendOptions, "arms" | "dryRun"> & { arms: PlanArm[] };

async function main() {
    const args = process.argv.slice(2);
    const planPath = args.find((a) => !a.startsWith("--"));
    const dryRun = args.includes("--dry-run");
    const finalize = args.includes("--finalize");
    if (!planPath) {
        console.error("Usage: send-wave <plan.json> [--dry-run | --finalize]");
        process.exit(1);
    }

    loadDotEnv(resolve(__dirname, "../../apps/web/.env.local"));
    loadDotEnv(resolve(__dirname, "../../.env.local"));

    const planFile = resolve(process.cwd(), planPath);
    const planDir = dirname(planFile);
    const plan = JSON.parse(readFileSync(planFile, "utf8")) as Plan;

    if (finalize) {
        console.log(`Finalizing wave send "${plan.doneTag}" (done markers from sent_history)...`);
        const db = createAdminClient();
        const results = await finalizeWaveSend(db, { doneTag: plan.doneTag });
        for (const r of results) {
            console.log(`  ${r.campaignId}: ${r.confirmedSent} confirmed sent, ${r.newlyTagged} newly tagged`);
        }
        console.log(`Done. ${results.length} child campaign(s) finalized.`);
        return;
    }

    const arms: ArmDef[] = plan.arms.map((arm) => {
        const html = arm.html ?? (arm.htmlFile ? readFileSync(resolve(planDir, arm.htmlFile), "utf8") : "");
        const audience =
            arm.audience ??
            (arm.audienceFile
                ? (JSON.parse(readFileSync(resolve(planDir, arm.audienceFile), "utf8")) as Candidate[])
                : []);
        if (!html) throw new Error(`Arm ${arm.key}: html or htmlFile is required`);
        if (!audience.length) throw new Error(`Arm ${arm.key}: audience or audienceFile is required`);
        return { key: arm.key, subject: arm.subject, html, audience };
    });

    const scheduled = await runWaveSend({ ...plan, arms, dryRun });
    if (!dryRun && scheduled.length) {
        console.log(`\nNext step after the last fire (${scheduled[scheduled.length - 1]!.scheduledAt}):`);
        console.log(`  pnpm --filter @dreamplay/email send-wave ${planPath} --finalize`);
    }
}

main().catch((err) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exit(1);
});

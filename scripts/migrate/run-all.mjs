/**
 * Orchestrates the full Phase 6 migration in dependency order:
 *
 *   01-auth-users            (must precede 03: reservation_decisions.user_id remap)
 *   02-buyers
 *   03-reservation-decisions
 *   04-website-tables        (customers, waitlist, admin_variables)
 *   05-subscribers           (subscribers + suppressions compliance gate;
 *                             must precede 06: sent_history FK -> subscribers)
 *   06-email-content         (tags, merge_tags, rotations, campaigns, sent_history)
 *
 * Default is DRY-RUN for every step. Pass --execute to actually write.
 * After an execute run, run `node verify.mjs` for the full verification report.
 *
 * Usage: node run-all.mjs [--execute]
 */

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { MIGRATE_DIR, getMode, logMode, logMigrationStep } from "./lib.mjs";

const mode = getMode();
logMode(mode);

const steps = [
  "01-auth-users.mjs",
  "02-buyers.mjs",
  "03-reservation-decisions.mjs",
  "04-website-tables.mjs",
  "05-subscribers.mjs",
  "06-email-content.mjs",
];

const args = mode === "execute" ? ["--execute"] : [];
const startedAt = new Date().toISOString();
let failed = null;

for (const step of steps) {
  console.log(`\n${"=".repeat(70)}\n=== ${step} ${args.join(" ")}\n${"=".repeat(70)}`);
  const res = spawnSync("node", [join(MIGRATE_DIR, step), ...args], {
    stdio: "inherit", cwd: MIGRATE_DIR,
  });
  if (res.status !== 0) {
    failed = step;
    console.error(`\nStep ${step} exited with code ${res.status}. Continuing is unsafe for dependent steps — aborting.`);
    break;
  }
}

if (mode === "execute") {
  logMigrationStep("run-all", { started_at: startedAt, completed: !failed, failed_step: failed });
}

if (failed) process.exit(1);
console.log(`\nAll steps finished (${mode}). ${mode === "execute" ? "Now run: node verify.mjs" : "Re-run with --execute to apply."}`);

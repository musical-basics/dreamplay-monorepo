/**
 * Registry → `experiments` table mirror.
 *
 * The code registry stays the source of truth for assignment/routing; the DB
 * row exists so /admin/experiments can list names, statuses and variant
 * definitions without importing app code. Run at deploy/startup (or from a
 * script) — server-side only (admin client).
 */

import { createAdminClient, type AdminClient, type Json } from "@dreamplay/db";

import type { Experiment } from "./experiments";

export interface SyncOptions {
  /** Injectable client (tests). Default: createAdminClient(). */
  client?: AdminClient;
  now?: () => Date;
}

/**
 * Upserts every experiment (conflict on `key`). Sets started_at when first
 * seen running and concluded_at when first seen concluded; never rewinds
 * either timestamp. Rows for experiments deleted from the registry are left
 * in place as history.
 */
export async function syncExperimentsToDb(
  experiments: readonly Experiment[],
  opts: SyncOptions = {}
): Promise<void> {
  const client = opts.client ?? createAdminClient();
  const now = (opts.now ?? (() => new Date()))().toISOString();

  const { data: existing, error: readError } = await client
    .from("experiments")
    .select("key, started_at, concluded_at")
    .in("key", experiments.map((e) => e.key));
  if (readError) {
    throw new Error(`@dreamplay/ab: reading experiments failed: ${readError.message}`);
  }
  const existingByKey = new Map((existing ?? []).map((row) => [row.key, row]));

  const rows = experiments.map((exp) => {
    const prior = existingByKey.get(exp.key);
    return {
      key: exp.key,
      name: exp.name,
      status: exp.status,
      // Full definition (variants, weights, paths, geo pools, forced pin) as
      // JSON so the dashboard can render the setup verbatim.
      variants: {
        variants: exp.variants,
        paths: exp.paths,
        geoPools: exp.geoPools ?? null,
        forcedVariant: exp.forcedVariant ?? null,
      } as unknown as Json,
      started_at: prior?.started_at ?? (exp.status !== "concluded" ? now : null),
      concluded_at: prior?.concluded_at ?? (exp.status === "concluded" ? now : null),
      updated_at: now,
    };
  });

  const { error } = await client.from("experiments").upsert(rows, { onConflict: "key" });
  if (error) {
    throw new Error(`@dreamplay/ab: syncing experiments failed: ${error.message}`);
  }
}

/**
 * Shared library for Phase 6 data-migration scripts.
 *
 * - Loads credentials from the three .env.local files (monorepo = NEW project,
 *   legacy website + legacy email = OLD projects). Secrets are never printed.
 * - Paginated PostgREST readers (past the 1000-row cap).
 * - Batched upsert writers with on_conflict.
 * - GoTrue admin API helpers (list/create users).
 * - CLI mode handling: --dry-run is the DEFAULT; --execute actually writes.
 *
 * SAFETY: old projects are read-only — this lib only ever issues GETs against
 * them. Writers are additive upserts (POST); there is no delete/truncate here.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIGRATE_DIR = dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = join(MIGRATE_DIR, "output");

const ENV_PATHS = {
  new: join(MIGRATE_DIR, "..", "..", ".env.local"),
  website: "/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-website-2/.env.local",
  email: "/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-email-3/.env.local",
};

// --- env ---------------------------------------------------------------------

function parseEnvFile(path) {
  const out = {};
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Returns { url, serviceKey } for one of: "new" | "website" | "email".
 * Never log the returned serviceKey.
 */
export function getProject(which) {
  const path = ENV_PATHS[which];
  if (!path) throw new Error(`Unknown project "${which}"`);
  const env = parseEnvFile(path);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || null;
  if (!url) throw new Error(`NEXT_PUBLIC_SUPABASE_URL missing in ${path}`);
  if (!serviceKey) throw new Error(`service role key missing in ${path}`);
  return { which, url: url.replace(/\/+$/, ""), serviceKey };
}

// --- CLI mode ----------------------------------------------------------------

/** --dry-run is the default. Only an explicit --execute writes anything. */
export function getMode(argv = process.argv.slice(2)) {
  if (argv.includes("--execute")) return "execute";
  return "dry-run";
}

export function logMode(mode) {
  console.log(
    mode === "execute"
      ? ">>> MODE: EXECUTE — writes WILL be performed on the NEW project"
      : ">>> MODE: DRY-RUN (default) — no writes; pass --execute to apply",
  );
}

// --- PostgREST helpers -------------------------------------------------------

function restHeaders(project, extra = {}) {
  return {
    apikey: project.serviceKey,
    Authorization: `Bearer ${project.serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function fetchWithRetry(url, options, tries = 4) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`HTTP ${res.status}: ${await res.text()}`);
      } else {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw lastErr;
}

/** Exact row count of a table (optionally filtered with PostgREST params). */
export async function countRows(project, table, filter = "") {
  const url = `${project.url}/rest/v1/${encodeURIComponent(table)}?select=*${filter ? `&${filter}` : ""}`;
  const res = await fetchWithRetry(url, {
    method: "HEAD",
    headers: restHeaders(project, { Prefer: "count=exact", Range: "0-0" }),
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`count ${table} failed: HTTP ${res.status} ${await res.text()}`);
  }
  const contentRange = res.headers.get("content-range") || "";
  const total = contentRange.split("/")[1];
  if (total === undefined || total === "*") {
    throw new Error(`count ${table}: no exact count in content-range "${contentRange}"`);
  }
  return Number(total);
}

/**
 * Read ALL rows of a table, paginating past PostgREST's 1000-row cap.
 * `order` must be a stable column (defaults to "id") for consistent paging.
 */
export async function readAllRows(project, table, { select = "*", order = "id", filter = "" } = {}) {
  const pageSize = 1000;
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const url =
      `${project.url}/rest/v1/${encodeURIComponent(table)}` +
      `?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}` +
      (filter ? `&${filter}` : "");
    const res = await fetchWithRetry(url, {
      method: "GET",
      headers: restHeaders(project, { Range: `${offset}-${offset + pageSize - 1}` }),
    });
    if (!res.ok && res.status !== 206) {
      throw new Error(`read ${table} failed: HTTP ${res.status} ${await res.text()}`);
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

/**
 * Batched upsert into the NEW project.
 * onConflict: comma-separated conflict target columns (e.g. "email" or
 * "campaign_id,subscriber_id"). ignoreDuplicates=true → "do nothing" semantics.
 * Returns number of rows sent.
 */
export async function upsertRows(project, table, rows, { onConflict, ignoreDuplicates = false, batchSize = 500 } = {}) {
  if (!rows.length) return 0;
  const prefer = `resolution=${ignoreDuplicates ? "ignore-duplicates" : "merge-duplicates"},return=minimal`;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const url =
      `${project.url}/rest/v1/${encodeURIComponent(table)}` +
      (onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "");
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: restHeaders(project, { Prefer: prefer }),
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      throw new Error(
        `upsert ${table} batch ${i}-${i + batch.length - 1} failed: HTTP ${res.status} ${await res.text()}`,
      );
    }
  }
  return rows.length;
}

// --- GoTrue admin helpers ----------------------------------------------------

/** List ALL auth users of a project via the admin API (paginated). */
export async function listAuthUsers(project) {
  const users = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const url = `${project.url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
    const res = await fetchWithRetry(url, { headers: restHeaders(project) });
    if (!res.ok) {
      throw new Error(`list auth users failed: HTTP ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    const batch = body.users ?? body; // GoTrue returns { users, aud } or bare array
    users.push(...batch);
    if (batch.length < perPage) break;
  }
  return users;
}

/** Create one auth user in the NEW project. No password (hashes not exportable via API). */
export async function createAuthUser(project, { email, user_metadata, app_metadata }) {
  const res = await fetchWithRetry(`${project.url}/auth/v1/admin/users`, {
    method: "POST",
    headers: restHeaders(project),
    body: JSON.stringify({
      email,
      email_confirm: true,
      user_metadata: user_metadata ?? {},
      ...(app_metadata ? { app_metadata } : {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`create auth user ${email}: HTTP ${res.status} ${JSON.stringify(body)}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body; // includes .id
}

// --- misc utilities ----------------------------------------------------------

export function normalizeEmail(raw) {
  if (raw == null) return null;
  const email = String(raw).trim().toLowerCase();
  // permissive sanity check — we do not want to silently drop odd-but-real emails
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function writeOutputJson(filename, data) {
  ensureOutputDir();
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  return path;
}

export function readOutputJson(filename) {
  const path = join(OUTPUT_DIR, filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Append a step record to output/migration-log.json */
export function logMigrationStep(step, details) {
  ensureOutputDir();
  const path = join(OUTPUT_DIR, "migration-log.json");
  const log = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { steps: [] };
  log.steps.push({ step, at: new Date().toISOString(), ...details });
  log.last_run_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(log, null, 2) + "\n");
}

/** Deterministic UUID (v5-style via SHA-1) for legacy rows without uuid PKs. */
export async function deterministicUuid(...parts) {
  const { createHash } = await import("node:crypto");
  const h = createHash("sha1").update("dreamplay-migrate:" + parts.join(":")).digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

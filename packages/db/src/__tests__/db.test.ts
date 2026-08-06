/**
 * No-live-DB tests for @dreamplay/db:
 *   1. migrations directory sanity (ordering, non-empty, one statement each)
 *   2. every table created in SQL exists in the hand-authored types.ts
 *   3. client factories throw descriptive errors without env vars
 *   4. Database types compile (typed Row assignment)
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createAdminClient } from "../admin";
import { createBrowserClient } from "../client";
import { createServerClient } from "../server";
import type { Tables, TablesInsert } from "../types";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const migrationsDir = join(packageRoot, "supabase", "migrations");

const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
const migrationSql = migrationFiles.map((f) => ({
  file: f,
  sql: readFileSync(join(migrationsDir, f), "utf8"),
}));

describe("migrations directory", () => {
  it("contains the five phase-1 migration files", () => {
    expect(migrationFiles.length).toBeGreaterThanOrEqual(5);
  });

  it("every file has a sortable 14-digit timestamp prefix", () => {
    for (const file of migrationFiles) {
      expect(file, `bad migration filename: ${file}`).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
    }
  });

  it("files sort in apply order (lexicographic == chronological)", () => {
    const sorted = [...migrationFiles].sort();
    expect(migrationFiles.slice().sort()).toEqual(sorted);
    // prefixes must be strictly increasing — no duplicate timestamps
    const prefixes = sorted.map((f) => f.slice(0, 14));
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("every migration is non-empty and contains at least one SQL statement", () => {
    for (const { file, sql } of migrationSql) {
      const withoutComments = sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim();
      expect(withoutComments.length, `${file} is empty`).toBeGreaterThan(0);
      expect(withoutComments, `${file} has no terminated statement`).toContain(";");
    }
  });

  it("sent_history carries the (campaign_id, subscriber_id) unique constraint", () => {
    const email = migrationSql.find(({ file }) => file.includes("email"));
    expect(email).toBeDefined();
    expect(email!.sql).toMatch(/unique\s*\(campaign_id,\s*subscriber_id\)/i);
  });

  it("events has GIN metadata index and ab_variant expression index", () => {
    const analytics = migrationSql.find(({ file }) => file.includes("analytics.sql"));
    expect(analytics).toBeDefined();
    expect(analytics!.sql).toMatch(/using gin \(metadata\)/i);
    expect(analytics!.sql).toMatch(/metadata ->> 'ab_variant'/i);
  });

  it("RLS is enabled for every table created in the migrations", () => {
    const created = new Set(
      migrationSql.flatMap(({ sql }) =>
        [...sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/gi)].map((m) => m[1]!)
      )
    );
    const rls = migrationSql.map(({ sql }) => sql).join("\n");
    for (const table of created) {
      expect(rls, `RLS not enabled on ${table}`).toMatch(
        new RegExp(`alter table public\\.${table}\\s+enable row level security`, "i")
      );
    }
  });
});

describe("types.ts covers the schema", () => {
  it("every table created in SQL appears in the Database interface", () => {
    const created = migrationSql.flatMap(({ sql }) =>
      [...sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/gi)].map((m) => m[1]!)
    );
    expect(created.length).toBeGreaterThanOrEqual(24);
    const typesSource = readFileSync(join(packageRoot, "src", "types.ts"), "utf8");
    for (const table of created) {
      expect(typesSource, `types.ts is missing table "${table}"`).toMatch(
        new RegExp(`^      ${table}: \\{`, "m")
      );
    }
  });

  it("Database row/insert types compile", () => {
    // Purely compile-time checks — assignment failures break `pnpm typecheck`.
    const buyer: Tables<"buyers"> = {
      id: "00000000-0000-0000-0000-000000000000",
      email: "buyer@example.com",
      notes: null,
      source: "shopify_webhook",
      shopify_order_number: "#1234",
      kind: "buyer",
      purchase_date: "2026-07-01T00:00:00Z",
      price_paid_usd: 599,
      product_line: "DreamPlay Piano Bundle",
      size_variant: "DS6.0",
      finish: "White",
      est_ship_date: "2027-07-01",
      order_details_source: "shopify #1234",
      pro_upgrade_requested: false,
      created_at: "2026-07-16T00:00:00Z",
      updated_at: "2026-07-16T00:00:00Z",
    };
    const insert: TablesInsert<"events"> = {
      event_name: "pageview",
      metadata: { ab_variant: "b" },
    };
    expect(buyer.source).toBe("shopify_webhook");
    expect(insert.event_name).toBe("pageview");
  });
});

describe("client factories without env", () => {
  const ENV_KEYS = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("createAdminClient throws a descriptive error", () => {
    expect(() => createAdminClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(() => createAdminClient()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("createBrowserClient throws a descriptive error", () => {
    expect(() => createBrowserClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("createServerClient throws a descriptive error", () => {
    expect(() =>
      createServerClient({ getAll: () => [], setAll: () => undefined })
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("factories succeed once env vars exist", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(createAdminClient()).toBeTruthy();
    expect(createServerClient({ getAll: () => [], setAll: () => undefined })).toBeTruthy();
  });
});

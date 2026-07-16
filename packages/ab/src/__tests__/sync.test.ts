import { describe, expect, it } from "vitest";

import type { AdminClient } from "@dreamplay/db";

import { defineExperiments } from "../experiments";
import { syncExperimentsToDb } from "../sync";

interface UpsertRow {
  key: string;
  name: string;
  status: string;
  variants: unknown;
  started_at: string | null;
  concluded_at: string | null;
}

function createFakeDb(existingRows: Array<Partial<UpsertRow>> = []) {
  const upserted: UpsertRow[][] = [];
  const client = {
    from(table: string) {
      if (table !== "experiments") throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          in: async () => ({ data: existingRows, error: null }),
        }),
        upsert: async (rows: UpsertRow[], options: { onConflict: string }) => {
          expect(options.onConflict).toBe("key");
          upserted.push(rows);
          return { error: null };
        },
      };
    },
  } as unknown as AdminClient;
  return { client, upserted };
}

const registry = defineExperiments([
  {
    key: "hero",
    name: "Hero layout",
    paths: [{ type: "exact", path: "/" }],
    variants: [
      { key: "a", weight: 1, label: "Control" },
      { key: "b", weight: 1 },
    ],
    status: "running",
  },
  {
    key: "old_test",
    name: "Old test",
    paths: [{ type: "exact", path: "/" }],
    variants: [{ key: "winner", weight: 1 }],
    status: "concluded",
    forcedVariant: "winner",
  },
]);

describe("syncExperimentsToDb", () => {
  it("upserts the full registry keyed on experiment key", async () => {
    const { client, upserted } = createFakeDb();
    const now = new Date("2026-07-16T12:00:00Z");
    await syncExperimentsToDb(registry, { client, now: () => now });

    expect(upserted).toHaveLength(1);
    const rows = upserted[0]!;
    expect(rows.map((r) => r.key)).toEqual(["hero", "old_test"]);
    const hero = rows[0]!;
    expect(hero).toMatchObject({ name: "Hero layout", status: "running" });
    expect(hero.started_at).toBe(now.toISOString());
    expect(hero.concluded_at).toBeNull();
    expect(hero.variants).toMatchObject({
      forcedVariant: null,
      variants: [{ key: "a", weight: 1, label: "Control" }, { key: "b", weight: 1 }],
    });
    const old = rows[1]!;
    expect(old.status).toBe("concluded");
    expect(old.concluded_at).toBe(now.toISOString());
  });

  it("never rewinds existing started_at/concluded_at timestamps", async () => {
    const { client, upserted } = createFakeDb([
      { key: "hero", started_at: "2026-01-01T00:00:00Z", concluded_at: null },
    ]);
    await syncExperimentsToDb(registry, { client });
    const hero = upserted[0]!.find((r) => r.key === "hero")!;
    expect(hero.started_at).toBe("2026-01-01T00:00:00Z");
  });

  it("surfaces upsert errors instead of swallowing them", async () => {
    const client = {
      from: () => ({
        select: () => ({ in: async () => ({ data: [], error: null }) }),
        upsert: async () => ({ error: { message: "permission denied" } }),
      }),
    } as unknown as AdminClient;
    await expect(syncExperimentsToDb(registry, { client })).rejects.toThrow(
      /permission denied/
    );
  });
});

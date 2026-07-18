/**
 * Minimal in-memory fake of the Supabase PostgREST client covering exactly
 * the query shapes the email package uses. No network, no timers.
 *
 * Supported: from(table).select/insert/update/upsert/delete with eq, in,
 * contains, ilike, like, not, order, range, limit, single, maybeSingle,
 * count/head. Unique constraints (23505) are enforced per table so the
 * idempotency paths can be exercised for real.
 */

import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;

export interface FakeResult {
    data: unknown;
    error: { message: string; code?: string } | null;
    count: number | null;
    status: number;
}

type Op = "select" | "insert" | "update" | "upsert" | "delete";

interface QueuedResult {
    table: string;
    op: Op;
    result: Partial<FakeResult>;
}

export class FakeDb {
    tables: Record<string, Row[]> = {};
    /** Unique constraints: table -> list of column tuples. */
    uniques: Record<string, string[][]> = {
        sent_history: [["campaign_id", "subscriber_id"]],
        campaigns: [["send_key"]],
        suppressions: [["email"]],
    };
    private queued: QueuedResult[] = [];
    /** Log of executed operations, for assertions. */
    log: Array<{ table: string; op: Op }> = [];

    seed(table: string, rows: Row[]): void {
        this.tables[table] = rows.map((r) => ({ ...r }));
    }

    rows(table: string): Row[] {
        return this.tables[table] ?? [];
    }

    /** Force the NEXT matching query to return `result` without executing. */
    queueResult(table: string, op: Op, result: Partial<FakeResult>): void {
        this.queued.push({ table, op, result });
    }

    from(table: string): FakeQuery {
        return new FakeQuery(this, table);
    }

    // storage stub so the object can stand in where AdminClient.storage is unused
    storage = {
        from: () => {
            throw new Error("storage not faked");
        },
    };

    _takeQueued(table: string, op: Op): Partial<FakeResult> | null {
        const idx = this.queued.findIndex((q) => q.table === table && q.op === op);
        if (idx === -1) return null;
        return this.queued.splice(idx, 1)[0]!.result;
    }
}

type Filter = (row: Row) => boolean;

class FakeQuery implements PromiseLike<FakeResult> {
    private op: Op = "select";
    private filters: Filter[] = [];
    private payload: Row | Row[] | null = null;
    private wantCount = false;
    private head = false;
    private singleMode: "single" | "maybeSingle" | null = null;
    private returning = false;
    private limitN: number | null = null;
    private rangeFromTo: [number, number] | null = null;
    private orderBy: { col: string; ascending: boolean } | null = null;
    private upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};

    constructor(
        private db: FakeDb,
        private table: string
    ) {}

    select(_cols?: string, opts?: { count?: string; head?: boolean }): this {
        if (this.op === "insert" || this.op === "update" || this.op === "upsert") {
            this.returning = true;
            return this;
        }
        this.op = "select";
        if (opts?.count) this.wantCount = true;
        if (opts?.head) this.head = true;
        return this;
    }

    insert(payload: Row | Row[]): this {
        this.op = "insert";
        this.payload = payload;
        return this;
    }

    update(payload: Row): this {
        this.op = "update";
        this.payload = payload;
        return this;
    }

    upsert(payload: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }): this {
        this.op = "upsert";
        this.payload = payload;
        this.upsertOpts = opts ?? {};
        return this;
    }

    delete(): this {
        this.op = "delete";
        return this;
    }

    eq(col: string, val: unknown): this {
        this.filters.push((r) => {
            const rv = r[col];
            if (rv === val) return true;
            // citext-style case-insensitive match for string columns
            if (typeof rv === "string" && typeof val === "string") return rv.toLowerCase() === val.toLowerCase();
            return false;
        });
        return this;
    }

    in(col: string, vals: unknown[]): this {
        const set = new Set(vals.map((v) => String(v).toLowerCase()));
        this.filters.push((r) => set.has(String(r[col]).toLowerCase()));
        return this;
    }

    contains(col: string, vals: unknown[]): this {
        this.filters.push((r) => {
            const arr = (r[col] ?? []) as unknown[];
            return vals.every((v) => arr.includes(v));
        });
        return this;
    }

    ilike(col: string, pattern: string): this {
        const needle = pattern.replace(/%/g, "").toLowerCase();
        this.filters.push((r) => String(r[col] ?? "").toLowerCase().includes(needle));
        return this;
    }

    like(col: string, pattern: string): this {
        const re = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`);
        this.filters.push((r) => re.test(String(r[col] ?? "")));
        return this;
    }

    not(col: string, _op: string, value: string): this {
        // Only the "cs" (contains) negation is used: not("tags","cs","{tag}")
        const tag = value.replace(/^\{|\}$/g, "");
        this.filters.push((r) => !((r[col] ?? []) as unknown[]).includes(tag));
        return this;
    }

    order(col: string, opts?: { ascending?: boolean }): this {
        this.orderBy = { col, ascending: opts?.ascending ?? true };
        return this;
    }

    range(from: number, to: number): this {
        this.rangeFromTo = [from, to];
        return this;
    }

    limit(n: number): this {
        this.limitN = n;
        return this;
    }

    single(): this {
        this.singleMode = "single";
        return this;
    }

    maybeSingle(): this {
        this.singleMode = "maybeSingle";
        return this;
    }

    private matchRows(): Row[] {
        let rows = this.db.rows(this.table).filter((r) => this.filters.every((f) => f(r)));
        if (this.orderBy) {
            const { col, ascending } = this.orderBy;
            rows = [...rows].sort((a, b) => {
                const av = String(a[col] ?? "");
                const bv = String(b[col] ?? "");
                return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        }
        if (this.rangeFromTo) rows = rows.slice(this.rangeFromTo[0], this.rangeFromTo[1] + 1);
        if (this.limitN !== null) rows = rows.slice(0, this.limitN);
        return rows;
    }

    private uniqueViolation(candidate: Row, ignoreRows: Row[] = []): boolean {
        const constraints = this.db.uniques[this.table] ?? [];
        const existing = this.db.rows(this.table).filter((r) => !ignoreRows.includes(r));
        for (const cols of constraints) {
            if (cols.some((c) => candidate[c] === null || candidate[c] === undefined)) continue;
            if (existing.some((r) => cols.every((c) => r[c] === candidate[c]))) return true;
        }
        return false;
    }

    private execute(): FakeResult {
        const queued = this.db._takeQueued(this.table, this.op);
        this.db.log.push({ table: this.table, op: this.op });
        if (queued) {
            return { data: null, error: null, count: null, status: 200, ...queued };
        }

        if (!this.db.tables[this.table]) this.db.tables[this.table] = [];

        if (this.op === "select") {
            const rows = this.matchRows();
            const count = this.wantCount ? rows.length : null;
            if (this.head) return { data: null, error: null, count, status: 200 };
            return this.finishSelect(rows, count);
        }

        if (this.op === "insert") {
            const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
            const inserted: Row[] = [];
            for (const item of items) {
                const row: Row = { id: randomUUID(), created_at: new Date().toISOString(), ...item };
                if (this.uniqueViolation(row)) {
                    return {
                        data: null,
                        error: { message: "duplicate key value violates unique constraint", code: "23505" },
                        count: null,
                        status: 409,
                    };
                }
                this.db.tables[this.table]!.push(row);
                inserted.push(row);
            }
            return this.finishWrite(inserted);
        }

        if (this.op === "update") {
            const rows = this.matchRows();
            for (const row of rows) Object.assign(row, this.payload);
            return this.finishWrite(rows);
        }

        if (this.op === "upsert") {
            const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
            const conflictCols = (this.upsertOpts.onConflict ?? "id").split(",").map((c) => c.trim());
            const results: Row[] = [];
            for (const item of items) {
                const match = this.db
                    .rows(this.table)
                    .find((r) => conflictCols.every((c) => String(r[c] ?? "").toLowerCase() === String(item[c] ?? "").toLowerCase()));
                if (match) {
                    if (!this.upsertOpts.ignoreDuplicates) Object.assign(match, item);
                    results.push(match);
                } else {
                    const row: Row = { id: randomUUID(), created_at: new Date().toISOString(), ...item };
                    this.db.tables[this.table]!.push(row);
                    results.push(row);
                }
            }
            return this.finishWrite(results);
        }

        // delete
        const rows = this.matchRows();
        this.db.tables[this.table] = this.db.rows(this.table).filter((r) => !rows.includes(r));
        return this.finishWrite(rows);
    }

    private finishSelect(rows: Row[], count: number | null): FakeResult {
        if (this.singleMode === "maybeSingle") {
            return { data: rows[0] ? { ...rows[0] } : null, error: null, count, status: 200 };
        }
        if (this.singleMode === "single") {
            if (rows.length !== 1) {
                return {
                    data: null,
                    error: { message: `expected 1 row, got ${rows.length}`, code: "PGRST116" },
                    count,
                    status: 406,
                };
            }
            return { data: { ...rows[0] }, error: null, count, status: 200 };
        }
        return { data: rows.map((r) => ({ ...r })), error: null, count, status: 200 };
    }

    private finishWrite(rows: Row[]): FakeResult {
        if (!this.returning && !this.singleMode) return { data: null, error: null, count: null, status: 200 };
        return this.finishSelect(rows, null);
    }

    then<TResult1 = FakeResult, TResult2 = never>(
        onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        try {
            const result = this.execute();
            return Promise.resolve(result).then(onfulfilled ?? undefined, onrejected ?? undefined);
        } catch (err) {
            return Promise.reject(err).then(onfulfilled ?? undefined, onrejected ?? undefined);
        }
    }
}

import type { AdminClient } from "@dreamplay/db";

/** Cast helper: FakeDb quacks enough like AdminClient for the code under test. */
export function asAdminClient(db: FakeDb): AdminClient {
    return db as unknown as AdminClient;
}

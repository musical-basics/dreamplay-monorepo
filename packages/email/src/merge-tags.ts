/**
 * Merge tags — centralized {{variable}} resolution for all email sends.
 *
 * Three sources, in priority order per tag:
 *   1. SUBSCRIBER — pulled from the subscriber row (first_name, email, ...).
 *   2. DYNAMIC    — runtime values injected by the send pipeline
 *                   (unsubscribe_url, discount_code, ...).
 *   3. DEFAULTS   — the `merge_tags` table (name -> default_value), cached
 *                   for a short TTL. A campaign can override a default via
 *                   `defaultsOverride` (variable_values.merge_defaults) —
 *                   e.g. localizing first_name -> "Muzikale familie".
 *
 * Adapted from dreamplay-email-3 `src/lib/merge-tags.ts` to the monorepo
 * `merge_tags` schema (name / default_value / description / workspace) and to
 * an injected DB client instead of a module-level Supabase singleton.
 */

import type { AdminClient } from "@dreamplay/db";

/** Subscriber columns exposed as merge tags: tag name -> subscriber field. */
const SUBSCRIBER_FIELD_MAP: Record<string, string> = {
    first_name: "first_name",
    last_name: "last_name",
    email: "email",
    subscriber_id: "id",
    location_city: "shipping_city",
    location_country: "country",
};

/** Built-in fallback defaults when the merge_tags table is empty/unreachable. */
const BUILT_IN_DEFAULTS: Record<string, string> = {
    first_name: "Musical Family",
};

/** Aliases that all resolve to the unsubscribe URL dynamic var. */
const UNSUBSCRIBE_ALIASES = ["unsubscribe_url", "unsubscribe_link", "unsubscribe_link_url"];

// -- merge_tags table cache ---------------------------------------------------

const CACHE_TTL_MS = 60_000;
let _cache: { data: Record<string, string>; ts: number } | null = null;

/** Test hook / cache bust. */
export function clearMergeTagCache(): void {
    _cache = null;
}

/**
 * Fetch merge-tag defaults from the DB (name -> default_value), cached for
 * one minute. Falls back to built-ins on error or empty table.
 */
export async function getMergeTagDefaults(db: AdminClient): Promise<Record<string, string>> {
    const now = Date.now();
    if (_cache && now - _cache.ts < CACHE_TTL_MS) return _cache.data;

    try {
        const { data, error } = await db.from("merge_tags").select("name,default_value");
        if (error || !data || data.length === 0) return { ...BUILT_IN_DEFAULTS };
        const map: Record<string, string> = { ...BUILT_IN_DEFAULTS };
        for (const row of data) map[row.name] = row.default_value;
        _cache = { data: map, ts: now };
        return map;
    } catch {
        return { ...BUILT_IN_DEFAULTS };
    }
}

export interface ApplyMergeTagsOptions {
    /** Subscriber row (or any record with the mapped fields). */
    subscriber?: Record<string, unknown>;
    /** Runtime values, e.g. { unsubscribe_url, discount_code }. */
    dynamicVars?: Record<string, string>;
    /**
     * Per-campaign fallback overrides (variable_values.merge_defaults). Only
     * used when no live subscriber/dynamic value resolves.
     */
    defaultsOverride?: Record<string, string>;
    /** DB-backed defaults; pass the result of getMergeTagDefaults(db). */
    defaults?: Record<string, string>;
}

/**
 * Replace every known {{tag}} in `html`. Unknown tags are left untouched so
 * unresolved-variable bugs stay visible in test sends instead of silently
 * rendering as empty strings.
 */
export function applyMergeTags(html: string, options: ApplyMergeTagsOptions = {}): string {
    const subscriber = options.subscriber ?? {};
    const dynamicVars = options.dynamicVars ?? {};
    const defaultsOverride = options.defaultsOverride ?? {};
    const defaults = options.defaults ?? { ...BUILT_IN_DEFAULTS };

    // Collect all {{tag}} occurrences.
    const found = new Set<string>();
    const foundRegex = /\{\{(\w+)\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = foundRegex.exec(html)) !== null) {
        if (m[1]) found.add(m[1]);
    }

    let result = html;
    for (const tag of found) {
        let value: string | undefined;

        // 1. Unsubscribe aliases.
        if (UNSUBSCRIBE_ALIASES.includes(tag) && dynamicVars.unsubscribe_url) {
            value = dynamicVars.unsubscribe_url;
        }

        // 2. Subscriber field.
        if (value === undefined) {
            const field = SUBSCRIBER_FIELD_MAP[tag];
            if (field) {
                const raw = subscriber[field];
                if (typeof raw === "string" && raw.trim() !== "") value = raw;
            }
        }

        // 3. Dynamic var.
        if (value === undefined && dynamicVars[tag]) {
            value = dynamicVars[tag];
        }

        // 4. Campaign override, then table default.
        if (value === undefined && Object.prototype.hasOwnProperty.call(defaultsOverride, tag)) {
            value = defaultsOverride[tag];
        }
        if (value === undefined && Object.prototype.hasOwnProperty.call(defaults, tag)) {
            value = defaults[tag];
        }

        // Subscriber-mapped tags with no value anywhere render as "" rather
        // than leaking "{{last_name}}" into the email.
        if (value === undefined && SUBSCRIBER_FIELD_MAP[tag]) value = "";
        if (value === undefined && UNSUBSCRIBE_ALIASES.includes(tag)) value = "";

        if (value !== undefined) {
            result = result.replace(new RegExp(`\\{\\{${tag}\\}\\}`, "g"), value);
        }
    }

    return result;
}

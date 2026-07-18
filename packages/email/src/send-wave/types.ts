/**
 * Types for the send-wave scheduler: a multi-arm staggered campaign send.
 * Each arm is an independent (subject, html, audience) triple; audiences are
 * chunked and the chunks interleaved across arms so time-of-day effects fall
 * out of per-arm comparisons.
 */

export type Candidate = {
    email: string;
    first_name?: string;
    last_name?: string;
    country?: string;
    city?: string;
    zip?: string;
    tags?: string[];
    source?: string;
};

export type ArmDef = {
    /** Short label used in child names and the wave sendKey. */
    key: string;
    subject: string;
    html: string;
    audience: Candidate[];
};

export type Wave = {
    arm: ArmDef;
    chunkIdx: number;
    chunk: Candidate[];
};

export type ScheduledChild = {
    armKey: string;
    chunkIdx: number;
    childId: string;
    scheduledAt: string;
    recipients: number;
    reused: boolean;
};

export type RunWaveSendOptions = {
    /** Email workspace, e.g. "musicalbasics". */
    workspace: string;
    /** Parent campaign UUID to clone per child. */
    parentCampaignId: string;
    /** Optional campaign whose variable_values keys get copied into children. */
    sourceCampaignId?: string;
    copyVariableKeys?: string[];

    arms: ArmDef[];

    /** ISO timestamp for the first child fire. Must be >= now + 60s. */
    scheduledFirstFire: string;
    /** Seconds between consecutive child fires (default 240). */
    staggerSec?: number;
    /** Max recipients per child (default 250). */
    chunkSize?: number;
    /** Concurrent subscriber upserts (default 8). */
    ensureConcurrency?: number;

    /**
     * Idempotency namespace. Wave children get
     * send_key = `${doneTag}:${armKey}:${chunkIdx}` so re-runs reuse them,
     * and the done marker tag applied at finalize time is this value.
     */
    doneTag: string;
    /** Extra provenance tags for ensured subscribers. */
    prospectTags?: string[] | ((armKey: string) => string[]);

    fromName: string;
    fromEmail: string;
    clickTrackingMode?: "append" | "redirect";

    /** Log the plan, make no writes. */
    dryRun?: boolean;
};

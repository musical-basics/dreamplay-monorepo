/**
 * Agent API client for the send-wave CLI. Unlike the legacy client, EVERY
 * request retries with exponential backoff on 429/5xx/network errors — a
 * single transient 500 no longer aborts a whole wave run (the 2026-06-04
 * wave-11 incident, non-negotiable fix #2).
 */

import { createAdminClient, type AdminClient } from "@dreamplay/db";
import { HttpStatusError, isRetryableStatus, withRetry } from "../retry";

export type SendWaveClient = {
    workspace: string;
    /** Authenticated fetch against /api/agent/{workspace}/... with retries. */
    api: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
    /** Service-role DB client for direct reads/patches. */
    db: AdminClient;
    baseUrl: string;
};

export type CreateAgentClientOptions = {
    workspace: string;
    /** Base URL of the app hosting /api/agent. Default: DREAMPLAY_EMAIL_BASE_URL or NEXT_PUBLIC_APP_URL. */
    baseUrl?: string;
    apiKey?: string;
    db?: AdminClient;
};

export function createAgentClient(opts: CreateAgentClientOptions): SendWaveClient {
    const baseUrl =
        opts.baseUrl ?? process.env.DREAMPLAY_EMAIL_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (!baseUrl) {
        throw new Error("Agent API base URL missing: set DREAMPLAY_EMAIL_BASE_URL or NEXT_PUBLIC_APP_URL");
    }
    const apiKey = opts.apiKey ?? process.env.AGENT_API_KEY;
    if (!apiKey) throw new Error("AGENT_API_KEY is missing");

    const db = opts.db ?? createAdminClient();

    async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
        return withRetry(async () => {
            const r = await fetch(`${baseUrl}${path}`, {
                ...init,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    ...(init?.headers || {}),
                },
            });
            const text = await r.text();
            if (!r.ok) {
                if (isRetryableStatus(r.status)) throw new HttpStatusError(r.status, `${path} -> ${r.status}: ${text}`);
                // Non-retryable client error: fail immediately with detail.
                throw new HttpStatusError(r.status, `${path} -> ${r.status}: ${text}`);
            }
            return (text ? JSON.parse(text) : {}) as T;
        });
    }

    return { workspace: opts.workspace, api, db, baseUrl };
}

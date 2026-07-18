/**
 * Retry with exponential backoff for transient failures (429 / 5xx / network).
 *
 * Non-negotiable fix #2: the legacy send-wave client had NO retry on 5xx — a
 * single transient 500 aborted whole sends (2026-06-04 wave-11 incident).
 * Every Resend call AND every internal call in the new pipeline goes through
 * this helper.
 */

export class HttpStatusError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = "HttpStatusError";
    }
}

/** Transient statuses worth retrying. */
export function isRetryableStatus(status: number): boolean {
    return status === 429 || (status >= 500 && status <= 599);
}

function isRetryableError(error: unknown): boolean {
    if (error instanceof HttpStatusError) return isRetryableStatus(error.status);
    // Network-level failures (fetch TypeError, ECONNRESET, aborts...) are
    // retryable; logic errors thrown deliberately with 4xx statuses are not.
    return true;
}

export interface RetryOptions {
    /** Total attempts including the first (default 5). */
    maxAttempts?: number;
    /** First backoff delay in ms (default 500; doubles per attempt). */
    baseDelayMs?: number;
    /** Cap on a single delay (default 15s). */
    maxDelayMs?: number;
    /** Injectable for tests. */
    sleep?: (ms: number) => Promise<void>;
    onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Run `fn`, retrying on 429/5xx/network errors with exponential backoff.
 * Throws the last error after `maxAttempts` attempts. Non-retryable errors
 * (HttpStatusError with a 4xx other than 429) propagate immediately.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 5;
    const baseDelayMs = options.baseDelayMs ?? 500;
    const maxDelayMs = options.maxDelayMs ?? 15_000;
    const sleep = options.sleep ?? defaultSleep;

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (!isRetryableError(error) || attempt === maxAttempts) throw error;
            const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
            options.onRetry?.(attempt, error, delay);
            await sleep(delay);
        }
    }
    throw lastError;
}

/**
 * Supabase-style calls return `{ error, status }` instead of throwing. This
 * wrapper converts transient response statuses into throws so withRetry can
 * back off, then returns the settled response. `makeQuery` must build a FRESH
 * query per attempt (PostgrestBuilder promises are single-use).
 */
export async function retryDb<T extends { error: { message: string } | null; status?: number }>(
    makeQuery: () => PromiseLike<T>,
    options: RetryOptions = {}
): Promise<T> {
    return withRetry(async () => {
        const res = await makeQuery();
        if (res.error && res.status !== undefined && isRetryableStatus(res.status)) {
            throw new HttpStatusError(res.status, res.error.message);
        }
        return res;
    }, options);
}

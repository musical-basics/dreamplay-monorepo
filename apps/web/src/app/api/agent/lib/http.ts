import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function json(data: unknown, status = 200) {
    return NextResponse.json(data, { status });
}

export function errorResponse(error: string, status = 400, details?: unknown) {
    return NextResponse.json({ error, details }, { status });
}

export function zodErrorResponse(error: ZodError) {
    return errorResponse("VALIDATION_ERROR", 422, error.flatten());
}

export async function readJson(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

/** Bearer AGENT_API_KEY auth. Returns an error response or null when OK. */
export function requireAgentAuth(request: Request) {
    const expected = process.env.AGENT_API_KEY;
    const actual = request.headers.get("authorization");

    if (!expected) return errorResponse("AGENT_API_KEY is not configured", 503);
    if (actual !== `Bearer ${expected}`) return errorResponse("Unauthorized", 401);
    return null;
}

// --- pagination ---------------------------------------------------------------

export interface Pagination {
    limit: number;
    offset: number;
}

export function paginationFromUrl(url: URL, defaults: Partial<Pagination> = {}): Pagination {
    const rawLimit = Number(url.searchParams.get("limit") || defaults.limit || 25);
    const rawOffset = Number(url.searchParams.get("offset") || defaults.offset || 0);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500) : 25;
    const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;
    return { limit, offset };
}

export function rangeFor({ limit, offset }: Pagination): [number, number] {
    return [offset, offset + limit - 1];
}

export function listEnvelope<T>(data: T[] | null, pagination: Pagination, count: number | null) {
    return {
        data: data || [],
        pagination: { ...pagination, count: count ?? null },
    };
}

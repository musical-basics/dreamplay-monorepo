/**
 * I/O for the payment auto-capture sweep: Shopify reads and writes, plus the
 * setting and heartbeat rows in app_settings. Shared by the Inngest sweep
 * (acts) and /admin/auto-capture (displays), so both always agree about what
 * will happen to each order.
 *
 * Decision logic lives in ./auto-capture and is pure; nothing here decides.
 */

import type { AdminClient } from "@dreamplay/db";
import { adminGraphql } from "@/lib/shopify/admin";
import {
    AUTO_CAPTURE_SETTING,
    AUTO_CAPTURE_STATUS,
    type AutoCaptureSetting,
    type CaptureDecision,
    type CaptureOrder,
    type CaptureResult,
    type GqlOrderNode,
    ORDER_FIELDS,
    decideCapture,
    normalizeOrder,
    parseAutoCaptureSetting,
} from "./auto-capture";

export interface AutoCaptureItem {
    order: CaptureOrder;
    decision: CaptureDecision;
}

export interface AutoCapturePipeline {
    setting: AutoCaptureSetting;
    items: AutoCaptureItem[];
    evaluatedAt: string;
}

export async function loadAutoCaptureSetting(db: AdminClient): Promise<AutoCaptureSetting> {
    const { data, error } = await db.from("app_settings").select("value").eq("key", AUTO_CAPTURE_SETTING).maybeSingle();
    if (error) throw new Error(`auto-capture setting read failed: ${error.message}`);
    return parseAutoCaptureSetting(data?.value);
}

/** Page cap: 10 x 50 authorized orders is far beyond any real backlog. */
const MAX_PAGES = 10;

/**
 * Every order Shopify lists as financially "authorized" (card held, not
 * captured). Expired, voided and paid orders are excluded by the search, and
 * decideCapture re-checks `capturable` anyway.
 */
export async function fetchAuthorizedOrders(): Promise<CaptureOrder[]> {
    const orders: CaptureOrder[] = [];
    let after: string | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
        const data: {
            orders: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: GqlOrderNode[] };
        } = await adminGraphql(
            `query authorizedOrders($after: String) {
                orders(first: 50, after: $after, sortKey: CREATED_AT, query: "financial_status:authorized") {
                    pageInfo { hasNextPage endCursor }
                    nodes { ${ORDER_FIELDS} }
                }
            }`,
            { after },
        );
        orders.push(...data.orders.nodes.map(normalizeOrder));
        if (!data.orders.pageInfo.hasNextPage) return orders;
        after = data.orders.pageInfo.endCursor;
    }
    return orders;
}

export async function loadAutoCapturePipeline(db: AdminClient, now = new Date()): Promise<AutoCapturePipeline> {
    const [setting, orders] = await Promise.all([loadAutoCaptureSetting(db), fetchAuthorizedOrders()]);
    return {
        setting,
        items: orders.map((order) => ({ order, decision: decideCapture(order, setting, now) })),
        evaluatedAt: now.toISOString(),
    };
}

/**
 * Capture one authorization for the planned amount, in the customer's
 * currency. Never throws: every failure comes back as `ok: false` so the
 * sweep can hand the order to a human instead of retrying a payment
 * operation blind. Shopify refuses to capture more than was authorized, so a
 * repeat can never double-charge; at worst it fails.
 */
export async function captureAuthorization(
    orderId: string,
    plan: { authorizationId: string; amount: string; currencyCode: string },
): Promise<CaptureResult> {
    try {
        const data = await adminGraphql<{
            orderCapture: {
                transaction: { id: string; status: string } | null;
                userErrors: { field: string[] | null; message: string }[];
            };
        }>(
            `mutation autoCapture($input: OrderCaptureInput!) {
                orderCapture(input: $input) {
                    transaction { id status }
                    userErrors { field message }
                }
            }`,
            {
                input: {
                    id: orderId,
                    parentTransactionId: plan.authorizationId,
                    amount: plan.amount,
                    currency: plan.currencyCode,
                },
            },
        );
        const { transaction, userErrors } = data.orderCapture;
        if (userErrors.length) return { ok: false, error: userErrors.map((e) => e.message).join("; ") };
        if (!transaction) return { ok: false, error: "Shopify returned no capture transaction" };
        if (transaction.status === "FAILURE" || transaction.status === "ERROR") {
            return { ok: false, error: `The payment gateway returned ${transaction.status} for the capture` };
        }
        // SUCCESS, or PENDING for a gateway that settles asynchronously.
        return { ok: true, transactionId: transaction.id, status: transaction.status };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/** Add tags without touching existing ones. Throws so the Inngest step retries. */
export async function addOrderTags(orderId: string, tags: string[]): Promise<void> {
    const data = await adminGraphql<{ tagsAdd: { userErrors: { message: string }[] } }>(
        `mutation tagOrder($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) { userErrors { message } }
        }`,
        { id: orderId, tags },
    );
    if (data.tagsAdd.userErrors.length) {
        throw new Error(`tagsAdd failed: ${data.tagsAdd.userErrors.map((e) => e.message).join("; ")}`);
    }
}

// --- Heartbeat -------------------------------------------------------------------

export interface AutoCaptureStatus {
    lastRunAt: string | null;
    lastOutcome: "ok" | "disabled" | null;
    lastCounts: { captured: number; handedOver: number; warned: number; waiting: number } | null;
    lastErrorAt: string | null;
    lastError: string | null;
    lastErrorAlertedAt: string | null;
}

const EMPTY_STATUS: AutoCaptureStatus = {
    lastRunAt: null,
    lastOutcome: null,
    lastCounts: null,
    lastErrorAt: null,
    lastError: null,
    lastErrorAlertedAt: null,
};

export async function readAutoCaptureStatus(db: AdminClient): Promise<AutoCaptureStatus> {
    const { data } = await db.from("app_settings").select("value").eq("key", AUTO_CAPTURE_STATUS).maybeSingle();
    const value = data?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ...EMPTY_STATUS };
    return { ...EMPTY_STATUS, ...(value as Partial<AutoCaptureStatus>) };
}

/** Read-merge-write. Sweeps are singletons, so there is no competing writer. */
export async function updateAutoCaptureStatus(db: AdminClient, patch: Partial<AutoCaptureStatus>): Promise<void> {
    const current = await readAutoCaptureStatus(db);
    const { error } = await db
        .from("app_settings")
        .upsert({ key: AUTO_CAPTURE_STATUS, value: { ...current, ...patch } }, { onConflict: "key" });
    if (error) throw new Error(`auto-capture status write failed: ${error.message}`);
}

/**
 * BACKUP payment capture job (decision D15). Runs hourly from GitHub Actions
 * (.github/workflows/payment-capture-backup.yml), independently of the
 * primary Inngest sweep on Vercel (D14), and catches what the primary
 * silently missed:
 *
 *   - captures any clean authorization still uncaptured 48h after the
 *     primary's hold (day 5 at the default 72h), and says the primary missed it;
 *   - hands flagged/irregular orders the primary never handed over to a human
 *     (tag capture-manually + email);
 *   - sends the one-time 24h-before-expiry warning (shared tag with the primary);
 *   - alerts when the primary's heartbeat is more than 3h old (once a day).
 *
 * Rules: ./auto-capture-backup-rules.mjs (pure, parity-tested against the primary).
 *
 *   node scripts/shopify/auto-capture-backup.mjs            # dry run: print the plan, change nothing
 *   node scripts/shopify/auto-capture-backup.mjs --execute  # capture, tag, email, heartbeat
 *
 * The repo is PUBLIC, so in GitHub Actions the log carries counts only; order
 * details go to the (private) email and the heartbeat row.
 *
 * Env (monorepo-root .env.local locally, repo secrets in Actions):
 *   SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET (write_orders)
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (setting + heartbeats;
 *     best effort: if unreadable, defaults apply and captures still happen)
 *   RESEND_API_KEY (alerts to support@dreamplaypianos.com)
 * Exits 1 when anything failed, so GitHub also emails about the failed run.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
    BACKUP_STATUS_KEY,
    DEADLINE_WARNED_TAG,
    MANUAL_CAPTURE_TAG,
    ORDER_FIELDS,
    PRIMARY_STALE_HOURS,
    PRIMARY_STATUS_KEY,
    SETTING_KEY,
    alertDue,
    decideBackup,
    isStale,
    needsDeadlineWarning,
    parseSetting,
} from "./auto-capture-backup-rules.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = { ...process.env };
try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
} catch { /* fall back to process.env */ }

const EXECUTE = process.argv.includes("--execute");
const IN_ACTIONS = env.GITHUB_ACTIONS === "true";
const domain = env.SHOPIFY_STORE_DOMAIN || "dreamplay-pianos.myshopify.com";
const version = env.SHOPIFY_API_VERSION || "2025-10";
const RECIPIENT = "support@dreamplaypianos.com";
const FROM = env.RESEND_FROM_EMAIL || "DreamPlay <hello@email.dreamplaypianos.com>";
const ADMIN_URL = "https://www.dreamplaypianos.com/admin/auto-capture";
const now = new Date();
const errors = [];

/** Order details only outside the public Actions log. */
function detail(...args) {
    if (!IN_ACTIONS) console.log(...args);
}

// --- Supabase (best effort) -----------------------------------------------------

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function readSetting(key) {
    const res = await fetch(
        `${supabaseUrl}/rest/v1/app_settings?select=value&key=eq.${encodeURIComponent(key)}`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) throw new Error(`app_settings read ${res.status}`);
    const rows = await res.json();
    return rows[0]?.value ?? null;
}

async function writeSetting(key, value) {
    const res = await fetch(`${supabaseUrl}/rest/v1/app_settings?on_conflict=key`, {
        method: "POST",
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error(`app_settings write ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// --- Shopify ----------------------------------------------------------------------

async function shopifyToken() {
    const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: env.SHOPIFY_ADMIN_CLIENT_ID,
            client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET,
            grant_type: "client_credentials",
        }),
    });
    if (!res.ok) throw new Error(`Shopify token exchange failed (${res.status})`);
    return (await res.json()).access_token;
}

async function gql(token, query, variables = {}) {
    const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors).slice(0, 300)}`);
    return json.data;
}

async function fetchAuthorizedOrders(token) {
    const nodes = [];
    let after = null;
    for (let page = 0; page < 10; page++) {
        const data = await gql(
            token,
            `query backupOrders($after: String) {
                orders(first: 50, after: $after, sortKey: CREATED_AT, query: "financial_status:authorized") {
                    pageInfo { hasNextPage endCursor }
                    nodes { ${ORDER_FIELDS} }
                }
            }`,
            { after },
        );
        nodes.push(...data.orders.nodes);
        if (!data.orders.pageInfo.hasNextPage) break;
        after = data.orders.pageInfo.endCursor;
    }
    return nodes;
}

async function capture(token, orderId, plan) {
    try {
        const data = await gql(
            token,
            `mutation backupCapture($input: OrderCaptureInput!) {
                orderCapture(input: $input) { transaction { id status } userErrors { message } }
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
            return { ok: false, error: `The payment gateway returned ${transaction.status}` };
        }
        return { ok: true, status: transaction.status };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

async function addTag(token, orderId, tag) {
    const data = await gql(
        token,
        `mutation backupTag($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
        { id: orderId, tags: [tag] },
    );
    if (data.tagsAdd.userErrors.length) throw new Error(data.tagsAdd.userErrors.map((e) => e.message).join("; "));
}

// --- Email ------------------------------------------------------------------------

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const eastern = (iso) =>
    `${new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(iso))} ET`;
const fmtMoney = (amount, currency) =>
    `${currency} ${Number(amount).toFixed(currency === "JPY" || currency === "KRW" ? 0 : 2)}`;
const orderUrl = (gid) => `https://admin.shopify.com/store/${domain.replace(/\.myshopify\.com$/, "")}/orders/${gid.split("/").pop()}`;
const orderLink = (node) => {
    const total = node.currentTotalPriceSet?.presentmentMoney;
    return `<a href="${esc(orderUrl(node.id))}">${esc(node.name)}</a>${total ? `, ${esc(fmtMoney(total.amount, total.currencyCode))}` : ""}`;
};
const expiry = (iso) => (iso ? `Authorization expires ${esc(eastern(iso))}.` : "Authorization expiry unknown.");

async function sendEmail(subject, html) {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: RECIPIENT, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// --- Run --------------------------------------------------------------------------

let setting = parseSetting(null);
let primaryStatus = null;
let backupStatus = {};
let settingNote = "";
/** Only a successful read can tell us the primary is down. */
let statusRead = false;
if (supabaseUrl && supabaseKey) {
    try {
        [setting, primaryStatus, backupStatus] = await Promise.all([
            readSetting(SETTING_KEY).then(parseSetting),
            readSetting(PRIMARY_STATUS_KEY),
            readSetting(BACKUP_STATUS_KEY).then((v) => v ?? {}),
        ]);
        statusRead = true;
    } catch (err) {
        settingNote = `Could not read settings from Supabase (${err.message}); used the defaults.`;
        errors.push(settingNote);
    }
} else {
    settingNote = "Supabase env missing; used the default settings.";
}
console.log(`mode=${EXECUTE ? "execute" : "dry-run"} enabled=${setting.enabled} holdHours=${setting.holdHours}`);

let token;
let nodes = [];
try {
    token = await shopifyToken();
    nodes = await fetchAuthorizedOrders(token);
} catch (err) {
    errors.push(`Shopify unreachable: ${err.message}`);
}

const plan = nodes.map((node) => ({ node, decision: decideBackup(node, setting, now) }));
const counts = {};
for (const { node, decision } of plan) {
    counts[decision.action] = (counts[decision.action] ?? 0) + 1;
    detail(`${node.name}: ${JSON.stringify(decision)}`);
}
console.log(`authorized orders=${nodes.length} ${JSON.stringify(counts)}`);

const primaryDown = statusRead && isStale(primaryStatus?.lastRunAt ?? null, PRIMARY_STALE_HOURS, now);
console.log(`primary heartbeat stale=${primaryDown}`);

if (!EXECUTE) {
    console.log("dry run: nothing captured, tagged, emailed or recorded");
    if (errors.length) console.log(`errors: ${errors.length}`);
    process.exit(errors.length ? 1 : 0);
}

const captured = [];
const handOver = [];
const expiring = [];
if (setting.enabled && token) {
    for (const { node, decision } of plan) {
        let why = null;
        if (decision.action === "capture") {
            const result = await capture(token, node.id, decision);
            if (result.ok) {
                captured.push({ node, decision, status: result.status });
                continue;
            }
            errors.push("a capture failed");
            why = `The backup's capture failed: ${result.error}`;
            handOver.push({ node, why, expiresAt: decision.expiresAt });
        } else if (decision.action === "hand-over") {
            why = decision.detail;
            handOver.push({ node, why, expiresAt: decision.expiresAt });
        } else if (decision.action === "human") {
            why = `Tagged ${MANUAL_CAPTURE_TAG}`;
        } else if (decision.action === "wait") {
            why = "Not captured yet";
        } else if (decision.action === "skip" && decision.reason === "capture_in_flight") {
            why = "A capture is still pending at the payment gateway";
        } else {
            continue;
        }
        const expiresAt = decision.expiresAt ?? null;
        if (needsDeadlineWarning(node, expiresAt, now)) expiring.push({ node, why, expiresAt });
    }
}

const primaryAlert = primaryDown && alertDue(backupStatus.primaryDownAlertedAt ?? null, now);

const sections = [];
const warnedNames = new Set(expiring.map((e) => e.node.name));
const handed = handOver.filter((h) => !warnedNames.has(h.node.name));
if (expiring.length) {
    sections.push(
        `<p><strong>Expiring within 24 hours.</strong> Capture these in Shopify now, or the money is lost:</p>`,
        `<ul>${expiring.map((e) => `<li>${orderLink(e.node)}. ${esc(e.why)}. ${expiry(e.expiresAt)}</li>`).join("")}</ul>`,
    );
}
if (handed.length) {
    sections.push(
        `<p><strong>Needs you.</strong> Found by the backup job because the primary sweep never handed these over. Capture in Shopify if genuine, or cancel:</p>`,
        `<ul>${handed.map((h) => `<li>${orderLink(h.node)}. ${esc(h.why)}. ${expiry(h.expiresAt)}</li>`).join("")}</ul>`,
    );
}
if (captured.length) {
    sections.push(
        `<p><strong>Captured by the backup job.</strong> The primary sweep should have captured these 2 days ago and did not, so it is probably broken:</p>`,
        `<ul>${captured
            .map((c) => `<li>${orderLink(c.node)}, authorized ${esc(eastern(c.decision.authorizedAt))}${c.status === "PENDING" ? " (capture pending at the gateway)" : ""}.</li>`)
            .join("")}</ul>`,
    );
}
if (primaryAlert) {
    const last = primaryStatus?.lastRunAt ? esc(eastern(primaryStatus.lastRunAt)) : "never";
    sections.push(
        `<p><strong>The primary auto-capture sweep has not run since ${last}.</strong> It should run every hour (Inngest function shopify-auto-capture-sweep on Vercel). ` +
            `Until it is fixed, this backup job captures payments on day 5 instead of day 3.</p>`,
    );
}
if (settingNote) sections.push(`<p>${esc(settingNote)}</p>`);

if (sections.length && (expiring.length || handed.length || captured.length || primaryAlert)) {
    const actions = expiring.length + handed.length;
    const subject = actions
        ? `Action needed: ${actions} payment${actions === 1 ? "" : "s"} to capture by hand (backup job)`
        : captured.length
          ? `Backup capture: ${captured.map((c) => c.node.name).join(", ")} (the primary sweep missed ${captured.length === 1 ? "it" : "them"})`
          : "Payment auto-capture: the primary sweep is down (backup job)";
    sections.push(
        `<p style="color:#888;font-size:12px">Sent by the backup payment capture job (GitHub Actions, hourly). ` +
            `It captures only what the primary sweep should already have captured, 2 days later. Settings: <a href="${ADMIN_URL}">${ADMIN_URL}</a></p>`,
    );
    try {
        await sendEmail(subject, sections.join("\n"));
        console.log("alert email sent");
    } catch (err) {
        errors.push(`alert email failed: ${err.message}`);
    }
}

// Tags after the email: a failed tag means a repeat alert next hour, never a silent miss.
for (const h of handOver) {
    try {
        await addTag(token, h.node.id, MANUAL_CAPTURE_TAG);
    } catch (err) {
        errors.push(`tag failed: ${err.message}`);
    }
}
for (const e of expiring) {
    try {
        await addTag(token, e.node.id, DEADLINE_WARNED_TAG);
    } catch (err) {
        errors.push(`tag failed: ${err.message}`);
    }
}

if (statusRead) {
    try {
        await writeSetting(BACKUP_STATUS_KEY, {
            lastRunAt: now.toISOString(),
            lastCounts: { captured: captured.length, handedOver: handOver.length, warned: expiring.length },
            lastError: errors.length ? errors.join(" | ").slice(0, 1000) : null,
            primaryStale: primaryDown,
            primaryDownAlertedAt: primaryAlert
                ? now.toISOString()
                : primaryDown
                  ? (backupStatus.primaryDownAlertedAt ?? null)
                  : null,
        });
    } catch (err) {
        errors.push(`heartbeat write failed: ${err.message}`);
    }
}

console.log(`captured=${captured.length} handedOver=${handOver.length} warned=${expiring.length} errors=${errors.length}`);
process.exit(errors.length ? 1 : 0);

/**
 * send-call-reminders.mjs — the "I am calling you in an hour" email.
 *
 * Sends a short reminder to buyers whose confirmed call starts inside the
 * reminder window (default: the next 60 to 75 minutes). Designed to be run
 * on a schedule (cron every 15 minutes is plenty); each call is reminded at
 * most once because reminder_sent_at is stamped on the row.
 *
 * Same pipeline guarantees as send-call-invites.mjs:
 *   - ONE child campaign resolved via campaigns.send_key -> idempotent reruns
 *   - suppression + subscribers.status='active' checks
 *   - sent_history UNIQUE (campaign_id, subscriber_id), checked and inserted
 *   - unsubscribe footer + RFC 8058 one-click headers (HMAC-signed)
 *   - append-mode tracking (sid/cid params + open pixel), never redirects
 *   - 300ms pacing, 3x backoff on 429/5xx
 *
 * Guards specific to reminders:
 *   - only status='scheduled' AND confirmed_at set (never remind someone who
 *     has not agreed to the time)
 *   - reminder_sent_at must be null
 *   - the Zoom row must already have a meeting_url, otherwise the reminder
 *     would tell them to join a link they were never sent
 *
 * Usage:
 *   node send-call-reminders.mjs                    dry run (window: next 60-75 min)
 *   node send-call-reminders.mjs --window 240       widen the lookahead, in minutes
 *   node send-call-reminders.mjs --test <email>     render one to a test address
 *   node send-call-reminders.mjs --execute          REAL send
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const EXECUTE = argv.includes("--execute");
const testIdx = argv.indexOf("--test");
const TEST_EMAIL = testIdx === -1 ? null : argv[testIdx + 1];
if (testIdx !== -1 && !TEST_EMAIL) { console.error("--test requires an email address"); process.exit(1); }
const winIdx = argv.indexOf("--window");
/** Upper edge of the lookahead window, in minutes from now. */
const WINDOW_MIN = winIdx === -1 ? 75 : Number(argv[winIdx + 1]);
if (!Number.isFinite(WINDOW_MIN) || WINDOW_MIN <= 0) { console.error("--window must be a positive number of minutes"); process.exit(1); }
/** Lower edge: never remind a call that already started. */
const FLOOR_MIN = 0;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(repoRoot, ".env.local"), join(repoRoot, "apps/web/.env.local")]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      // Values may be quoted in .env.local; strip a single matching pair.
      // Leaving them in sent literal quote characters to Zoom, whose token
      // endpoint answered "invalid_client" (2026-08-14).
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
      }
    }
  } catch {}
}
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const UNSUB_SECRET = process.env.EMAIL_UNSUBSCRIBE_SECRET;
if (!SUPA_URL || !SVC || !RESEND_KEY || !UNSUB_SECRET) {
  console.error("Missing env (SUPABASE / RESEND_API_KEY / EMAIL_UNSUBSCRIBE_SECRET)");
  process.exit(1);
}

const SEND_KEY = "founder-call-reminder-1";
const CAMPAIGN_NAME = "Founder Call 1 Hour Reminder (AB Test August 10)";
const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com";
const LIONEL_TZ = "America/New_York";
const PACE_MS = 300;

console.log(`>>> MODE: ${EXECUTE ? "EXECUTE (real send)" : TEST_EMAIL ? `TEST render to ${TEST_EMAIL}` : "DRY-RUN"}`);
console.log(`>>> window: calls starting in the next ${WINDOW_MIN} minutes`);

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ESC = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// --- time rendering (mirrors send-call-invites.mjs) --------------------------------

const LOCALE_FOR_ZONE = [
  [/^Europe\/(London|Belfast)$/, "en-GB"],
  [/^Europe\/Dublin$/, "en-IE"],
  [/^Australia\//, "en-AU"],
  [/^Pacific\/(Auckland|Chatham)$/, "en-NZ"],
  [/^Asia\/(Kolkata|Calcutta)$/, "en-IN"],
];
const localeForZone = (zone) => (LOCALE_FOR_ZONE.find(([re]) => re.test(zone)) ?? [null, "en-US"])[1];
function zoneLabel(date, zone) {
  const parts = new Intl.DateTimeFormat(localeForZone(zone), { timeZone: zone, timeZoneName: "short" }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}
function clockOnly(date, zone) {
  const options = { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true };
  return `${new Intl.DateTimeFormat("en-US", options).format(date)} ${zoneLabel(date, zone)}`.trim();
}

/** Short, human "in about an hour" phrasing that stays true if the cron drifts. */
function minutesAway(start, now) {
  const mins = Math.round((start.getTime() - now.getTime()) / 60000);
  if (mins <= 45) return "in about half an hour";
  if (mins <= 75) return "in about an hour";
  if (mins <= 105) return "in about an hour and a half";
  return `in about ${Math.round(mins / 60)} hours`;
}

const UNSUB_FOOTER = `
<div style="margin-top:28px; padding-top:14px; border-top:1px solid #e5e7eb; font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#8a8a8a;">
  <a href="{{unsubscribe_url}}" style="color:#8a8a8a; text-decoration:underline;">Unsubscribe</a>
</div>`;

function plain(lines) {
  const body = lines
    .filter((l) => l !== null && l !== undefined)
    .map((l) => (l === "" ? "<div><br></div>" : `<div>${l}</div>`))
    .join("\n");
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body>
<div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:#222222;">
${body}
</div>
</body></html>`;
}

/**
 * The reminder itself. Deliberately short: they already confirmed and have
 * the details, so this exists to put the call top of mind and to make
 * backing out easy and guilt free.
 */
function buildReminderHtml({ firstName, theirClock, away, method, contactValue, joinUrl }) {
  const how =
    method === "zoom"
      ? `Here is the Zoom link again: <a href="${joinUrl}">${ESC(joinUrl)}</a>`
      : method === "whatsapp"
        ? `I will reach you on WhatsApp at ${ESC(contactValue ?? "the number you gave me")}.`
        : `I will call you at ${ESC(contactValue ?? "the number you gave me")}.`;
  return plain([
    `${ESC(firstName)}, we are on ${ESC(away)}.`,
    "",
    `Your time: <b>${ESC(theirClock)}</b>`,
    "",
    how,
    "",
    "It is only 15 minutes and there is nothing to prepare. I mostly want to hear what made you order and what you are hoping for.",
    "",
    "If something has come up, just reply and we will find another time. No problem at all.",
    "",
    "Talk soon.",
    "",
    "Lionel Yu",
    "Founder, DreamPlay Pianos",
  ]);
}

function rewriteLinksAppend(html, sid, cid) {
  return html.replace(/href=(["'])(https?:\/\/[^"']+)\1/g, (match, quote, url) => {
    if (url.includes("/unsubscribe") || url.includes("/api/email/unsubscribe")) return match;
    // Zoom join links must stay byte-exact: extra params can break the join.
    if (/(^|\.)zoom\.us\//.test(url)) return match;
    let withParams;
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("sid", sid);
      parsed.searchParams.set("cid", cid);
      withParams = parsed.toString();
    } catch {
      const sep = url.includes("?") ? "&" : "?";
      withParams = `${url}${sep}sid=${sid}&cid=${cid}`;
    }
    return `href=${quote}${withParams}${quote}`;
  });
}
const injectPixel = (html, sid, cid) => {
  const px = `<img src="${TRACKING_BASE}/api/email/open?c=${encodeURIComponent(cid)}&s=${encodeURIComponent(sid)}" width="1" height="1" alt="" style="display:none !important;width:1px;height:1px;opacity:0;" />`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${px}</body>`) : html + px;
};

async function sendViaResend({ to, subject, html, qs }) {
  const payload = {
    from: FROM, to: [to], reply_to: REPLY_TO, subject, html,
    headers: {
      "List-Unsubscribe": `<${TRACKING_BASE}/api/email/unsubscribe?${qs}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return (await res.json()).id;
    const body = await res.text();
    console.warn(`  attempt ${attempt} failed for ${to}: ${res.status} ${body.slice(0, 140)}`);
    if (res.status === 429 || res.status >= 500) { await sleep(1000 * attempt * attempt); continue; }
    break;
  }
  return null;
}

// --- pick the calls to remind -------------------------------------------------------

const now = new Date();
const floor = new Date(now.getTime() + FLOOR_MIN * 60000);
const ceiling = new Date(now.getTime() + WINDOW_MIN * 60000);

const calls = await rest(
  `buyer_call_requests?select=*&status=eq.scheduled&scheduled_at=not.is.null` +
  `&scheduled_at=gte.${floor.toISOString()}&scheduled_at=lte.${ceiling.toISOString()}&order=scheduled_at.asc`,
);
console.log(`calls in window: ${calls.length}`);

const due = calls.filter((c) => {
  if (!c.confirmed_at) { console.log(`  SKIP ${c.id}: not confirmed`); return false; }
  if (c.reminder_sent_at) { console.log(`  SKIP ${c.id}: reminder already sent ${c.reminder_sent_at}`); return false; }
  if (c.contact_method === "zoom" && !c.meeting_url) { console.log(`  SKIP ${c.id}: zoom call has no meeting_url yet`); return false; }
  return true;
});
console.log(`due for a reminder: ${due.length}\n`);
if (due.length === 0 && !TEST_EMAIL) { console.log("nothing to do."); process.exit(0); }

// --- child campaign (idempotent via send_key) -----------------------------------------

let child = (await rest(`campaigns?select=*&send_key=eq.${SEND_KEY}&limit=1`))?.[0] ?? null;
if (!child && EXECUTE) {
  [child] = await rest("campaigns", {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify([{
      name: CAMPAIGN_NAME,
      subject_line: "Our call",
      html_content: "<p>per-buyer</p>",
      status: "sending",
      email_type: "automated",
      is_template: false,
      send_key: SEND_KEY,
      sent_from_email: "lionel@email.dreamplaypianos.com",
      category: "founder-call",
      workspace: "dreamplay_support",
    }]),
  });
  console.log("created child campaign", child.id);
} else if (child) {
  console.log("reusing child campaign", child.id);
}
const cid = child?.id ?? "00000000-0000-0000-0000-000000000000";

const suppressed = new Set((await rest("suppressions?select=email&limit=10000")).map((s) => s.email.toLowerCase()));
const alreadySent = child
  ? new Set((await rest(`sent_history?select=subscriber_id&campaign_id=eq.${child.id}&limit=1000`)).map((r) => r.subscriber_id))
  : new Set();

// --- send ------------------------------------------------------------------------------

let sent = 0, skipped = 0, failed = 0;
for (const call of due) {
  const [buyer] = await rest(`buyers?select=id,email,notes&id=eq.${call.buyer_id}&limit=1`);
  if (!buyer) { console.log(`  SKIP ${call.id}: buyer row missing`); skipped++; continue; }
  const email = buyer.email.toLowerCase().trim();
  if (email.endsWith("@no-email.invalid")) { console.log(`  SKIP ${email}: phone-only buyer`); skipped++; continue; }
  if (suppressed.has(email)) { console.log(`  SKIP ${email}: suppressed`); skipped++; continue; }

  const [sub] = await rest(`subscribers?select=id,first_name,status&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!sub) { console.log(`  SKIP ${email}: no subscriber row`); skipped++; continue; }
  if (sub.status !== "active") { console.log(`  SKIP ${email}: status=${sub.status}`); skipped++; continue; }
  if (alreadySent.has(sub.id)) { console.log(`  SKIP ${email}: already in sent_history`); skipped++; continue; }

  const firstName = sub.first_name?.trim() || (buyer.notes ?? "").split(/[|—]/)[0]?.trim().split(/\s+/)[0] || "there";
  const start = new Date(call.scheduled_at);
  const theirZone = call.timezone || LIONEL_TZ;
  const theirClock = clockOnly(start, theirZone);
  const away = minutesAway(start, now);

  const html0 = buildReminderHtml({
    firstName,
    theirClock,
    away,
    method: call.contact_method,
    contactValue: call.contact_value,
    joinUrl: call.meeting_url ?? "",
  });
  const subject = `${firstName}, our call is ${away}`;

  const to = TEST_EMAIL || buyer.email;
  const t = createHmac("sha256", UNSUB_SECRET).update(`${sub.id}:${cid}`).digest("hex").slice(0, 32);
  const qs = `s=${encodeURIComponent(sub.id)}&c=${encodeURIComponent(cid)}&t=${t}`;

  let html = html0.includes("{{unsubscribe_url}}") ? html0 : html0.replace("</body>", `${UNSUB_FOOTER}</body>`);
  html = html.replaceAll("{{unsubscribe_url}}", `${TRACKING_BASE}/unsubscribe?${qs}`);
  html = rewriteLinksAppend(html, sub.id, cid);
  html = injectPixel(html, sub.id, cid);

  if (!EXECUTE && !TEST_EMAIL) {
    console.log(`WOULD SEND ${buyer.email.padEnd(34)} | ${theirClock.padEnd(18)} | ${call.contact_method.padEnd(8)} | subject: ${subject}`);
    sent++;
    continue;
  }

  const resendId = await sendViaResend({ to, subject: TEST_EMAIL ? `[TEST] ${subject}` : subject, html, qs });
  if (!resendId) { failed++; continue; }
  console.log(`SENT ${to} (${resendId}) | ${theirClock}`);

  if (EXECUTE && !TEST_EMAIL) {
    await rest("sent_history?on_conflict=campaign_id,subscriber_id", {
      method: "POST",
      headers: { ...H, Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify([{ campaign_id: cid, subscriber_id: sub.id, resend_email_id: resendId }]),
    });
    await rest(`buyer_call_requests?id=eq.${call.id}`, {
      method: "PATCH",
      body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }),
    });
  }
  sent++;
  await sleep(PACE_MS);
}

console.log(`\nsummary: sent=${sent} skipped=${skipped} failed=${failed}`);
console.log("done.");

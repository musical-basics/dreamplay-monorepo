/**
 * send-call-invites.mjs — "here is your time" emails for booked founder calls.
 *
 * Reads the slots confirmed on /admin/founder-calls, creates a Zoom meeting
 * per call (Server-to-Server OAuth, so each buyer gets their own join URL),
 * and emails each buyer their time rendered in THEIR timezone.
 *
 * Same pipeline guarantees as send-ab-test-august-10.mjs:
 *   - ONE child campaign resolved via campaigns.send_key -> idempotent reruns
 *   - suppression + subscribers.status='active' checks
 *   - sent_history UNIQUE (campaign_id, subscriber_id), checked and inserted
 *   - unsubscribe footer + RFC 8058 one-click headers (HMAC-signed)
 *   - append-mode tracking (sid/cid params + open pixel), never redirects
 *   - 300ms pacing, 3x backoff on 429/5xx
 *
 * Extra guard specific to invites: a row whose invite_sent_at is already set
 * is skipped, so a rerun can never tell a buyer their time twice.
 *
 * Usage:
 *   node send-call-invites.mjs                       dry run (no Zoom, no email)
 *   node send-call-invites.mjs --test <email>        full render to one address
 *   node send-call-invites.mjs --execute             REAL: creates Zoom + sends
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
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

for (const f of [join(repoRoot, ".env.local"), join(repoRoot, "apps/web/.env.local")]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {}
}
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const UNSUB_SECRET = process.env.EMAIL_UNSUBSCRIBE_SECRET;
const ZOOM = {
  accountId: process.env.ZOOM_ACCOUNT_ID,
  clientId: process.env.ZOOM_CLIENT_ID,
  clientSecret: process.env.ZOOM_CLIENT_SECRET,
};
if (!SUPA_URL || !SVC || !RESEND_KEY || !UNSUB_SECRET) {
  console.error("Missing env (SUPABASE / RESEND_API_KEY / EMAIL_UNSUBSCRIBE_SECRET)");
  process.exit(1);
}

const SEND_KEY = "founder-call-invite-1";
const CAMPAIGN_NAME = "Founder Call Invite (AB Test August 10)";
const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com";
const LIONEL_TZ = "America/New_York";
const DURATION_MIN = 15;
const PACE_MS = 300;
/** Lionel talks to these buyers already; never invite them from here. */
const EXCLUDED = new Set(["jaydeireland@gmail.com"]);

console.log(`>>> MODE: ${TEST_EMAIL ? `TEST -> ${TEST_EMAIL}` : EXECUTE ? "EXECUTE (Zoom + real send)" : "DRY-RUN"}`);

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unsubToken = (sid, cid) => createHmac("sha256", UNSUB_SECRET).update(`${sid}:${cid ?? ""}`).digest("hex").slice(0, 32);

const fmt = (date, tz) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(date);

// --- Zoom (S2S OAuth) -------------------------------------------------------------
async function zoomToken() {
  const basic = Buffer.from(`${ZOOM.clientId}:${ZOOM.clientSecret}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM.accountId)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  if (!res.ok) throw new Error(`Zoom token failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}
async function createMeeting(token, { topic, startAt, agenda }) {
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic, type: 2,
      start_time: startAt.toISOString().replace(/\.\d{3}Z$/, "Z"),
      timezone: "UTC", duration: DURATION_MIN, agenda: agenda ?? "",
      settings: { join_before_host: true, waiting_room: false, approval_type: 2 },
    }),
  });
  if (!res.ok) throw new Error(`Zoom create failed: ${res.status} ${await res.text()}`);
  const m = await res.json();
  return { id: String(m.id), joinUrl: m.join_url };
}

// --- email ------------------------------------------------------------------------
const UNSUB_FOOTER = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2418; text-align: center; font-size: 12px; color: #8d846c; font-family: sans-serif;">
  <p style="margin: 0;">No longer want to receive these emails? <a href="{{unsubscribe_url}}" style="color: #8d846c; text-decoration: underline;">Unsubscribe here</a>.</p>
</div>`;

function buildHtml({ firstName, theirTime, myTime, joinUrl, method, contactValue }) {
  const isZoom = method === "zoom";
  const howBlock = isZoom
    ? `<p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">Here is the link for our call. There is nothing to install if you would rather join from your browser.</p>`
    : `<p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">I will ${method === "whatsapp" ? "reach you on WhatsApp" : "call you"} at <strong style="color:#f7f3ea;">${contactValue ?? "the number you gave me"}</strong> at that time. If there is a better number, just reply and let me know.</p>`;
  const button = isZoom
    ? `<tr><td align="center" style="padding:20px 56px 12px 56px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="#d8b25c" style="border-radius:2px;">
            <a href="${joinUrl}" style="display:inline-block; padding:17px 44px; font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#1a1505; text-decoration:none;">Join Our Call</a>
          </td>
        </tr></table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Our call</title>
  <style>
    body, html { margin:0; padding:0; background:#0b0b0b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#f3efe7; }
    table { border-collapse:collapse; }
    .muted { color:#c8bea0; }
    .gold { color:#d8b25c; }
    @media only screen and (max-width:620px) { .pad { padding-left:24px !important; padding-right:24px !important; } }
  </style>
</head>
<body>
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${theirTime}. Looking forward to it.</div>
  <table role="presentation" width="100%" style="background:#0b0b0b;">
    <tr><td align="center">
      <table role="presentation" width="640" style="max-width:640px; background:#111111;">
        <tr><td align="center" style="padding:28px 20px 18px 20px; background:#0b0b0b;" class="gold">D R E A M P L A Y</td></tr>
        <tr><td class="pad" style="padding:36px 56px 8px 56px;">
          <p class="gold" style="margin:0 0 14px 0; font-size:11px; letter-spacing:4px; text-transform:uppercase;">Our call</p>
          <h1 style="margin:0 0 20px 0; font-size:32px; line-height:1.25; font-weight:400; color:#f7f3ea;">${firstName}, does this time work?</h1>
          <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">Thanks for being up for a chat. Going by the days you picked, how about:</p>
          <p style="margin:0 0 16px 0; font-size:20px; line-height:1.5; color:#f7f3ea;"><strong>${theirTime}</strong></p>
          <p class="muted" style="margin:0 0 16px 0; font-size:14px; line-height:1.7;">That is ${myTime} for me, so we should both be awake.</p>
          ${howBlock}
          <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">If that does not suit you, just reply with a better day and I will move it. No trouble at all.</p>
        </td></tr>
        ${button}
        <tr><td class="pad" style="padding:24px 56px 40px 56px;">
          <p class="muted" style="margin:0 0 24px 0; font-size:15px; line-height:1.8;">It is only about 15 minutes and there is nothing to prepare. I just want to hear about you and your playing.</p>
          <p style="margin:0; font-size:16px; line-height:1.8; color:#f7f3ea;">Lionel Yu<br/><span class="muted">Founder, DreamPlay Pianos</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function rewriteLinksAppend(html, sid, cid) {
  return html.replace(/href=(["'])(https?:\/\/[^"']+)\1/g, (match, quote, url) => {
    if (url.includes("/unsubscribe") || url.includes("/api/email/unsubscribe")) return match;
    // Zoom join links must stay byte-exact: extra params can break the join.
    if (url.includes("zoom.us")) return match;
    try {
      const p = new URL(url);
      p.searchParams.set("sid", sid);
      p.searchParams.set("cid", cid);
      return `href=${quote}${p.toString()}${quote}`;
    } catch {
      return match;
    }
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
    console.warn(`  attempt ${attempt}: ${res.status} ${body.slice(0, 160)}`);
    if (res.status === 429 || res.status >= 500) { await sleep(1000 * attempt * attempt); continue; }
    break;
  }
  return null;
}

// --- load booked calls ------------------------------------------------------------
const calls = await rest("buyer_call_requests?select=*&scheduled_at=not.is.null&order=scheduled_at.asc&limit=200");
if (!calls.length) { console.log("No calls have a confirmed time yet. Schedule them at /admin/founder-calls first."); process.exit(0); }

const ids = [...new Set(calls.map((c) => c.buyer_id))];
const buyers = await rest(`buyers?select=id,email,notes&id=in.(${ids.map((i) => `"${i}"`).join(",")})`);
const buyerById = new Map(buyers.map((b) => [b.id, b]));

const pending = calls.filter((c) => {
  const b = buyerById.get(c.buyer_id);
  if (!b || EXCLUDED.has(b.email.toLowerCase())) return false;
  if (c.invite_sent_at) { console.log(`SKIP already invited: ${b.email}`); return false; }
  return true;
});
console.log(`${pending.length} invite(s) to send (of ${calls.length} scheduled)`);

let child = (await rest(`campaigns?select=*&send_key=eq.${SEND_KEY}&limit=1`))?.[0] ?? null;
if (!child && (EXECUTE || TEST_EMAIL)) {
  [child] = await rest("campaigns", {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify([{
      name: CAMPAIGN_NAME, subject_line: "Our call", html_content: "<p>per-buyer</p>",
      status: "sending", email_type: "campaign", is_template: false,
      send_key: SEND_KEY, sent_from_email: "lionel@email.dreamplaypianos.com",
      category: "buyer-research", workspace: "dreamplay_support",
    }]),
  });
  console.log("created child campaign", child.id);
}
const cid = child?.id ?? "(created on execute)";

const suppressed = new Set((await rest("suppressions?select=email&limit=10000")).map((s) => s.email.toLowerCase()));
const token = EXECUTE ? await zoomToken() : null;

let sent = 0, failed = 0;
for (const call of pending) {
  const buyer = buyerById.get(call.buyer_id);
  const email = buyer.email.toLowerCase().trim();
  if (suppressed.has(email)) { console.log(`SUPPRESSED ${email}`); continue; }

  const [sub] = await rest(`subscribers?select=id,first_name,status&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!sub) { console.log(`no subscriber row for ${email}, skipping`); continue; }
  if (sub.status !== "active") { console.log(`SKIP status=${sub.status} ${email}`); continue; }

  const rawNote = (buyer.notes ?? "").split(/[|]/)[0]?.trim() ?? "";
  const noteName = /^csv import/i.test(rawNote) ? "" : rawNote.split(/\s+/)[0] ?? "";
  const firstName = sub.first_name?.trim() || noteName || "there";
  const startAt = new Date(call.scheduled_at);
  const theirTime = fmt(startAt, call.timezone || LIONEL_TZ);
  const myTime = fmt(startAt, LIONEL_TZ);

  if (!EXECUTE && !TEST_EMAIL) {
    console.log(`WOULD INVITE ${email.padEnd(34)} ${call.contact_method.padEnd(9)} ${theirTime}  (me: ${myTime})`);
    sent++;
    continue;
  }

  let joinUrl = call.meeting_url ?? "";
  let meetingId = call.meeting_provider_id ?? null;
  if (EXECUTE && call.contact_method === "zoom" && !joinUrl) {
    const m = await createMeeting(token, {
      topic: `DreamPlay: Lionel and ${firstName}`,
      startAt,
      agenda: "A short chat about your DreamPlay One pre-order.",
    });
    joinUrl = m.joinUrl;
    meetingId = m.id;
    console.log(`  zoom meeting ${m.id} for ${email}`);
  }

  const sid = sub.id;
  const qs = `s=${encodeURIComponent(sid)}&c=${encodeURIComponent(cid)}&t=${unsubToken(sid, cid)}`;
  let html = buildHtml({
    firstName, theirTime, myTime,
    joinUrl: joinUrl || "https://zoom.us",
    method: call.contact_method,
    contactValue: call.contact_value,
  });
  html = html.includes("{{unsubscribe_url}}") ? html : html.replace("</body>", `${UNSUB_FOOTER}</body>`);
  html = html.replaceAll("{{unsubscribe_url}}", `${TRACKING_BASE}/unsubscribe?${qs}`);
  html = rewriteLinksAppend(html, sid, cid);
  html = injectPixel(html, sid, cid);

  const subject = `${firstName}, does this time work?`;
  const to = TEST_EMAIL ?? buyer.email;
  const resendId = await sendViaResend({ to, subject: TEST_EMAIL ? `[TEST] ${subject}` : subject, html, qs });
  if (!resendId) { failed++; continue; }
  console.log(`SENT ${TEST_EMAIL ? "[TEST] " : ""}${to} (${resendId})  ${theirTime}`);

  if (EXECUTE && !TEST_EMAIL) {
    await rest("sent_history?on_conflict=campaign_id,subscriber_id", {
      method: "POST",
      headers: { ...H, Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify([{ campaign_id: cid, subscriber_id: sid, resend_email_id: resendId }]),
    });
    await rest(`buyer_call_requests?id=eq.${call.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        invite_sent_at: new Date().toISOString(),
        meeting_url: joinUrl || null,
        meeting_provider_id: meetingId,
        status: "scheduled",
      }),
    });
  }
  sent++;
  await sleep(PACE_MS);
}

console.log(`\nsummary: ${EXECUTE ? "sent" : "would send"}=${sent} failed=${failed}`);
console.log("done.");

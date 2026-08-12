/**
 * send-call-invites.mjs — the two-step founder call booking emails.
 *
 * STEP 1 (--propose, default): email the buyer the time Lionel picked on
 * /admin/founder-calls, rendered in THEIR timezone, linking to a signed
 * /confirm-call page. No Zoom meeting exists yet and no join URL is in this
 * email.
 *
 * STEP 2 (--send-links): for buyers who confirmed on that page, create the
 * Zoom meeting and email them the join link. Splitting it this way means a
 * meeting is only ever minted for a call somebody actually agreed to, and a
 * forwarded proposal cannot leak a live room.
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
 *   node send-call-invites.mjs                            dry run of step 1
 *   node send-call-invites.mjs --test <email>             step 1 render to one address
 *   node send-call-invites.mjs --execute                  REAL step 1
 *   node send-call-invites.mjs --send-links               dry run of step 2
 *   node send-call-invites.mjs --send-links --test <em>   step 2 render to one address
 *   node send-call-invites.mjs --send-links --execute     REAL step 2 (creates Zoom)
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const EXECUTE = argv.includes("--execute");
const SEND_LINKS = argv.includes("--send-links");
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

const SEND_KEY = SEND_LINKS ? "founder-call-link-1" : "founder-call-invite-1";
const CAMPAIGN_NAME = SEND_LINKS
  ? "Founder Call Zoom Link (AB Test August 10)"
  : "Founder Call Proposed Time (AB Test August 10)";
const APP_BASE = "https://www.dreamplaypianos.com";
const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com";
const LIONEL_TZ = "America/New_York";
const DURATION_MIN = 15;
const PACE_MS = 300;
/** Lionel talks to these buyers already; never invite them from here. */
const EXCLUDED = new Set(["jaydeireland@gmail.com"]);

const STEP = SEND_LINKS ? "STEP 2 (zoom links to confirmed buyers)" : "STEP 1 (propose a time)";
console.log(`>>> ${STEP} | MODE: ${TEST_EMAIL ? `TEST -> ${TEST_EMAIL}` : EXECUTE ? "EXECUTE (real send)" : "DRY-RUN"}`);

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unsubToken = (sid, cid) => createHmac("sha256", UNSUB_SECRET).update(`${sid}:${cid ?? ""}`).digest("hex").slice(0, 32);

/**
 * Signed /confirm-call link. MUST match apps/web/src/lib/call-confirm-token.ts
 * exactly, or the page will reject every link this script sends.
 */
const confirmToken = (requestId) =>
  createHmac("sha256", UNSUB_SECRET).update(`call-confirm:${requestId}`).digest("hex").slice(0, 32);
const confirmPath = (requestId) =>
  `/confirm-call?t=${encodeURIComponent(`${requestId}.${confirmToken(requestId)}`)}`;

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

/** Shared dark/gold shell so both emails look like everything else we send. */
function shell({ preheader, eyebrow, headline, bodyHtml, buttonLabel, buttonUrl, tailHtml }) {
  const button = buttonUrl
    ? `<tr><td align="center" style="padding:20px 56px 12px 56px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="#d8b25c" style="border-radius:2px;">
            <a href="${buttonUrl}" style="display:inline-block; padding:17px 44px; font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#1a1505; text-decoration:none;">${buttonLabel}</a>
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
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" style="background:#0b0b0b;">
    <tr><td align="center">
      <table role="presentation" width="640" style="max-width:640px; background:#111111;">
        <tr><td align="center" style="padding:28px 20px 18px 20px; background:#0b0b0b;" class="gold">D R E A M P L A Y</td></tr>
        <tr><td class="pad" style="padding:36px 56px 8px 56px;">
          <p class="gold" style="margin:0 0 14px 0; font-size:11px; letter-spacing:4px; text-transform:uppercase;">${eyebrow}</p>
          <h1 style="margin:0 0 20px 0; font-size:32px; line-height:1.25; font-weight:400; color:#f7f3ea;">${headline}</h1>
          ${bodyHtml}
        </td></tr>
        ${button}
        <tr><td class="pad" style="padding:24px 56px 40px 56px;">
          ${tailHtml}
          <p style="margin:0; font-size:16px; line-height:1.8; color:#f7f3ea;">Lionel Yu<br/><span class="muted">Founder, DreamPlay Pianos</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const P = (t) => `<p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">${t}</p>`;

/** STEP 1: propose a time. Links to /confirm-call, carries no Zoom URL. */
function buildProposalHtml({ firstName, theirTime, myTime, confirmUrl, method, contactValue }) {
  const how =
    method === "zoom"
      ? P("It is on Zoom, and I will send the link over as soon as you confirm.")
      : P(`I will ${method === "whatsapp" ? "reach you on WhatsApp" : "call you"} at <strong style="color:#f7f3ea;">${contactValue ?? "the number you gave me"}</strong>. If there is a better number, just reply and let me know.`);
  return shell({
    preheader: `${theirTime}. Let me know if that works and I will lock it in.`,
    eyebrow: "Our call",
    headline: `${firstName}, does this time work?`,
    bodyHtml: [
      P("Thanks for being up for a chat. Going by the days you picked, how about:"),
      `<p style="margin:0 0 16px 0; font-size:20px; line-height:1.5; color:#f7f3ea;"><strong>${theirTime}</strong></p>`,
      P(`That is ${myTime} for me, so we should both be awake.`),
      how,
    ].join("\n"),
    buttonLabel: "Yes, That Works",
    buttonUrl: confirmUrl,
    tailHtml: [
      P("If that day is no good, hit the same link and tell me what suits you better. No trouble at all."),
      P("It is only about 15 minutes and there is nothing to prepare. I just want to hear about you and your playing."),
    ].join("\n"),
  });
}

/** STEP 2: they confirmed, so here is the actual join link. */
function buildLinkHtml({ firstName, theirTime, myTime, joinUrl }) {
  return shell({
    preheader: `Your Zoom link for ${theirTime}.`,
    eyebrow: "Our call",
    headline: `${firstName}, we are booked in.`,
    bodyHtml: [
      P("Thanks for confirming. Here are the details:"),
      `<p style="margin:0 0 16px 0; font-size:20px; line-height:1.5; color:#f7f3ea;"><strong>${theirTime}</strong></p>`,
      P(`That is ${myTime} my time.`),
      P("There is nothing to install if you would rather join from your browser."),
    ].join("\n"),
    buttonLabel: "Join Our Call",
    buttonUrl: joinUrl,
    tailHtml: [
      P(`If the button does not work, this is the link: <a href="${joinUrl}" style="color:#d8b25c;">${joinUrl}</a>`),
      P("If something comes up, just reply to this email and we will move it."),
    ].join("\n"),
  });
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
if (!calls.length) { console.log("No calls have a time yet. Pick one at /admin/founder-calls first."); process.exit(0); }

const ids = [...new Set(calls.map((c) => c.buyer_id))];
const buyers = await rest(`buyers?select=id,email,notes&id=in.(${ids.map((i) => `"${i}"`).join(",")})`);
const buyerById = new Map(buyers.map((b) => [b.id, b]));

/**
 * Step 1 wants rows nobody has been told about yet. Step 2 wants rows the
 * buyer confirmed but who have not received their link. Both skip anyone
 * Lionel handles personally.
 */
const pending = calls.filter((c) => {
  const b = buyerById.get(c.buyer_id);
  if (!b || EXCLUDED.has(b.email.toLowerCase())) return false;
  if (SEND_LINKS) {
    if (!c.confirmed_at) return false;
    if (c.link_sent_at) { console.log(`SKIP link already sent: ${b.email}`); return false; }
    if (c.contact_method !== "zoom") { console.log(`SKIP not a zoom call: ${b.email}`); return false; }
    return true;
  }
  if (c.invite_sent_at) { console.log(`SKIP already proposed: ${b.email}`); return false; }
  return true;
});
console.log(`${pending.length} email(s) to send (of ${calls.length} scheduled)`);
if (!pending.length) { console.log("nothing to do."); process.exit(0); }

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
// Only step 2 ever talks to Zoom, and only for a real send.
const zoomAuth = SEND_LINKS && EXECUTE ? await zoomToken() : null;

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
    console.log(`WOULD ${SEND_LINKS ? "SEND LINK" : "PROPOSE"} ${email.padEnd(34)} ${call.contact_method.padEnd(9)} ${theirTime}  (me: ${myTime})`);
    sent++;
    continue;
  }

  const sid = sub.id;
  const qs = `s=${encodeURIComponent(sid)}&c=${encodeURIComponent(cid)}&t=${unsubToken(sid, cid)}`;

  let html, subject, joinUrl = call.meeting_url ?? "", meetingId = call.meeting_provider_id ?? null;

  if (SEND_LINKS) {
    // Create the meeting only now, once they have actually said yes.
    if (EXECUTE && !joinUrl) {
      const m = await createMeeting(zoomAuth, {
        topic: `DreamPlay: Lionel and ${firstName}`,
        startAt,
        agenda: "A short chat about your DreamPlay One pre-order.",
      });
      joinUrl = m.joinUrl;
      meetingId = m.id;
      console.log(`  zoom meeting ${m.id} for ${email}`);
    }
    html = buildLinkHtml({ firstName, theirTime, myTime, joinUrl: joinUrl || "https://zoom.us/j/preview" });
    subject = `${firstName}, here is the link for our call`;
  } else {
    const confirmUrl = `${APP_BASE}${confirmPath(call.id)}`;
    html = buildProposalHtml({
      firstName, theirTime, myTime, confirmUrl,
      method: call.contact_method, contactValue: call.contact_value,
    });
    subject = `${firstName}, does this time work?`;
  }

  html = html.includes("{{unsubscribe_url}}") ? html : html.replace("</body>", `${UNSUB_FOOTER}</body>`);
  html = html.replaceAll("{{unsubscribe_url}}", `${TRACKING_BASE}/unsubscribe?${qs}`);
  html = rewriteLinksAppend(html, sid, cid);
  html = injectPixel(html, sid, cid);

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
    const patch = SEND_LINKS
      ? { link_sent_at: new Date().toISOString(), meeting_url: joinUrl || null, meeting_provider_id: meetingId }
      : { invite_sent_at: new Date().toISOString() };
    await rest(`buyer_call_requests?id=eq.${call.id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }
  sent++;
  await sleep(PACE_MS);
}

console.log(`\nsummary: ${EXECUTE ? "sent" : "would send"}=${sent} failed=${failed}`);
console.log("done.");

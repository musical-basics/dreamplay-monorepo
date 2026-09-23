/**
 * send-test-copy.mjs: send ONE campaign draft, as a [TEST] copy, to ONE address.
 *
 * The house rule for every DreamPlay email is test-first: a [TEST] copy to
 * musicalbasics@gmail.com and Lionel's approval before any real send. The
 * existing senders (send-love-vs-spec.mjs, send-july-buyer-update.mjs) each
 * carry their own --test mode tied to their own send keys; this one is
 * generic so a new draft can be proofed on a phone the moment it is seeded.
 *
 * It reproduces the real pipeline for the rendered copy: {{first_name}}
 * merge, unsubscribe footer + RFC 8058 one-click headers (HMAC token),
 * append-mode tracking (sid/cid URL params) and the open pixel. It never
 * reads an audience, never writes sent_history, and refuses to send to an
 * address that is not an active, unsuppressed subscriber row.
 *
 * NOTE: tracking uses the draft's own campaign id as cid, so opening the test
 * copy registers an open against that draft. That is a handful of events
 * from Lionel's own inbox; real sends mint a child campaign (send_key:send)
 * and are counted separately.
 *
 * Usage:
 *   node scripts/email/send-test-copy.mjs --key skeptic-2026-01 --to musicalbasics@gmail.com
 *   node scripts/email/send-test-copy.mjs --prefix skeptic-2026- --to musicalbasics@gmail.com
 *   ... [--first-name Lionel]   (default "Lionel": the test row's first_name is "New Sub")
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (flag) => { const i = argv.indexOf(flag); return i === -1 ? null : argv[i + 1]; };
const KEYS = argv.flatMap((a, i) => (a === "--key" ? [argv[i + 1]] : []));
const PREFIX = opt("--prefix");
const TO = opt("--to");
const FIRST_NAME = opt("--first-name") ?? "Lionel";
if ((!KEYS.length && !PREFIX) || !TO) {
  console.error("Usage: --key <send_key> [--key ...] | --prefix <send_key prefix>   --to <email>   [--first-name <name>]");
  process.exit(1);
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(repoRoot, ".env.local"), join(repoRoot, "apps/web/.env.local")]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
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

const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com";
const PACE_MS = 300;

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unsubToken = (sid, cid) => createHmac("sha256", UNSUB_SECRET).update(`${sid}:${cid ?? ""}`).digest("hex").slice(0, 32);

const UNSUB_FOOTER = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2418; text-align: center; font-size: 12px; color: #8d846c; font-family: sans-serif;">
  <p style="margin: 0;">
    No longer want to receive these emails?
    <a href="{{unsubscribe_url}}" style="color: #8d846c; text-decoration: underline;">Unsubscribe here</a>.
  </p>
</div>
`;
function rewriteLinksAppend(html, sid, cid) {
  return html.replace(/href=(["'])(https?:\/\/[^"']+)\1/g, (match, quote, url) => {
    if (url.includes("/unsubscribe") || url.includes("/api/email/unsubscribe")) return match;
    let withParams;
    try { const u = new URL(url); u.searchParams.set("sid", sid); u.searchParams.set("cid", cid); withParams = u.toString(); }
    catch { withParams = `${url}${url.includes("?") ? "&" : "?"}sid=${sid}&cid=${cid}`; }
    return `href=${quote}${withParams}${quote}`;
  });
}
function injectPixel(html, sid, cid) {
  const pixel = `<img src="${TRACKING_BASE}/api/email/open?c=${encodeURIComponent(cid)}&s=${encodeURIComponent(sid)}" width="1" height="1" alt="" style="display:none !important;width:1px;height:1px;opacity:0;" />`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${pixel}</body>`) : html + pixel;
}
function render({ template, firstName, sid, cid }) {
  const qs = `s=${encodeURIComponent(sid)}&c=${encodeURIComponent(cid)}&t=${unsubToken(sid, cid)}`;
  let html = template.html_content;
  if (!html.includes("{{unsubscribe_url}}")) {
    html = html.includes("</body>") ? html.replace("</body>", `${UNSUB_FOOTER}</body>`) : html + UNSUB_FOOTER;
  }
  html = html.replaceAll("{{first_name}}", firstName).replaceAll("{{unsubscribe_url}}", `${TRACKING_BASE}/unsubscribe?${qs}`);
  html = rewriteLinksAppend(html, sid, cid);
  html = injectPixel(html, sid, cid);
  return { html, subject: template.subject_line.replaceAll("{{first_name}}", firstName), qs };
}
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
    console.warn(`  attempt ${attempt} failed: ${res.status} ${body.slice(0, 160)}`);
    if (res.status === 429 || res.status >= 500) { await sleep(1000 * attempt * attempt); continue; }
    break;
  }
  return null;
}

// --- the one recipient: must be an active, unsuppressed subscriber ----------------
const email = TO.toLowerCase().trim();
const suppressed = await rest(`suppressions?select=email&email=eq.${encodeURIComponent(email)}&limit=1`);
if (suppressed.length) { console.error(`${email} is SUPPRESSED, refusing to send.`); process.exit(1); }
const [sub] = await rest(`subscribers?select=id,status&email=eq.${encodeURIComponent(email)}&limit=1`);
if (!sub) { console.error(`No subscriber row for ${email}, refusing to send.`); process.exit(1); }
if (sub.status !== "active") { console.error(`${email} status=${sub.status}, refusing to send.`); process.exit(1); }

// --- the drafts -------------------------------------------------------------------
const filter = KEYS.length
  ? `send_key=in.(${KEYS.map(encodeURIComponent).join(",")})`
  : `send_key=like.${encodeURIComponent(PREFIX)}*`;
const drafts = await rest(`campaigns?${filter}&select=id,name,send_key,subject_line,html_content,status&order=send_key.asc&limit=50`);
if (!drafts.length) { console.error("No campaigns matched."); process.exit(1); }
console.log(`sending ${drafts.length} [TEST] cop${drafts.length === 1 ? "y" : "ies"} to ${email} as "${FIRST_NAME}"`);

let failed = 0;
for (const d of drafts) {
  const { html, subject, qs } = render({ template: d, firstName: FIRST_NAME, sid: sub.id, cid: d.id });
  const id = await sendViaResend({ to: email, subject: `[TEST] ${subject}`, html, qs });
  if (!id) { console.error(`  FAILED ${d.send_key}`); failed++; continue; }
  console.log(`  sent ${d.send_key}  "[TEST] ${subject}"  (${id})`);
  await sleep(PACE_MS);
}
console.log(`\ndone: ${drafts.length - failed} sent, ${failed} failed. No sent_history written; nothing scheduled.`);
process.exit(failed ? 1 : 0);

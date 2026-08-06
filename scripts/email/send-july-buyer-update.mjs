/**
 * send-july-buyer-update.mjs — the July 2026 buyer update send.
 *
 * Deliberately NOT sendCampaign(): this send is personalized per BUYER
 * (product, configuration, price paid, est ship date, signed preferences
 * link), which the standard subscriber-field renderer cannot produce. The
 * script reproduces the pipeline's guarantees piece by piece:
 *
 *   - ONE child campaign resolved via campaigns.send_key (idempotent reruns)
 *   - audience: buyers kind='buyer' with a real email (no-email .invalid
 *     placeholders excluded — phone outreach instead)
 *   - suppressions table + subscribers.status must be 'active'
 *   - sent_history UNIQUE (campaign_id, subscriber_id): checked before AND
 *     inserted after each send — reruns never double-send
 *   - unsubscribe footer + RFC 8058 one-click headers (HMAC-signed)
 *   - append-mode click tracking (sid/cid URL params, NO redirects) + open
 *     pixel, tracking host aligned with the From domain
 *   - 300ms pacing (under the 5/s Resend cap), 3x backoff on 429/5xx
 *
 * Usage:  node send-july-buyer-update.mjs [--execute]
 * Env is read from root .env.local and apps/web/.env.local automatically.
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXECUTE = process.argv.includes("--execute");
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// --- env (root + apps/web, first value wins) -----------------------------------
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
if (!SUPA_URL || !SVC || !RESEND_KEY || !UNSUB_SECRET) {
  console.error("Missing env (SUPABASE / RESEND_API_KEY / EMAIL_UNSUBSCRIBE_SECRET)");
  process.exit(1);
}

const TEMPLATE_NAME = "Customer Update - July 2026 First Prototype";
const SEND_KEY = "july-2026-buyer-update-1";
const SUBJECT = "Your DreamPlay One: a July progress update";
const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com"; // aligned with From domain
const APP_BASE = "https://www.dreamplaypianos.com";
const PACE_MS = 300;

console.log(`>>> MODE: ${EXECUTE ? "EXECUTE (real send)" : "DRY-RUN (pass --execute to send)"}`);

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- rendering helpers (formats mirror packages/email) ---------------------------
const NOT_ON_FILE = "Not on file";
function fmtPrice(p) {
  if (p == null) return NOT_ON_FILE;
  const whole = Number.isInteger(p);
  return `$${p.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
}
function fmtShip(iso) {
  if (!iso) return "To be confirmed";
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
const prefToken = (id) => createHmac("sha256", UNSUB_SECRET).update(`buyer-pref:${id}`).digest("hex").slice(0, 32);
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
function injectPixel(html, sid, cid) {
  const pixel = `<img src="${TRACKING_BASE}/api/email/open?c=${encodeURIComponent(cid)}&s=${encodeURIComponent(sid)}" width="1" height="1" alt="" style="display:none !important;width:1px;height:1px;opacity:0;" />`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${pixel}</body>`) : html + pixel;
}

// --- load template + resolve child campaign (send_key idempotency) ---------------
const [template] = await rest(`campaigns?select=*&name=eq.${encodeURIComponent(TEMPLATE_NAME)}&is_template=eq.true&limit=1`);
if (!template?.html_content) { console.error("Template not found"); process.exit(1); }

let child = (await rest(`campaigns?select=*&send_key=eq.${SEND_KEY}&limit=1`))?.[0] ?? null;
if (!child && EXECUTE) {
  [child] = await rest("campaigns", {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify([{
      name: `${TEMPLATE_NAME} (buyers send)`,
      subject_line: SUBJECT,
      html_content: template.html_content,
      status: "sending",
      email_type: "campaign",
      is_template: false,
      parent_template_id: template.id,
      send_key: SEND_KEY,
      sent_from_email: "lionel@email.dreamplaypianos.com",
      category: "customer-update",
      workspace: "dreamplay_support",
    }]),
  });
  console.log("created child campaign", child.id);
} else if (child) {
  console.log("reusing child campaign", child.id);
}
const cid = child?.id ?? "(child created on execute)";

// --- audience --------------------------------------------------------------------
const buyers = await rest("buyers?select=*&kind=eq.buyer&order=purchase_date.asc&limit=1000");
const audience = buyers.filter((b) => !b.email.endsWith("@no-email.invalid"));
console.log(`audience: ${audience.length} buyers (of ${buyers.length} kind=buyer; no-email rows excluded)`);

const suppressed = new Set((await rest("suppressions?select=email&limit=10000")).map((s) => s.email.toLowerCase()));
const alreadySent = child
  ? new Set((await rest(`sent_history?select=subscriber_id&campaign_id=eq.${child.id}&limit=1000`)).map((r) => r.subscriber_id))
  : new Set();

// --- send loop -------------------------------------------------------------------
let sent = 0, skippedSuppressed = 0, skippedAlready = 0, skippedStatus = 0, failed = 0;
for (const b of audience) {
  const email = b.email.toLowerCase().trim();
  if (suppressed.has(email)) { skippedSuppressed++; console.log(`SUPPRESSED ${email}`); continue; }

  let [sub] = await rest(`subscribers?select=id,first_name,status&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!sub && EXECUTE) {
    const rawNoteName = (b.notes ?? "").split(/[|—]/)[0]?.trim() ?? "";
    const name = /^csv import/i.test(rawNoteName) ? "" : rawNoteName.split(/\s+/)[0] ?? "";
    [sub] = await rest("subscribers", {
      method: "POST",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify([{ email, first_name: name, status: "active", workspace: "dreamplay", tags: ["Purchased"] }]),
    });
    console.log(`created subscriber for ${email}`);
  }
  if (sub && sub.status !== "active") { skippedStatus++; console.log(`SKIP status=${sub.status} ${email}`); continue; }
  if (sub && alreadySent.has(sub.id)) { skippedAlready++; continue; }

  const rawNote = (b.notes ?? "").split(/[|—]/)[0]?.trim() ?? "";
  const noteName = /^csv import/i.test(rawNote) ? "" : rawNote.split(/\s+/)[0] ?? "";
  const firstName = sub?.first_name?.trim() || noteName || "there";
  const values = {
    first_name: firstName,
    product_name: b.product_line || "DreamPlay One",
    size_variant: b.size_variant || NOT_ON_FILE,
    finish: b.finish || NOT_ON_FILE,
    price_paid: fmtPrice(b.price_paid_usd),
    est_ship_date: fmtShip(b.est_ship_date),
    preferences_url: `${APP_BASE}/order-preferences?t=${encodeURIComponent(`${b.id}.${prefToken(b.id)}`)}`,
  };

  if (!EXECUTE) {
    console.log(`WOULD SEND ${email.padEnd(42)} ${firstName.padEnd(12)} ${values.product_name} | ${values.size_variant} · ${values.finish} | ${values.price_paid} | ${values.est_ship_date}`);
    sent++;
    continue;
  }

  const t = unsubToken(sub.id, cid);
  const qs = `s=${encodeURIComponent(sub.id)}&c=${encodeURIComponent(cid)}&t=${t}`;
  values.unsubscribe_url = `${TRACKING_BASE}/unsubscribe?${qs}`;

  let html = template.html_content;
  if (!html.includes("{{unsubscribe_url}}")) html = html.includes("</body>") ? html.replace("</body>", `${UNSUB_FOOTER}</body>`) : html + UNSUB_FOOTER;
  for (const [k, v] of Object.entries(values)) html = html.replaceAll(`{{${k}}}`, v);
  html = rewriteLinksAppend(html, sub.id, cid);
  html = injectPixel(html, sub.id, cid);

  const payload = {
    from: FROM,
    to: [b.email],
    reply_to: REPLY_TO,
    subject: SUBJECT,
    html,
    headers: {
      "List-Unsubscribe": `<${TRACKING_BASE}/api/email/unsubscribe?${qs}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };

  let ok = false, resendId = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { resendId = (await res.json()).id; ok = true; break; }
    const body = await res.text();
    console.warn(`  attempt ${attempt} failed for ${email}: ${res.status} ${body.slice(0, 120)}`);
    if (res.status === 429 || res.status >= 500) { await sleep(1000 * attempt * attempt); continue; }
    break; // 4xx other than 429: don't retry
  }
  if (!ok) { failed++; continue; }

  await rest("sent_history?on_conflict=campaign_id,subscriber_id", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify([{ campaign_id: cid, subscriber_id: sub.id, resend_email_id: resendId }]),
  });
  sent++;
  console.log(`SENT ${sent}: ${email} (${resendId})`);
  await sleep(PACE_MS);
}

console.log(`\nsummary: sent=${sent} failed=${failed} suppressed=${skippedSuppressed} inactive=${skippedStatus} already=${skippedAlready}`);

// --- finalize --------------------------------------------------------------------
if (EXECUTE && child) {
  const shRows = await rest(`sent_history?select=sent_at&campaign_id=eq.${child.id}&order=sent_at.asc&limit=1000`);
  await rest(`campaigns?id=eq.${child.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed", total_recipients: shRows.length }),
  });
  await rest(`buyer_update_emails?update_key=eq.july-2026-prototype-update`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "sent",
      campaign_ids: [template.id, child.id],
      subject_lines: [SUBJECT],
      sent_first_at: shRows[0]?.sent_at ?? null,
      sent_last_at: shRows[shRows.length - 1]?.sent_at ?? null,
      recipient_count: shRows.length,
    }),
  });
  console.log(`finalized: campaign completed, buyer_update_emails updated (${shRows.length} recipients)`);
}
console.log("done.");

/**
 * send-ab-test-august-10.mjs — the AB Test August 10 buyer research send.
 *
 * Four arms of a 2x2 (survey vs founder call) x (store credit vs none):
 *   A1 survey + $5   A2 survey, no offer
 *   B1 call   + $10  B2 call,   no offer
 *
 * Each buyer receives EXACTLY ONE email, the one for their effective arm
 * (manual override from /admin/ab-test-august-10 first, deterministic hash
 * otherwise). Modelled on send-july-buyer-update.mjs and reproducing the
 * same pipeline guarantees:
 *
 *   - ONE child campaign PER ARM, resolved via campaigns.send_key (the keys
 *     in AB_SEND_KEYS, which the results dashboard reads) -> idempotent reruns
 *   - audience: buyers kind='buyer' with a real email (no-email .invalid
 *     placeholders excluded, and kind='test' rows are not buyers)
 *   - suppressions table + subscribers.status must be 'active'
 *   - sent_history UNIQUE (campaign_id, subscriber_id): checked before AND
 *     inserted after each send -> reruns never double-send
 *   - unsubscribe footer + RFC 8058 one-click headers (HMAC-signed)
 *   - append-mode click tracking (sid/cid URL params, NO redirects) + open
 *     pixel, tracking host aligned with the From domain
 *   - 300ms pacing (under the 5/s Resend cap), 3x backoff on 429/5xx
 *
 * Per-buyer merge values: {{first_name}}, {{research_url}} (their arm's page,
 * signed) and {{survey_url}} (the call arms' survey fallback, signed).
 *
 * Usage:
 *   node send-ab-test-august-10.mjs                      dry run, real audience
 *   node send-ab-test-august-10.mjs --execute            THE REAL SEND
 *   node send-ab-test-august-10.mjs --test <email>       send all 4 arms to one
 *                                                        address, prefixed
 *                                                        [TEST A1] etc.
 *
 * --test uses SEPARATE child campaigns (send_key suffixed ':test') so test
 * sends never land in the results dashboard's per-arm counts and never
 * consume a sent_history slot that the real send needs.
 */

import { readFileSync } from "node:fs";
import { createHash, createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const EXECUTE = argv.includes("--execute");
const testIdx = argv.indexOf("--test");
const TEST_EMAIL = testIdx === -1 ? null : argv[testIdx + 1];
if (testIdx !== -1 && !TEST_EMAIL) {
  console.error("--test requires an email address");
  process.exit(1);
}
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// --- env (root + apps/web, first value wins) -----------------------------------
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

// Mirrors apps/web/src/lib/buyer-research.ts. Keep in sync.
const ARMS = ["A1", "A2", "B1", "B2"];
const AB_TEST_KEY = "ab-test-august-10";
const TEMPLATE_NAMES = {
  A1: "Buyer Research Survey Credit (A1)",
  A2: "Buyer Research Survey NoCredit (A2)",
  B1: "Buyer Research Call Credit (B1)",
  B2: "Buyer Research Call NoCredit (B2)",
};
const SEND_KEYS = {
  A1: `${AB_TEST_KEY}-a1`,
  A2: `${AB_TEST_KEY}-a2`,
  B1: `${AB_TEST_KEY}-b1`,
  B2: `${AB_TEST_KEY}-b2`,
};
const ARM_OVERRIDES_SETTING = `${AB_TEST_KEY}:arm-overrides`;

const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com"; // aligned with From domain
const APP_BASE = "https://www.dreamplaypianos.com";
const PACE_MS = 300;

const MODE = TEST_EMAIL ? `TEST -> ${TEST_EMAIL}` : EXECUTE ? "EXECUTE (real send)" : "DRY-RUN (pass --execute to send)";
console.log(`>>> MODE: ${MODE}`);

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- arm assignment (mirrors buyer-research.ts exactly) ---------------------------
function researchArm(buyerId) {
  const h = createHash("sha256").update(`buyer-research-4arm-v55:${buyerId}`).digest();
  return ARMS[h[0] % 4];
}
const researchToken = (id) =>
  createHmac("sha256", UNSUB_SECRET).update(`buyer-research-link:${id}`).digest("hex").slice(0, 32);
const unsubToken = (sid, cid) => createHmac("sha256", UNSUB_SECRET).update(`${sid}:${cid ?? ""}`).digest("hex").slice(0, 32);

const armMethod = (arm) => (arm.startsWith("A") ? "survey" : "call");
const researchPath = (arm, id) =>
  `${APP_BASE}${armMethod(arm) === "survey" ? "/buyer-survey" : "/founder-call"}?t=${encodeURIComponent(`${id}.${researchToken(id)}`)}`;
const surveyPath = (id) => `${APP_BASE}/buyer-survey?t=${encodeURIComponent(`${id}.${researchToken(id)}`)}`;

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

/** Render one arm's template for one buyer. Shared by test and real sends. */
function render({ template, arm, buyerId, firstName, sid, cid }) {
  const qs = `s=${encodeURIComponent(sid)}&c=${encodeURIComponent(cid)}&t=${unsubToken(sid, cid)}`;
  const values = {
    first_name: firstName,
    research_url: researchPath(arm, buyerId),
    survey_url: surveyPath(buyerId),
    unsubscribe_url: `${TRACKING_BASE}/unsubscribe?${qs}`,
  };
  let html = template.html_content;
  if (!html.includes("{{unsubscribe_url}}")) {
    html = html.includes("</body>") ? html.replace("</body>", `${UNSUB_FOOTER}</body>`) : html + UNSUB_FOOTER;
  }
  for (const [k, v] of Object.entries(values)) html = html.replaceAll(`{{${k}}}`, v);
  html = rewriteLinksAppend(html, sid, cid);
  html = injectPixel(html, sid, cid);
  const subject = template.subject_line.replaceAll("{{first_name}}", firstName);
  return { html, subject, qs };
}

async function sendViaResend({ to, subject, html, qs }) {
  const payload = {
    from: FROM,
    to: [to],
    reply_to: REPLY_TO,
    subject,
    html,
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
    break; // 4xx other than 429: don't retry
  }
  return null;
}

// --- load the four templates ------------------------------------------------------
const templates = {};
for (const arm of ARMS) {
  const [t] = await rest(
    `campaigns?select=*&name=eq.${encodeURIComponent(TEMPLATE_NAMES[arm])}&is_template=eq.true&limit=1`,
  );
  if (!t?.html_content) { console.error(`Template missing for ${arm}: ${TEMPLATE_NAMES[arm]}`); process.exit(1); }
  if (t.html_content.includes("—")) { console.error(`Em dash in ${arm} template, refusing to send.`); process.exit(1); }
  templates[arm] = t;
}
console.log(`loaded 4 templates`);

/** Resolve (or create) the child campaign for an arm. `suffix` isolates test sends. */
async function childFor(arm, suffix = "") {
  const key = `${SEND_KEYS[arm]}${suffix}`;
  let [child] = await rest(`campaigns?select=*&send_key=eq.${encodeURIComponent(key)}&limit=1`);
  if (child) return child;
  [child] = await rest("campaigns", {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify([{
      name: `${TEMPLATE_NAMES[arm]}${suffix ? " (test)" : " (buyers send)"}`,
      subject_line: templates[arm].subject_line,
      html_content: templates[arm].html_content,
      status: "sending",
      email_type: "campaign",
      is_template: false,
      parent_template_id: templates[arm].id,
      send_key: key,
      sent_from_email: "lionel@email.dreamplaypianos.com",
      category: "buyer-research",
      workspace: "dreamplay_support",
    }]),
  });
  console.log(`created child campaign for ${arm}${suffix}: ${child.id}`);
  return child;
}

// =================================================================================
// TEST MODE: one of each arm to a single address, real pipeline, isolated send keys
// =================================================================================
if (TEST_EMAIL) {
  const email = TEST_EMAIL.toLowerCase().trim();
  const suppressed = new Set((await rest("suppressions?select=email&limit=10000")).map((s) => s.email.toLowerCase()));
  if (suppressed.has(email)) { console.error(`${email} is SUPPRESSED, refusing to send.`); process.exit(1); }

  let [sub] = await rest(`subscribers?select=id,first_name,status&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!sub) { console.error(`No subscriber row for ${email}.`); process.exit(1); }
  if (sub.status !== "active") { console.error(`${email} status=${sub.status}, refusing to send.`); process.exit(1); }

  // A real buyer id is needed so the signed research links actually resolve.
  const [testBuyer] = await rest(`buyers?select=id,email&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!testBuyer) { console.error(`No buyers row for ${email}; needed for signed links.`); process.exit(1); }

  const firstName = sub.first_name?.trim() || "Lionel";
  for (const arm of ARMS) {
    const child = await childFor(arm, ":test");
    const { html, subject, qs } = render({
      template: templates[arm], arm, buyerId: testBuyer.id, firstName, sid: sub.id, cid: child.id,
    });
    const id = await sendViaResend({ to: TEST_EMAIL, subject: `[TEST ${arm}] ${subject}`, html, qs });
    if (!id) { console.error(`${arm} FAILED`); continue; }
    console.log(`SENT [TEST ${arm}] -> ${TEST_EMAIL} (${id})`);
    console.log(`   subject: [TEST ${arm}] ${subject}`);
    console.log(`   cta:     ${researchPath(arm, testBuyer.id)}`);
    await sleep(PACE_MS);
  }
  console.log("\ndone (test). Real per-arm send keys untouched, dashboard counts unaffected.");
  process.exit(0);
}

// =================================================================================
// REAL SEND: every buyer gets exactly one email, the one for their arm
// =================================================================================
const overrideRow = await rest(`app_settings?select=value&key=eq.${encodeURIComponent(ARM_OVERRIDES_SETTING)}&limit=1`);
const overrides = overrideRow?.[0]?.value ?? {};
const resolveArm = (id) => (ARMS.includes(overrides[id]) ? overrides[id] : researchArm(id));

const buyers = await rest("buyers?select=*&kind=eq.buyer&order=purchase_date.asc&limit=1000");
const audience = buyers.filter((b) => !b.email.endsWith("@no-email.invalid"));
const tally = { A1: 0, A2: 0, B1: 0, B2: 0 };
for (const b of audience) tally[resolveArm(b.id)]++;
console.log(`audience: ${audience.length} buyers (of ${buyers.length} kind=buyer; no-email rows excluded)`);
console.log(`split: ${ARMS.map((a) => `${a} ${tally[a]}`).join(" · ")} (${Object.keys(overrides).length} manual overrides)`);

const children = {};
if (EXECUTE) for (const arm of ARMS) children[arm] = await childFor(arm);

const suppressed = new Set((await rest("suppressions?select=email&limit=10000")).map((s) => s.email.toLowerCase()));
const alreadySent = {};
for (const arm of ARMS) {
  alreadySent[arm] = children[arm]
    ? new Set((await rest(`sent_history?select=subscriber_id&campaign_id=eq.${children[arm].id}&limit=1000`)).map((r) => r.subscriber_id))
    : new Set();
}

let sent = 0, skippedSuppressed = 0, skippedAlready = 0, skippedStatus = 0, failed = 0;
for (const b of audience) {
  const arm = resolveArm(b.id);
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
  if (sub && alreadySent[arm].has(sub.id)) { skippedAlready++; continue; }

  const rawNote = (b.notes ?? "").split(/[|—]/)[0]?.trim() ?? "";
  const noteName = /^csv import/i.test(rawNote) ? "" : rawNote.split(/\s+/)[0] ?? "";
  const firstName = sub?.first_name?.trim() || noteName || "there";

  if (!EXECUTE) {
    console.log(`WOULD SEND ${arm}  ${email.padEnd(42)} ${firstName}`);
    sent++;
    continue;
  }

  const cid = children[arm].id;
  const { html, subject, qs } = render({ template: templates[arm], arm, buyerId: b.id, firstName, sid: sub.id, cid });
  const resendId = await sendViaResend({ to: b.email, subject, html, qs });
  if (!resendId) { failed++; continue; }

  await rest("sent_history?on_conflict=campaign_id,subscriber_id", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify([{ campaign_id: cid, subscriber_id: sub.id, resend_email_id: resendId }]),
  });
  sent++;
  console.log(`SENT ${sent}: ${arm} ${email} (${resendId})`);
  await sleep(PACE_MS);
}

console.log(`\nsummary: sent=${sent} failed=${failed} suppressed=${skippedSuppressed} inactive=${skippedStatus} already=${skippedAlready}`);

if (EXECUTE) {
  for (const arm of ARMS) {
    const rows = await rest(`sent_history?select=sent_at&campaign_id=eq.${children[arm].id}&limit=1000`);
    await rest(`campaigns?id=eq.${children[arm].id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed", total_recipients: rows.length }),
    });
    console.log(`finalized ${arm}: ${rows.length} recipients`);
  }
}
console.log("done.");

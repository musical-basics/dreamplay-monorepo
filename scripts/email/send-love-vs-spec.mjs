/**
 * send-love-vs-spec.mjs, the sender for the Love-vs-Spec 2x2 email test.
 *
 * Test doc: docs/plan/AB-TEST-LOVE-VS-SPEC.md. Four arms keyed by SITE
 * variant, one per cell of the 2x2:
 *
 *   6a SPEC message, standard offer      6b SPEC message, $249 deposit
 *   7a LOVE message, standard offer      7b LOVE message, $249 deposit
 *
 * Audience: the marketing-calendar subscriber snapshot in app_settings
 * (key "marketing-calendar:audience", value.subscriberIds minus
 * value.removedIds), resolved to subscriber rows; only status=active sends.
 * Each subscriber receives EXACTLY ONE email per slot, the one for their
 * effective arm (manual override from app_settings "love-vs-spec:arm-overrides"
 * first, deterministic hash otherwise). Modelled on send-ab-test-august-10.mjs
 * and reproducing the same pipeline guarantees:
 *
 *   - ONE child campaign PER ARM PER SLOT, resolved via campaigns.send_key
 *     ("<templateKey>:send") with parent_template_id set to the slot template
 *     so campaign stats roll the child up into its template -> idempotent reruns
 *   - suppressions table + subscribers.status must be 'active'
 *   - sent_history UNIQUE (campaign_id, subscriber_id): checked before AND
 *     inserted after each send -> reruns never double-send
 *   - unsubscribe footer + RFC 8058 one-click headers (HMAC-signed)
 *   - append-mode click tracking (sid/cid URL params, NO redirects) + open
 *     pixel, tracking host aligned with the From domain
 *   - 300ms pacing (under the 5/s Resend cap), 3x backoff on 429/5xx
 *   - em-dash guard: refuses to send any template containing an em dash
 *
 * Usage:
 *   node send-love-vs-spec.mjs --pick-salt           read-only: evaluate salts
 *                                                    for the most even 4-way
 *                                                    split of today's audience
 *   node send-love-vs-spec.mjs --slot 3              dry run slot 3, all 4 arms
 *   node send-love-vs-spec.mjs --slot 3 --execute    THE REAL SEND (slot 3)
 *   node send-love-vs-spec.mjs --slot 3 --test <email>
 *                                                    send all 4 arm versions of
 *                                                    slot 3 to one address,
 *                                                    prefixed [TEST 6a] etc.
 *
 * --test uses SEPARATE child campaigns (send_key suffixed ':test') so test
 * sends never land in the dashboard's per-arm counts and never consume a
 * sent_history slot that the real send needs.
 */

import { readFileSync } from "node:fs";
import { createHash, createHmac } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const PICK_SALT = argv.includes("--pick-salt");
const EXECUTE = argv.includes("--execute");
const testIdx = argv.indexOf("--test");
const TEST_EMAIL = testIdx === -1 ? null : argv[testIdx + 1];
if (testIdx !== -1 && !TEST_EMAIL) {
  console.error("--test requires an email address");
  process.exit(1);
}
const slotIdx = argv.indexOf("--slot");
const SLOT = slotIdx === -1 ? null : Number(argv[slotIdx + 1]);
if (!PICK_SALT && (!Number.isInteger(SLOT) || SLOT < 1 || SLOT > 8)) {
  console.error("Usage: --pick-salt | --slot <1..8> [--execute | --test <email>]");
  process.exit(1);
}
if (PICK_SALT && (EXECUTE || TEST_EMAIL)) {
  console.error("--pick-salt is read-only; do not combine with --execute/--test");
  process.exit(1);
}
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// --- env (root + apps/web, first value wins) -----------------------------------
for (const f of [join(repoRoot, ".env.local"), join(repoRoot, "apps/web/.env.local")]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      // Values may be quoted in .env.local; strip a single matching pair.
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
if (!SUPA_URL || !SVC || (!PICK_SALT && (!RESEND_KEY || !UNSUB_SECRET))) {
  console.error("Missing env (SUPABASE / RESEND_API_KEY / EMAIL_UNSUBSCRIBE_SECRET)");
  process.exit(1);
}

// --- test constants ---------------------------------------------------------------
const ARMS = ["6a", "6b", "7a", "7b"];
const armMsg = (arm) => (arm.startsWith("6") ? "spec" : "love");
const pad2 = (n) => String(n).padStart(2, "0");
const templateKey = (arm, slot) => `mc-${armMsg(arm)}-${arm}-${pad2(slot)}`;
const CATEGORY = "marketing-calendar";
const AUDIENCE_SETTING = "marketing-calendar:audience";
const ARM_OVERRIDES_SETTING = "love-vs-spec:arm-overrides";

/**
 * FROZEN SALT. Chosen pre-send by `--pick-salt` on 2026-08-14 for the most
 * even 4-way split of the marketing-calendar audience snapshot of that date
 * (507 active subscribers, snapshot built 2026-08-12): 6a 126, 6b 126,
 * 7a 127, 7b 128 (spread 2). Per the Aug-10 precedent and
 * AB-TEST-LOVE-VS-SPEC.md section 5, this value must NEVER change after the
 * first real send: changing it would silently reassign subscribers between
 * arms mid-test and corrupt the readout.
 */
const SALT = "love-vs-spec-v173";

const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const REPLY_TO = "support@dreamplaypianos.com";
const TRACKING_BASE = "https://email.dreamplaypianos.com"; // aligned with From domain
const PACE_MS = 300;

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- arm assignment (same construction as buyer-research's resolveArm) ------------
function hashArm(subscriberId, salt = SALT) {
  const h = createHash("sha256").update(`${salt}:${subscriberId}`).digest();
  return ARMS[h[0] % 4];
}
const unsubToken = (sid, cid) => createHmac("sha256", UNSUB_SECRET ?? "").update(`${sid}:${cid ?? ""}`).digest("hex").slice(0, 32);

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

/** Render one arm's slot template for one subscriber. Shared by test and real sends. */
function render({ template, firstName, sid, cid }) {
  const qs = `s=${encodeURIComponent(sid)}&c=${encodeURIComponent(cid)}&t=${unsubToken(sid, cid)}`;
  const values = {
    first_name: firstName,
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

// --- audience: marketing-calendar snapshot -> active subscriber rows --------------
async function loadAudience() {
  const settingRow = await rest(
    `app_settings?select=value&key=eq.${encodeURIComponent(AUDIENCE_SETTING)}&limit=1`,
  );
  const setting = settingRow?.[0]?.value;
  if (!setting || !Array.isArray(setting.subscriberIds)) {
    console.error(`app_settings '${AUDIENCE_SETTING}' missing or malformed; run the snapshot builder first.`);
    process.exit(1);
  }
  const removed = new Set(Array.isArray(setting.removedIds) ? setting.removedIds : []);
  const ids = setting.subscriberIds.filter((id) => typeof id === "string" && !removed.has(id));

  const rows = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    rows.push(
      ...(await rest(
        `subscribers?select=id,email,first_name,status&id=in.(${chunk.join(",")})&limit=${chunk.length}`,
      )),
    );
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.has(id)).length;
  const inactive = rows.filter((r) => r.status !== "active").length;
  const audience = ids.map((id) => byId.get(id)).filter((r) => r && r.status === "active");
  console.log(
    `audience: ${audience.length} active subscribers ` +
      `(snapshot ${setting.subscriberIds.length}, removed ${removed.size}, ` +
      `missing rows ${missing}, non-active ${inactive}; built ${setting.builtAt ?? "?"})`,
  );
  return audience;
}

async function loadOverrides() {
  const row = await rest(
    `app_settings?select=value&key=eq.${encodeURIComponent(ARM_OVERRIDES_SETTING)}&limit=1`,
  );
  return row?.[0]?.value ?? {}; // missing setting = no overrides
}

// =================================================================================
// PICK-SALT MODE (read-only): most even 4-way split over candidate salts
// =================================================================================
if (PICK_SALT) {
  console.log(">>> MODE: PICK-SALT (read-only, nothing sent, nothing written)");
  const audience = await loadAudience();
  if (audience.length === 0) { console.error("empty audience"); process.exit(1); }

  let best = null;
  for (let i = 1; i <= 500; i++) {
    const salt = `love-vs-spec-v${i}`;
    const tally = { "6a": 0, "6b": 0, "7a": 0, "7b": 0 };
    for (const s of audience) tally[hashArm(s.id, salt)]++;
    const counts = ARMS.map((a) => tally[a]);
    const spread = Math.max(...counts) - Math.min(...counts);
    const mean = audience.length / 4;
    const sq = counts.reduce((acc, c) => acc + (c - mean) ** 2, 0);
    if (!best || spread < best.spread || (spread === best.spread && sq < best.sq)) {
      best = { salt, tally, spread, sq };
    }
  }
  console.log(`\nbest salt: ${best.salt}`);
  console.log(`split:     ${ARMS.map((a) => `${a} ${best.tally[a]}`).join(" · ")} (spread ${best.spread})`);
  console.log(`\nFreeze this value as SALT in this file before the first real send.`);
  process.exit(0);
}

// =================================================================================
// SLOT MODES: load the four arm templates for the slot
// =================================================================================
const MODE = TEST_EMAIL ? `TEST -> ${TEST_EMAIL}` : EXECUTE ? "EXECUTE (real send)" : "DRY-RUN (pass --execute to send)";
console.log(`>>> MODE: ${MODE} | slot ${pad2(SLOT)} | salt ${SALT}`);

const templates = {};
for (const arm of ARMS) {
  const key = templateKey(arm, SLOT);
  const [t] = await rest(
    `campaigns?select=*&send_key=eq.${encodeURIComponent(key)}&category=eq.${CATEGORY}&limit=1`,
  );
  if (!t?.html_content) { console.error(`Template missing for ${arm}: ${key}`); process.exit(1); }
  if (t.html_content.includes("—") || t.subject_line.includes("—")) {
    console.error(`Em dash in ${arm} template (${key}), refusing to send.`);
    process.exit(1);
  }
  templates[arm] = t;
  console.log(`  ${arm} ${key}  "${t.subject_line}"  scheduled ${t.scheduled_at ?? "(none)"}`);
}
console.log("loaded 4 slot templates");

if (EXECUTE) {
  for (const arm of ARMS) {
    const at = templates[arm].scheduled_at ? Date.parse(templates[arm].scheduled_at) : NaN;
    const driftH = Number.isNaN(at) ? Infinity : Math.abs(at - Date.now()) / 3600000;
    if (driftH > 24) {
      console.warn("");
      console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.warn(`!!! WARNING: ${templateKey(arm, SLOT)} is scheduled for ${templates[arm].scheduled_at ?? "(none)"}`);
      console.warn(`!!! which is ${Number.isFinite(driftH) ? driftH.toFixed(1) + "h" : "unknowably far"} from now (more than 24h).`);
      console.warn("!!! Are you sending the right slot on the right day?");
      console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.warn("");
    }
  }
}

/** Resolve (or create) the child campaign for an arm's slot. `suffix` isolates test sends. */
async function childFor(arm, suffix) {
  const key = `${templateKey(arm, SLOT)}${suffix}`;
  let [child] = await rest(`campaigns?select=*&send_key=eq.${encodeURIComponent(key)}&limit=1`);
  if (child) return child;
  const t = templates[arm];
  [child] = await rest("campaigns", {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify([{
      name: `${t.name}${suffix === ":test" ? " (test)" : " (send)"}`,
      subject_line: t.subject_line,
      html_content: t.html_content,
      status: "sending",
      email_type: "campaign",
      is_template: false,
      // Stats roll children up into the slot template via parent_template_id.
      parent_template_id: t.id,
      send_key: key,
      sent_from_email: "lionel@email.dreamplaypianos.com",
      category: t.category ?? CATEGORY,
      workspace: t.workspace ?? "dreamplay_marketing",
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

  const [sub] = await rest(`subscribers?select=id,first_name,status&email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!sub) { console.error(`No subscriber row for ${email}.`); process.exit(1); }
  if (sub.status !== "active") { console.error(`${email} status=${sub.status}, refusing to send.`); process.exit(1); }

  const firstName = sub.first_name?.trim() || "Lionel";
  for (const arm of ARMS) {
    const child = await childFor(arm, ":test");
    const { html, subject, qs } = render({ template: templates[arm], firstName, sid: sub.id, cid: child.id });
    const id = await sendViaResend({ to: TEST_EMAIL, subject: `[TEST ${arm}] ${subject}`, html, qs });
    if (!id) { console.error(`${arm} FAILED`); continue; }
    console.log(`SENT [TEST ${arm}] -> ${TEST_EMAIL} (${id})`);
    console.log(`   subject: [TEST ${arm}] ${subject}`);
    await sleep(PACE_MS);
  }
  console.log("\ndone (test). Real per-arm send keys untouched, dashboard counts unaffected.");
  process.exit(0);
}

// =================================================================================
// REAL SEND: every audience subscriber gets exactly one email, their arm's slot
// =================================================================================
const overrides = await loadOverrides();
const resolveArm = (id) => (ARMS.includes(overrides[id]) ? overrides[id] : hashArm(id));

const audience = await loadAudience();
const tally = { "6a": 0, "6b": 0, "7a": 0, "7b": 0 };
for (const s of audience) tally[resolveArm(s.id)]++;
console.log(`split: ${ARMS.map((a) => `${a} ${tally[a]}`).join(" · ")} (${Object.keys(overrides).length} manual overrides)`);

const children = {};
if (EXECUTE) for (const arm of ARMS) children[arm] = await childFor(arm, ":send");

const suppressed = new Set((await rest("suppressions?select=email&limit=10000")).map((s) => s.email.toLowerCase()));
const alreadySent = {};
for (const arm of ARMS) {
  alreadySent[arm] = children[arm]
    ? new Set((await rest(`sent_history?select=subscriber_id&campaign_id=eq.${children[arm].id}&limit=1000`)).map((r) => r.subscriber_id))
    : new Set();
}

let sent = 0, skippedSuppressed = 0, skippedAlready = 0, failed = 0;
for (const s of audience) {
  const arm = resolveArm(s.id);
  const email = s.email.toLowerCase().trim();
  if (suppressed.has(email)) { skippedSuppressed++; console.log(`SUPPRESSED ${email}`); continue; }
  if (alreadySent[arm].has(s.id)) { skippedAlready++; continue; }

  const firstName = s.first_name?.trim() || "there";

  if (!EXECUTE) {
    console.log(`WOULD SEND ${arm}  ${email.padEnd(42)} ${firstName}`);
    sent++;
    continue;
  }

  const cid = children[arm].id;
  const { html, subject, qs } = render({ template: templates[arm], firstName, sid: s.id, cid });
  const resendId = await sendViaResend({ to: s.email, subject, html, qs });
  if (!resendId) { failed++; continue; }

  await rest("sent_history?on_conflict=campaign_id,subscriber_id", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify([{ campaign_id: cid, subscriber_id: s.id, resend_email_id: resendId }]),
  });
  sent++;
  console.log(`SENT ${sent}: ${arm} ${email} (${resendId})`);
  await sleep(PACE_MS);
}

console.log(
  `\nsummary (slot ${pad2(SLOT)}): ${EXECUTE ? "sent" : "would send"}=${sent} failed=${failed} ` +
    `suppressed=${skippedSuppressed} already=${skippedAlready}`,
);
console.log(`per-arm: ${ARMS.map((a) => `${a} ${tally[a]} "${templates[a].subject_line}"`).join("\n         ")}`);

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

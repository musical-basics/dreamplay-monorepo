/**
 * setup-pro-waitlist-email.mjs: seed the automatic Pro waitlist confirmation
 * (decision D21) and its kill switch.
 *
 * Creates, if missing:
 *   - the TEMPLATE campaign (send_key "pro-waitlist-confirmation",
 *     is_template true). The Inngest function pro-waitlist-confirmation clones
 *     it into one child per subscriber (send_key
 *     "pro-waitlist-confirmation:<subscriberId>").
 *   - app_settings["automation:pro-waitlist-confirmation"] = { enabled: false }.
 *     Nothing sends until Lionel approves the [TEST] and it is set to true.
 *
 * Every claim is taken from the live site: the Pro sold-out card ("first in
 * line when Pro production reopens"), /product-information (DS5.5/DS6.0 on
 * both, Dual vs Triple sensor, 18 vs 230 presets, LEDs above vs above and
 * within every key, weighted vs graded hammer action), the $249 One deposit
 * (D18) and "100% money-back guarantee before your order ships". Waitlist
 * signups give no first name, so the copy never uses {{first_name}}.
 *
 * Template is the skeptic-series one (full-width card, class=pad CTA, a
 * second click surface pointing at the same page as the button). The
 * preheader comes from variable_values.preview_text (the pipeline injects it).
 *
 * Idempotent. An existing template is left alone unless --rewrite is passed.
 *
 * Usage:
 *   node scripts/email/setup-pro-waitlist-email.mjs --dry-run [--html-out <dir>]
 *   node scripts/email/setup-pro-waitlist-email.mjs [--rewrite]
 *   node scripts/email/send-test-copy.mjs --key pro-waitlist-confirmation --to musicalbasics@gmail.com
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const REWRITE = argv.includes("--rewrite");
const outIdx = argv.indexOf("--html-out");
const HTML_OUT = outIdx === -1 ? null : argv[outIdx + 1];

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
if (!SUPA_URL || !SVC) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const HEADERS = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function sb(path, init = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: HEADERS, ...init });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Keep in sync with apps/web/src/lib/pro-waitlist-email.ts.
const TEMPLATE_KEY = "pro-waitlist-confirmation";
const SETTING_KEY = "automation:pro-waitlist-confirmation";

const CTA_URL = "https://www.dreamplaypianos.com/customize";
const link = (url, text) => `<a href="${url}" style="color:#d8b25c; text-decoration:underline;">${text}</a>`;

const EMAIL = {
  subject: "You're on the DreamPlay Pro waitlist",
  preheader: "Your place in line is saved. Here is what happens next.",
  eyebrow: "Pro Waitlist",
  headline: "Your place is saved.",
  paragraphs: [
    "Thank you for joining the waitlist for the DreamPlay One Pro. The current Pro production run is fully reserved, so you are now first in line, and we will email you when Pro production reopens.",
    `If you would rather not wait, the DreamPlay One is ${link(CTA_URL, "available to reserve today")}. It is built on the same custom narrow keys, in the same DS5.5 and DS6.0 sizes. The Pro adds graded hammer action, triple-sensor keys, 230 sounds instead of 18, and lights within every key as well as above it.`,
    "Reserving a DreamPlay One takes $249, and it is covered by our 100% money-back guarantee until it ships.",
  ],
  ctaLabel: "Reserve a DreamPlay One",
  closing: ["Questions about the Pro or the One? Just reply to this email."],
};

function emailHtml({ title, eyebrow, headline, paragraphs, ctaLabel, ctaUrl, closing }) {
  const para = (t) => `            <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">${t}</p>`;
  const closePara = (t) => `            <p class="muted" style="margin:0 0 16px 0; font-size:15px; line-height:1.8;">${t}</p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body, html { margin:0; padding:0; background:#0b0b0b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#f3efe7; }
    table { border-collapse:collapse; }
    .muted { color:#c8bea0; }
    .gold { color:#d8b25c; }
    @media only screen and (max-width:620px) {
      .pad { padding-left:24px !important; padding-right:24px !important; }
      .btnwrap { width:100% !important; }
      .btn { display:block !important; padding-left:16px !important; padding-right:16px !important; letter-spacing:1px !important; }
      h1 { font-size:28px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" style="width:100%; background:#0b0b0b;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="width:100%; max-width:640px; background:#111111;">
        <tr>
          <td align="center" style="padding:28px 20px 18px 20px; background:#0b0b0b;" class="gold">D R E A M P L A Y</td>
        </tr>
        <tr>
          <td class="pad" style="padding:36px 56px 8px 56px;">
            <p class="gold" style="margin:0 0 14px 0; font-size:11px; letter-spacing:4px; text-transform:uppercase;">${eyebrow}</p>
            <h1 style="margin:0 0 20px 0; font-size:32px; line-height:1.25; font-weight:400; color:#f7f3ea;">${headline}</h1>
${paragraphs.map(para).join("\n")}
          </td>
        </tr>
        <tr>
          <td align="center" class="pad" style="padding:20px 56px 12px 56px;">
            <table role="presentation" cellpadding="0" cellspacing="0" class="btnwrap"><tr>
              <td align="center" bgcolor="#d8b25c" style="border-radius:2px;">
                <a href="${ctaUrl}" class="btn" style="display:inline-block; padding:17px 44px; font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#1a1505; text-decoration:none;">${ctaLabel}</a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:24px 56px 40px 56px;">
${closing.map(closePara).join("\n")}
            <p style="margin:0; font-size:16px; line-height:1.8; color:#f7f3ea;">Lionel Yu<br/><span class="muted">Founder, DreamPlay Pianos</span></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

function buildRow() {
  const html = emailHtml({ title: EMAIL.subject, ...EMAIL, ctaUrl: CTA_URL });
  const EM_DASH = String.fromCharCode(0x2014);
  if ((html + EMAIL.subject + EMAIL.preheader).includes(EM_DASH)) throw new Error("em dash in the Pro waitlist email");
  const GLYPHS = new RegExp("[" + String.fromCharCode(0x25B6, 0x2192, 0x2190) + "]"); // play triangle, arrows: Gmail renders them as emoji
  if (GLYPHS.test(html)) throw new Error("glyph in the Pro waitlist email");
  if (html.includes("{{first_name}}")) throw new Error("waitlist signups have no first name");
  return {
    name: "Pro Waitlist Confirmation (automatic)",
    subject_line: EMAIL.subject,
    html_content: html,
    category: "automation",
    email_type: "campaign",
    workspace: "dreamplay_marketing",
    status: "draft",
    is_template: true,
    is_ready: false,
    send_key: TEMPLATE_KEY,
    scheduled_at: null,
    scheduled_status: null,
    variable_values: {
      preview_text: EMAIL.preheader,
      topic: "Pro waitlist confirmation (automatic, Inngest pro-waitlist-confirmation)",
      from_name: "Lionel from DreamPlay",
      from_email: "lionel@email.dreamplaypianos.com",
      reply_to: "support@dreamplaypianos.com",
      kill_switch: SETTING_KEY,
    },
  };
}

async function main() {
  const row = buildRow();
  const words = row.html_content.replace(/<style[\s\S]*?<\/style>/, "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (HTML_OUT) {
    mkdirSync(HTML_OUT, { recursive: true });
    writeFileSync(join(HTML_OUT, `${TEMPLATE_KEY}.html`), row.html_content);
  }
  console.log(`${DRY_RUN ? "DRY RUN: " : ""}"${row.subject_line}" (${words} words)`);

  const [current] = await sb(`campaigns?send_key=eq.${TEMPLATE_KEY}&select=id,status,is_template`);
  if (current && !REWRITE) {
    console.log(`  = template exists, left alone: ${current.id} (pass --rewrite to update its copy)`);
  } else if (current) {
    if (!DRY_RUN) {
      const { name, subject_line, html_content, variable_values } = row;
      await sb(`campaigns?id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ name, subject_line, html_content, variable_values, updated_at: new Date().toISOString() }) });
    }
    console.log(`  ~ ${DRY_RUN ? "would rewrite" : "rewritten"}: ${current.id}`);
  } else {
    if (!DRY_RUN) await sb("campaigns", { method: "POST", headers: { ...HEADERS, Prefer: "return=minimal" }, body: JSON.stringify([row]) });
    console.log(`  + ${DRY_RUN ? "would insert" : "inserted"} template ${TEMPLATE_KEY}`);
  }

  const [setting] = await sb(`app_settings?key=eq.${encodeURIComponent(SETTING_KEY)}&select=key,value`);
  if (setting) {
    console.log(`  = kill switch exists: ${JSON.stringify(setting.value)}`);
  } else {
    if (!DRY_RUN) await sb("app_settings", { method: "POST", headers: { ...HEADERS, Prefer: "return=minimal" }, body: JSON.stringify([{ key: SETTING_KEY, value: { enabled: false } }]) });
    console.log(`  + ${DRY_RUN ? "would create" : "created"} kill switch ${SETTING_KEY} = { enabled: false }`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

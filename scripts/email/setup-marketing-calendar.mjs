/**
 * setup-marketing-calendar.mjs — seed the August 2026 marketing calendar.
 *
 * Two jobs, both idempotent:
 *
 * 1. EMAIL DRAFTS: inserts 8 nurture emails plus the coupon-trigger template
 *    as `campaigns` rows (category "marketing-calendar", status "draft",
 *    scheduled_status NULL so the Inngest scheduler ignores them). Tue/Thu/Sun
 *    cadence starting Thu 2026-08-13, default send time 9:00 AM ET.
 *
 *    By default existing rows (matched by send_key) are NEVER overwritten:
 *    Lionel edits live in /admin/marketing-calendar and a routine re-run must
 *    not clobber him. Pass --rewrite to replace the copy from this file, which
 *    is how a reviewed rewrite gets applied. --rewrite only ever touches rows
 *    still in status 'draft'; anything sent is history and is skipped loudly.
 *    Slots no longer present here are retired (status deleted, scheduled_at
 *    cleared, category suffixed '-retired') rather than deleted.
 *
 * 2. AUDIENCE SNAPSHOT: builds the high-intent group and stores it in
 *    app_settings key "marketing-calendar:audience". High intent = active
 *    subscriber with at least one intent tag (DPHI/DPMI, Hand Guide
 *    Download, waitlists, offer leads, VIP...) or checkout-intent analytics
 *    events in the last 120 days; minus Purchased/Test Account tags, every
 *    email in the buyers table, Lionel's test addresses, and everyone in
 *    suppressions. Re-runs preserve Lionel's manual removals (removedIds).
 *
 * Usage:
 *   node setup-marketing-calendar.mjs                 seed drafts + audience
 *   node setup-marketing-calendar.mjs --rewrite       replace draft copy from this file
 *   node setup-marketing-calendar.mjs --audience-only rebuild only the snapshot
 *   node setup-marketing-calendar.mjs --dry-run       report, write nothing
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const AUDIENCE_ONLY = argv.includes("--audience-only");
/** Replace the copy of existing DRAFT rows from this file. Off by default. */
const REWRITE = argv.includes("--rewrite");

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
if (!SUPA_URL || !SVC) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };

async function sb(path, init = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { ...init, headers: { ...HEADERS, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function sbAll(pathWithoutOffset, pageSize = 1000) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await sb(`${pathWithoutOffset}&limit=${pageSize}&offset=${offset}`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Shared constants — mirror apps/web/src/lib/marketing-calendar.ts. Keep in sync.
// ---------------------------------------------------------------------------
const CATEGORY = "marketing-calendar";
const AUDIENCE_SETTING = "marketing-calendar:audience";
const HIGH_INTENT_TAGS = [
  "DPHI",
  "DPMI",
  "Hand Guide Download",
  "Website Waitlist",
  "Waitlist",
  "VIP Account",
  "$300 Off Lead",
  "$100 Credit Lead",
  "Free Shipping Lead",
  "5% Off Survey Lead",
  "Super High Interest",
  "Super High Interest, No Conversion",
  "FOMO TAG MARCH",
];
const EXCLUDE_TAGS = ["Purchased", "Test Account"];
const CHECKOUT_EVENT_NAMES = ["begin_checkout", "checkout_info_entered", "add_to_cart"];
const CHECKOUT_LOOKBACK_DAYS = 120;
// Lionel's test/internal addresses (docs/plan/STATE.md + memory).
const TEST_EMAILS = new Set([
  "lionel@musicalbasics.com",
  "musicalbasics@gmail.com",
  "support@musicalbasics.com",
  "yu_lionel@yahoo.com",
  "yulionel829@gmail.com",
  "hello@5ave.studio",
  "dreamplaypianos@loadaccumulator.co",
]);

// ---------------------------------------------------------------------------
// The 10 emails. Tue/Thu/Sun starting Thu 2026-08-13, 9:00 AM ET (EDT, -04:00).
// Voice: Lionel, first person, short, warm. NO em dashes. Buttons plain text.
// Every link points at dreamplaypianos.com (append-mode tracking rule).
// ---------------------------------------------------------------------------
const SITE = "https://www.dreamplaypianos.com";

/**
 * `codeBox` (optional) renders a gold-bordered discount-code panel between the
 * body copy and the button. {{discount_code}} is a standard merge tag filled
 * from the campaign's variable_values at send time.
 */
function emailHtml({ title, preheader, eyebrow, headline, paragraphs, ctaLabel, ctaUrl, closing, codeBox }) {
  const para = (t) => `            <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">${t}</p>`;
  const closePara = (t) => `            <p class="muted" style="margin:0 0 16px 0; font-size:15px; line-height:1.8;">${t}</p>`;
  const codeBlock = codeBox
    ? `        <tr>
          <td class="pad" style="padding:8px 56px 4px 56px;">
            <table role="presentation" width="100%" style="border:1px solid #d8b25c; background:#161309;"><tr>
              <td align="center" style="padding:22px 16px;">
                <p class="muted" style="margin:0 0 8px 0; font-size:12px; letter-spacing:2px; text-transform:uppercase;">${codeBox.label}</p>
                <p style="margin:0; font-size:30px; letter-spacing:5px; font-weight:bold; color:#d8b25c;">{{discount_code}}</p>
                <p class="muted" style="margin:10px 0 0 0; font-size:13px;">${codeBox.note}</p>
              </td>
            </tr></table>
          </td>
        </tr>
`
    : "";
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
    @media only screen and (max-width:620px) { .pad { padding-left:24px !important; padding-right:24px !important; } }
  </style>
</head>
<body>
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" style="background:#0b0b0b;">
    <tr><td align="center">
      <table role="presentation" width="640" style="max-width:640px; background:#111111;">
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
${codeBlock}        <tr>
          <td align="center" style="padding:20px 56px 12px 56px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td align="center" bgcolor="#d8b25c" style="border-radius:2px;">
                <a href="${ctaUrl}" style="display:inline-block; padding:17px 44px; font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#1a1505; text-decoration:none;">${ctaLabel}</a>
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

/**
 * EIGHT emails, Tue/Thu/Sun starting Thu 2026-08-13, 9:00 AM ET.
 *
 * Rewritten 2026-08-12 after an external copy review. What changed and why:
 *   - Cut from 10 to 8. The relaxation and generic-practice emails existed
 *     because the calendar needed content, not because Lionel had something
 *     to say. Fewer, better.
 *   - Founder story moved from slot 8 to slot 2, so the reader meets the
 *     person before being asked for anything.
 *   - The printable hand guide email is gone: that guide does not exist yet.
 *     Its job (answer "which size fits my hands?") now points at the live
 *     hand span calculator on /how-it-works, which is real today.
 *   - LED learning is rewritten as Lionel admitting he was a skeptic, and
 *     sits next to the specs email.
 *   - Removed throughout: tidy rule-of-three constructions, quotable closing
 *     aphorisms, and "move the needle" style business vocabulary.
 *
 * The test any sentence has to pass: would Lionel spontaneously type this
 * into Gmail if there were no marketing campaign? If not, it is cut.
 */
const EMAILS = [
  {
    slot: 1,
    date: "2026-08-13",
    topic: "Benefits of narrow keys",
    subject: "A ninth should not feel like a stretch",
    preheader: "Why octave chords and tenths are hard on a standard keyboard, and what changes when they are not.",
    eyebrow: "The DreamPlay One",
    headline: "A ninth should not feel like a stretch",
    paragraphs: [
      "Hi {{first_name}}, here is a thing almost nobody says out loud about piano. A standard octave is 6.5 inches wide. If your hand spans 7.5 inches, an octave chord is fine but a ninth is right at your limit, and a tenth is off the table unless you roll it. Broken octaves in the left hand start to ache after a page. None of that is a technique problem.",
      "The DreamPlay One comes in narrower widths, so the same interval takes less reach. On a DS5.5 the octave is 5.54 inches, which is about what a seventh costs you on a standard keyboard. A whole diatonic step of reach, given back on every chord. The notes you have been rolling or leaving out are simply there.",
    ],
    ctaLabel: "See Why Narrow Keys Work",
    ctaUrl: `${SITE}/why-narrow`,
    closing: [
      "If you have spent years assuming you just needed to practice the stretch more, it is worth reading.",
    ],
  },
  {
    slot: 2,
    date: "2026-08-16",
    topic: "Founder story",
    subject: "Why I started building pianos",
    preheader: "I taught piano for years before I ever thought about manufacturing one.",
    eyebrow: "From me",
    headline: "Why I started building pianos",
    paragraphs: [
      "Hi {{first_name}}, if you have followed my channel for a while, you know the piano has been my whole life. What you may not know is how many people wrote to me over the years saying the same thing: I love this instrument, but my hands are too small for it.",
      "At some point I stopped treating that as a sad fact and started treating it as a design problem. DreamPlay is my answer: an instrument company that fits the piano to the player instead of the other way around. We are a small team building something the big manufacturers decided was not worth their time.",
    ],
    ctaLabel: "Read Our Story",
    ctaUrl: `${SITE}/our-story`,
    closing: ["Thank you for being here while we build it. It means more than you know."],
  },
  {
    slot: 3,
    date: "2026-08-18",
    topic: "The research",
    subject: "The research that convinced me",
    preheader: "Hand span data, key width, and the studies I read before building anything.",
    eyebrow: "The research",
    headline: "The research that convinced me",
    paragraphs: [
      "Before I built anything, I spent months reading the research on hand span and key width. One study in Applied Ergonomics measured pianists moving from standard keys to a 5.5 inch octave and found lower muscular effort and less perceived strain. Another found that the internationally acclaimed women pianists tend to be the ones with larger hands, which says something uncomfortable about who the repertoire was written for.",
      "So the strain is not a character flaw and it is not a technique problem. The standard advice for a century has been to practice harder or pick easier repertoire. I have put the studies on one page if you want to see what convinced me.",
    ],
    ctaLabel: "Read the Research",
    ctaUrl: `${SITE}/hidden-barrier`,
    closing: [
      "The short version: the instrument was standardized around one hand size, and it was not the average one.",
    ],
  },
  {
    slot: 4,
    date: "2026-08-20",
    topic: "Which size fits your hands",
    subject: "How to tell which key size fits your hand",
    preheader: "Measure your span, then see which of the three key widths matches it.",
    eyebrow: "Find your size",
    headline: "How to tell which key size fits your hand",
    paragraphs: [
      "I get this question constantly, so I want to answer it properly. Measure your hand span: thumb tip to little finger tip, stretched out flat, in inches. That single number tells you most of what you need to know.",
      "Under 7.6 inches and standard keys are genuinely too wide for you, which is what the DS5.5 is for. Between 7.6 and 8.5 the DS6.0 is the comfortable middle. Above that, your hands fit the historical standard and the DS6.5 gives you conventional width. There is a calculator on our site that walks through it and tells you which intervals open up at each size.",
    ],
    ctaLabel: "Check Your Hand Span",
    ctaUrl: `${SITE}/how-it-works`,
    closing: ["If your number is close to a boundary, reply and tell me what it is. I will give you my honest opinion."],
  },
  {
    slot: 5,
    date: "2026-08-23",
    topic: "Hardware specs",
    subject: "Under the lid: what it is made of",
    preheader: "Weighted hammer action, three key widths, and the full specification.",
    eyebrow: "Under the lid",
    headline: "Under the lid: what it is made of",
    paragraphs: [
      "A piano with narrower keys only matters if it still feels like a real piano. So the action was the part we spent the most time on: fully weighted hammer action, on keybeds we had custom steel tooling made for. Narrow keys are not the hard part. Narrow keys that still feel right under your fingers is the hard part.",
      "The rest of the specification is on one page: dimensions, the key action, connectivity, what comes in each bundle. Worth a look if you want to know what you are actually getting before you commit to anything.",
    ],
    ctaLabel: "See the Full Specs",
    ctaUrl: `${SITE}/product-information`,
    closing: ["If you are the kind of person who reads the spec sheet before the brochure, this page is for you."],
  },
  {
    slot: 6,
    date: "2026-08-25",
    topic: "LED guided learning",
    subject: "I was skeptical about the light-up keys",
    preheader: "Why a piano teacher ended up putting LEDs in his own instrument.",
    eyebrow: "Guided learning",
    headline: "I was skeptical about the light-up keys",
    paragraphs: [
      "I will be honest, light-up keys were not my idea of a serious instrument. I taught piano for years and my instinct was that anything that tells you which note to press is a shortcut around actually learning to read.",
      "What changed my mind was watching beginners quit. Not because piano is too hard, but because week one is spent decoding notation instead of making any music at all. The LEDs get you playing something recognisable on the first evening, and then you use them less and less as reading catches up. I would not have added them if they let you skip learning. They just get you past the part where most people give up.",
    ],
    ctaLabel: "See How Guided Learning Works",
    ctaUrl: `${SITE}/learn`,
    closing: ["Every DreamPlay One has it, and you can leave it switched off forever if you would rather."],
  },
  {
    slot: 7,
    date: "2026-08-27",
    topic: "Production progress",
    subject: "The first prototypes are finally here",
    preheader: "Where production stands, including the parts that have taken longer than I expected.",
    eyebrow: "Behind the scenes",
    headline: "The first prototypes are finally here",
    paragraphs: [
      "For anyone quietly watching and wondering whether this is real: the first DreamPlay One prototypes have come off the line. We started with a factory partnership in June last year, and after fourteen months of drawings, tooling and revisions, sitting down at one and playing it was a strange feeling.",
      "I have put the whole timeline on one page, including the parts that have taken longer than I expected. Custom steel molds, electronics integration, the revisions we did not plan for. If you are considering a reservation, you should be able to see exactly where things stand first.",
    ],
    ctaLabel: "Follow the Production Timeline",
    ctaUrl: `${SITE}/production-timeline`,
    closing: ["Manufacturing is where the schedule slips, so I would rather you hear it from me than wonder."],
  },
  {
    slot: 8,
    date: "2026-08-30",
    topic: "Reserve yours",
    subject: "Ready to pick yours?",
    preheader: "Choose your key size and finish, and reserve with a deposit.",
    eyebrow: "Reserve yours",
    headline: "Ready to pick yours?",
    paragraphs: [
      "Over the last few weeks I have shown you why the keys are narrower, the research behind it, how to work out your size, what the action feels like, and where production actually stands. If it sounds like the instrument you have been waiting for, here is how to get one.",
      "The configurator takes about two minutes: pick your key size, pick your finish, see what it looks like. The keyboard is $999 in total, split as $499 today and $500 when yours is boxed and ready to ship, and reserving now locks in the founder price.",
    ],
    ctaLabel: "Build Your DreamPlay One",
    ctaUrl: `${SITE}/customize`,
    closing: [
      "Still unsure about sizing, shipping, or anything else? Reply to this email. I answer these myself and I would rather talk it through than have you guess.",
    ],
  },
];

/**
 * The behavioral trigger email (NOT on the calendar). Sent automatically to
 * anyone who opened 3+ calendar emails and has not purchased after 3 days.
 * Stored as a TEMPLATE campaign: each send clones a child keyed on
 * send_key marketing-coupon-offer:<subscriberId>, so one person can only ever
 * receive it once. {{discount_code}} is filled from variable_values at send
 * time; the code itself is created by hand in the Shopify admin because this
 * app's API token has no write_discounts scope.
 *
 * ── The copy rule for this email ────────────────────────────────────────────
 * The TRIGGER is behavioral, the EMAIL must not say so. An earlier draft
 * opened with "You have been opening my emails", which reads as surveillance:
 * people know tracking exists but do not want to be told their opens were
 * counted. Reviewed 2026-08-12 and rewritten to read as a spontaneous offer
 * from Lionel with no explanation of why they received it. Do not reintroduce
 * any reference to their engagement, open counts, or "because you...".
 */
const COUPON_EMAIL = {
  name: "Marketing Calendar 2026 - Engaged Non-Buyer $50 Coupon",
  topic: "Engaged non-buyer $50 coupon (automatic trigger)",
  subject: "{{first_name}}, here is $50 off",
  preheader: "In case you have been thinking about a DreamPlay One.",
  eyebrow: "$50 off",
  headline: "{{first_name}}, here is $50 off",
  paragraphs: [
    "I wanted to send you something in case you have been thinking about getting a DreamPlay One.",
    "Here is $50 off. No promotion, no countdown, and it does not expire on you.",
  ],
  codeBox: { label: "Your discount code", note: "Enter it at checkout, or use the button below and it applies itself." },
  ctaLabel: "Use My $50 Off",
  ctaUrl: `${SITE}/customize`,
  closing: [
    "And if the thing holding you back is not the price, reply and tell me what it is. I answer these myself.",
  ],
};

// 9:00 AM ET on these dates is EDT (-04:00) throughout Aug + early Sep 2026.
const DEFAULT_SEND_TIME_UTC = "T13:00:00.000Z";
const sendKey = (slot) => `marketing-calendar-2026-${String(slot).padStart(2, "0")}`;
const campaignName = (e) => `Marketing Calendar 2026 - ${String(e.slot).padStart(2, "0")} ${e.topic}`;

async function seedCampaigns() {
  const existing = await sb(
    `campaigns?category=eq.${CATEGORY}&select=id,name,send_key,status&limit=100`
  );
  const bySendKey = new Map(existing.map((c) => [c.send_key, c]));
  let inserted = 0;
  let updated = 0;
  let retired = 0;
  for (const e of EMAILS) {
    const key = sendKey(e.slot);
    const row = {
      name: campaignName(e),
      subject_line: e.subject,
      html_content: emailHtml({ title: e.subject, ...e }),
      category: CATEGORY,
      email_type: "campaign",
      workspace: "dreamplay_marketing",
      status: "draft",
      is_template: false,
      is_ready: false,
      send_key: key,
      scheduled_at: `${e.date}${DEFAULT_SEND_TIME_UTC}`,
      scheduled_status: null,
      variable_values: {
        preview_text: e.preheader,
        topic: e.topic,
        audience_setting: AUDIENCE_SETTING,
      },
    };

    const current = bySendKey.get(key);
    if (current) {
      // REWRITE only replaces DRAFTS, and only when asked. Anything already
      // sent is history and must never be rewritten under it.
      if (!REWRITE) {
        console.log(`  = exists, untouched: ${key} (${current.name}) [use --rewrite to replace]`);
        continue;
      }
      if (current.status !== "draft") {
        console.log(`  ! SKIPPED (status=${current.status}, not a draft): ${key} (${current.name})`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  ~ would rewrite: ${key} "${e.subject}" @ ${row.scheduled_at}`);
      } else {
        await sb(`campaigns?id=eq.${current.id}`, {
          method: "PATCH",
          body: JSON.stringify(row),
          headers: { Prefer: "return=minimal" },
        });
        console.log(`  ~ rewritten: ${key} "${e.subject}" @ ${row.scheduled_at}`);
      }
      updated++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  + would insert: ${key} "${e.subject}" @ ${row.scheduled_at}`);
    } else {
      await sb("campaigns", { method: "POST", body: JSON.stringify(row), headers: { Prefer: "return=minimal" } });
      console.log(`  + inserted: ${key} "${e.subject}" @ ${row.scheduled_at}`);
    }
    inserted++;
  }

  // Slots that no longer exist in EMAILS (the sequence shrank from 10 to 8).
  // Retire rather than delete, so the row and any history survive, and clear
  // scheduled_at so a retired draft can never look like it is due to send.
  if (REWRITE) {
    const liveKeys = new Set(EMAILS.map((e) => sendKey(e.slot)));
    for (const c of existing) {
      if (!c.send_key || !c.send_key.startsWith("marketing-calendar-2026-")) continue;
      if (liveKeys.has(c.send_key)) continue;
      if (c.status !== "draft") {
        console.log(`  ! leaving non-draft orphan alone (status=${c.status}): ${c.send_key}`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  - would retire dropped slot: ${c.send_key} (${c.name})`);
      } else {
        await sb(`campaigns?id=eq.${c.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "deleted", scheduled_at: null, category: `${CATEGORY}-retired` }),
          headers: { Prefer: "return=minimal" },
        });
        console.log(`  - retired dropped slot: ${c.send_key} (${c.name})`);
      }
      retired++;
    }
  }

  console.log(
    `Campaigns: ${inserted} inserted, ${updated} rewritten, ${retired} retired, ` +
      `${EMAILS.length - inserted - updated} left as-is.`
  );

  // The coupon trigger template, matched by NAME (it has no send_key of its
  // own: each send mints a child keyed on the subscriber).
  const couponExisting = await sb(
    `campaigns?name=eq.${encodeURIComponent(COUPON_EMAIL.name)}&select=id,name,variable_values&limit=1`
  );
  if (couponExisting.length > 0) {
    if (!REWRITE) {
      console.log(`  = exists, untouched: coupon template (${couponExisting[0].id}) [use --rewrite to replace]`);
      return;
    }
    // Preserve the configured discount code across a copy rewrite.
    const keepCode = couponExisting[0].variable_values?.discount_code ?? "";
    const patch = {
      subject_line: COUPON_EMAIL.subject,
      html_content: emailHtml({ title: COUPON_EMAIL.subject, ...COUPON_EMAIL }),
      variable_values: {
        preview_text: COUPON_EMAIL.preheader,
        topic: COUPON_EMAIL.topic,
        discount_code: keepCode,
      },
    };
    if (DRY_RUN) {
      console.log(`  ~ would rewrite coupon template (keeping code ${JSON.stringify(keepCode)})`);
    } else {
      await sb(`campaigns?id=eq.${couponExisting[0].id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        headers: { Prefer: "return=minimal" },
      });
      console.log(`  ~ rewritten: coupon template (kept code ${JSON.stringify(keepCode)})`);
    }
    return;
  }
  const couponRow = {
    name: COUPON_EMAIL.name,
    subject_line: COUPON_EMAIL.subject,
    html_content: emailHtml({ title: COUPON_EMAIL.subject, ...COUPON_EMAIL }),
    category: CATEGORY,
    email_type: "campaign",
    workspace: "dreamplay_marketing",
    status: "draft",
    is_template: true,
    is_ready: false,
    send_key: null,
    scheduled_at: null,
    scheduled_status: null,
    variable_values: {
      preview_text: COUPON_EMAIL.preheader,
      topic: COUPON_EMAIL.topic,
      // Filled in by /admin/marketing-calendar/coupon once Lionel creates the
      // code in Shopify. The trigger refuses to send while it is empty.
      discount_code: "",
    },
  };
  if (DRY_RUN) {
    console.log(`  + would insert: coupon template "${COUPON_EMAIL.subject}"`);
  } else {
    await sb("campaigns", { method: "POST", body: JSON.stringify(couponRow), headers: { Prefer: "return=minimal" } });
    console.log(`  + inserted: coupon template "${COUPON_EMAIL.subject}"`);
  }
}

async function buildAudience() {
  // 1. Active subscribers with at least one high-intent tag.
  const orTags = HIGH_INTENT_TAGS.map((t) => `tags.cs.{"${t.replace(/"/g, '\\"')}"}`).join(",");
  const tagged = await sbAll(
    `subscribers?status=eq.active&or=(${encodeURIComponent(orTags)})&select=id,email,tags`
  );

  // 2. Checkout-intent analytics events in the lookback window.
  const cutoff = new Date(Date.now() - CHECKOUT_LOOKBACK_DAYS * 864e5).toISOString();
  const events = await sbAll(
    `events?event_name=in.(${CHECKOUT_EVENT_NAMES.join(",")})&created_at=gte.${cutoff}&select=email,subscriber_id`
  );
  const eventEmails = new Set(events.map((e) => e.email?.toLowerCase()).filter(Boolean));
  const eventSubIds = new Set(events.map((e) => e.subscriber_id).filter(Boolean));

  const byId = new Map(tagged.map((s) => [s.id, s]));
  // Resolve event-only people to active subscriber rows.
  if (eventSubIds.size > 0) {
    const ids = [...eventSubIds].filter((id) => !byId.has(id));
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const rows = await sb(`subscribers?status=eq.active&id=in.(${chunk.join(",")})&select=id,email,tags`);
      for (const r of rows) byId.set(r.id, r);
    }
  }
  if (eventEmails.size > 0) {
    const known = new Set([...byId.values()].map((s) => s.email.toLowerCase()));
    const emails = [...eventEmails].filter((e) => !known.has(e));
    for (let i = 0; i < emails.length; i += 50) {
      const chunk = emails.slice(i, i + 50).map((e) => `"${e}"`);
      const rows = await sb(`subscribers?status=eq.active&email=in.(${encodeURIComponent(chunk.join(","))})&select=id,email,tags`);
      for (const r of rows) byId.set(r.id, r);
    }
  }

  // 3. Exclusions: disqualifying tags, buyers-table emails, test addresses, suppressions.
  const buyers = await sbAll(`buyers?select=email&order=id.asc`);
  const buyerEmails = new Set(buyers.map((b) => b.email?.toLowerCase()).filter(Boolean));
  const suppressions = await sbAll(`suppressions?select=email&order=id.asc`);
  const suppressed = new Set(suppressions.map((s) => s.email.toLowerCase()));

  const kept = [];
  const dropped = { tag: 0, buyer: 0, test: 0, suppressed: 0 };
  for (const s of byId.values()) {
    const email = s.email.toLowerCase();
    if ((s.tags ?? []).some((t) => EXCLUDE_TAGS.includes(t))) { dropped.tag++; continue; }
    if (buyerEmails.has(email)) { dropped.buyer++; continue; }
    if (TEST_EMAILS.has(email)) { dropped.test++; continue; }
    if (suppressed.has(email)) { dropped.suppressed++; continue; }
    kept.push(s.id);
  }
  kept.sort();

  console.log(`Audience: ${byId.size} candidates -> ${kept.length} kept ` +
    `(dropped: ${dropped.tag} purchased/test-tag, ${dropped.buyer} in buyers table, ` +
    `${dropped.test} test addresses, ${dropped.suppressed} suppressed)`);

  // 4. Persist, preserving Lionel's manual removals across rebuilds.
  const existing = await sb(`app_settings?key=eq.${encodeURIComponent(AUDIENCE_SETTING)}&select=value`);
  const prevRemoved = Array.isArray(existing?.[0]?.value?.removedIds) ? existing[0].value.removedIds : [];
  const value = {
    builtAt: new Date().toISOString(),
    rules: [
      `Active subscribers with at least one high-intent tag: ${HIGH_INTENT_TAGS.join(", ")}`,
      `Plus active subscribers with ${CHECKOUT_EVENT_NAMES.join("/")} analytics events in the last ${CHECKOUT_LOOKBACK_DAYS} days`,
      `Excluding: tags ${EXCLUDE_TAGS.join("/")}, every email in the buyers table, Lionel's test addresses, and the suppressions list`,
    ],
    subscriberIds: kept,
    removedIds: prevRemoved.filter((id) => kept.includes(id)),
  };
  if (DRY_RUN) {
    console.log(`Would write ${AUDIENCE_SETTING} with ${kept.length} ids (${value.removedIds.length} removals preserved).`);
    return;
  }
  await sb("app_settings", {
    method: "POST",
    body: JSON.stringify({ key: AUDIENCE_SETTING, value }),
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
  console.log(`Wrote ${AUDIENCE_SETTING}: ${kept.length} subscribers (${value.removedIds.length} manual removals preserved).`);
}

if (!AUDIENCE_ONLY) await seedCampaigns();
await buildAudience();
console.log("Done.");

/**
 * setup-marketing-calendar.mjs — seed the August 2026 marketing calendar.
 *
 * Two jobs, both idempotent:
 *
 * 1. EMAIL DRAFTS: inserts 10 nurture emails as `campaigns` rows
 *    (category "marketing-calendar", status "draft", scheduled_status NULL
 *    so the Inngest scheduler ignores them). Tue/Thu/Sun cadence starting
 *    Thu 2026-08-13, default send time 9:00 AM ET. Existing rows (matched
 *    by send_key) are NEVER overwritten: Lionel edits live in
 *    /admin/marketing-calendar and re-running this script must not clobber
 *    them.
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
 *   node setup-marketing-calendar.mjs --audience-only rebuild only the snapshot
 *   node setup-marketing-calendar.mjs --dry-run       report, write nothing
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const AUDIENCE_ONLY = argv.includes("--audience-only");

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

const EMAILS = [
  {
    slot: 1,
    date: "2026-08-13",
    topic: "Benefits of narrow keys",
    subject: "What happens when the keys finally fit",
    preheader: "Chords you could never reach become comfortable. Same music, without the fight.",
    eyebrow: "The DreamPlay One",
    headline: "What happens when the keys finally fit",
    paragraphs: [
      "Hi {{first_name}}, most pianos come in exactly one size. If your hands are on the smaller side, that has meant years of stretching, straining and leaving notes out, and probably blaming yourself for all of it.",
      "The DreamPlay One is built around narrower keys, sized for real hands instead of the largest ones. Chords you could never reach become comfortable. Passages that always broke down start to flow. It is the same music, just without the fight.",
    ],
    ctaLabel: "See Why Narrow Keys Work",
    ctaUrl: `${SITE}/why-narrow`,
    closing: ["If you have ever wondered whether the problem was you or the instrument, I can tell you now: it was never you."],
  },
  {
    slot: 2,
    date: "2026-08-16",
    topic: "The research",
    subject: "The research that started all of this",
    preheader: "Hand span, key width, and why so many players struggle with an instrument made for someone else.",
    eyebrow: "The science",
    headline: "The research that started all of this",
    paragraphs: [
      "Before I built anything, I spent months in the research on hand span and key width. What I found honestly upset me: for a large share of players, especially women and children, a conventional keyboard is simply too wide to play in comfort.",
      "That mismatch shows up as strain, missed notes and sometimes injury, and for a century the industry answer has been to practice harder. We took the other route and changed the instrument instead. I put the studies and the numbers on one page so you can see them for yourself.",
    ],
    ctaLabel: "Read the Research",
    ctaUrl: `${SITE}/hidden-barrier`,
    closing: ["Five minutes with this page explains the DreamPlay One better than anything else I could write."],
  },
  {
    slot: 3,
    date: "2026-08-18",
    topic: "Hand guide download",
    subject: "Print this, then place your hand on it",
    preheader: "Our free 1:1 printable hand guide shows you exactly which key size fits your hands.",
    eyebrow: "Free printable guide",
    headline: "Print this, then place your hand on it",
    paragraphs: [
      "The question I get most, every single day: how do I know which key size fits my hand? So we made the answer physical. Our printable hand guide is a true 1:1 scale sheet. Print it, lay your hand flat on the paper, and it shows you which size matches your reach.",
      "It takes two minutes and a regular printer, and it pairs with the hand span calculator on the same page. You will walk away knowing exactly which keyboard is the right home for your hands, before you spend a dollar.",
    ],
    ctaLabel: "Get the Hand Guide",
    ctaUrl: `${SITE}/how-it-works`,
    closing: ["Measure first. It is the most useful two minutes in this whole journey."],
  },
  {
    slot: 4,
    date: "2026-08-20",
    topic: "Practice tips",
    subject: "Practice less, improve more",
    preheader: "The practice habits that actually move the needle, from years of playing and teaching.",
    eyebrow: "Practice, better",
    headline: "Practice less, improve more",
    paragraphs: [
      "The biggest practice myth is that more hours automatically mean more progress. They do not. After years of playing and teaching, I can tell you that focused, comfortable practice beats long, tense practice every single time.",
      "I wrote up the habits that actually move the needle: shorter sessions, slower tempos, real goals for each sitting, and an instrument that does not wear your hands out in the first ten minutes. Small changes, dramatic difference.",
    ],
    ctaLabel: "Read the Practice Guide",
    ctaUrl: `${SITE}/better-practice`,
    closing: ["Try even one of these this week and you will feel the difference at the keyboard."],
  },
  {
    slot: 5,
    date: "2026-08-23",
    topic: "Relaxation",
    subject: "The twenty minutes that reset your whole day",
    preheader: "Some of the best piano time has no goal at all.",
    eyebrow: "Play to unwind",
    headline: "The twenty minutes that reset your whole day",
    paragraphs: [
      "Not every session at the piano needs a goal. Some of the best time you will ever spend there is the kind where you sit down after a long day, play something slow, and feel your shoulders come down from your ears.",
      "That only works when the instrument itself is comfortable: weighted keys that respond gently, a size that fits your hands, nothing pulling you out of the moment. That is the experience the DreamPlay One is built for. Music as a place to rest, not one more thing to fight with.",
    ],
    ctaLabel: "Meet the DreamPlay One",
    ctaUrl: `${SITE}/`,
    closing: ["Whatever first brought you to the piano, I hope it gives you that kind of quiet."],
  },
  {
    slot: 6,
    date: "2026-08-25",
    topic: "Hardware specs",
    subject: "Under the lid: the DreamPlay One, spec by spec",
    preheader: "Weighted hammer action, three key sizes, LED guided learning. The full sheet.",
    eyebrow: "Under the lid",
    headline: "What the DreamPlay One is actually made of",
    paragraphs: [
      "A piano with narrower keys only matters if it still feels like a real piano. So we obsessed over the parts you touch: fully weighted hammer-action keys, custom steel tooling for the keybeds, and a cabinet that belongs in your living room, not a storage closet.",
      "Every DreamPlay One carries the LED guided learning system and comes in three key sizes, including conventional width. I put the full specification on one page, from the key action to the dimensions, so you can inspect everything yourself.",
    ],
    ctaLabel: "See the Full Specs",
    ctaUrl: `${SITE}/product-information`,
    closing: ["If you are the kind of person who reads the spec sheet before the brochure, this page is for you."],
  },
  {
    slot: 7,
    date: "2026-08-27",
    topic: "LED guided learning",
    subject: "Learn songs with the lights on",
    preheader: "How the LED guided learning system gets you playing real music on day one.",
    eyebrow: "Guided learning",
    headline: "Learn songs with the lights on",
    paragraphs: [
      "The fastest way to lose a new player is week one: staring at sheet music that might as well be another language, not sure which key to press. The DreamPlay One takes that wall down. The LED guided learning system lights the way, so you are playing real music on day one.",
      "It is not a replacement for learning, it is a bridge to it. As you improve you lean on the lights less and read more. Beginners get momentum, returning players get their confidence back, and kids get hooked instead of frustrated.",
    ],
    ctaLabel: "See How Guided Learning Works",
    ctaUrl: `${SITE}/learn`,
    closing: ["Nobody ever quit piano because it was too fun on day one."],
  },
  {
    slot: 8,
    date: "2026-08-30",
    topic: "Founder story",
    subject: "Why I started building pianos",
    preheader: "A note from Lionel about the people who inspired DreamPlay.",
    eyebrow: "From Lionel",
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
    slot: 9,
    date: "2026-09-01",
    topic: "Production progress",
    subject: "The first prototypes exist. I have held them.",
    preheader: "A look inside DreamPlay production, delays and all.",
    eyebrow: "Behind the scenes",
    headline: "The first prototypes exist, and I have held them",
    paragraphs: [
      "For everyone quietly watching and wondering whether this is real: the first DreamPlay One prototypes have come off the line, and holding one after all the drawings, tooling and testing was one of the best moments of my life.",
      "From custom steel molds to electronics integration, the whole journey is documented on our production timeline: what is finished, what is in progress, and what still stands between us and your doorstep. I keep it honest, delays included.",
    ],
    ctaLabel: "Follow the Production Timeline",
    ctaUrl: `${SITE}/production-timeline`,
    closing: ["Building an instrument company in public is terrifying and wonderful. Come look over my shoulder."],
  },
  {
    slot: 10,
    date: "2026-09-03",
    topic: "Choosing your size",
    subject: "Which DreamPlay One is yours?",
    preheader: "DS5.5, DS6.0 or conventional width: two minutes in the configurator answers it.",
    eyebrow: "Find your fit",
    headline: "Which DreamPlay One is yours?",
    paragraphs: [
      "Every DreamPlay One starts with one decision: your key size. DS5.5 for smaller hands, DS6.0 for players who feel cramped on conventional keys, and full conventional width if you simply want the guided learning and the build quality.",
      "The configurator walks you through it in about two minutes: pick your size, pick your finish, and see exactly what your instrument will look like. Reserving now puts you in the earliest production run.",
    ],
    ctaLabel: "Build Your DreamPlay One",
    ctaUrl: `${SITE}/customize`,
    closing: ["Not sure about size? Reply to this email and I will help you decide personally."],
  },
];

/**
 * The behavioral trigger email (NOT on the calendar). Sent automatically to
 * anyone who opened 3+ calendar emails and has not purchased after 3 days.
 * Stored as a TEMPLATE campaign: each send clones a child keyed on
 * send_key marketing-coupon-100:<subscriberId>, so one person can only ever
 * receive it once. {{discount_code}} is filled from variable_values at send
 * time; the code itself is created by hand in the Shopify admin because this
 * app's API token has no write_discounts scope.
 */
const COUPON_EMAIL = {
  name: "Marketing Calendar 2026 - Engaged Non-Buyer $100 Coupon",
  topic: "Engaged non-buyer $100 coupon (automatic trigger)",
  subject: "$100 off, because you have been paying attention",
  preheader: "A thank you for following along, and $100 off your DreamPlay One if you are ready.",
  eyebrow: "$100 off, just for you",
  headline: "I saved you $100, {{first_name}}",
  paragraphs: [
    "You have been opening my emails and reading about the DreamPlay One, which tells me something about it is speaking to you. You just have not pulled the trigger yet, and honestly, I get it. This is a new instrument from a small company, and that takes a leap.",
    "So let me make the leap smaller. Here is $100 off your DreamPlay One, from me. Use it whenever you are ready.",
  ],
  codeBox: { label: "Your discount code", note: "Enter it at checkout, or use the button below and it applies itself." },
  ctaLabel: "Use My $100 Off",
  ctaUrl: `${SITE}/customize`,
  closing: [
    "If something is holding you back that $100 will not fix, reply and tell me what it is. Sizing, shipping, whether it will suit your hands: I answer these myself and I would rather help you decide than have you wonder.",
  ],
};

// 9:00 AM ET on these dates is EDT (-04:00) throughout Aug + early Sep 2026.
const DEFAULT_SEND_TIME_UTC = "T13:00:00.000Z";
const sendKey = (slot) => `marketing-calendar-2026-${String(slot).padStart(2, "0")}`;
const campaignName = (e) => `Marketing Calendar 2026 - ${String(e.slot).padStart(2, "0")} ${e.topic}`;

async function seedCampaigns() {
  const existing = await sb(
    `campaigns?category=eq.${CATEGORY}&select=id,name,send_key&limit=100`
  );
  const bySendKey = new Map(existing.map((c) => [c.send_key, c]));
  let inserted = 0;
  for (const e of EMAILS) {
    const key = sendKey(e.slot);
    if (bySendKey.has(key)) {
      console.log(`  = exists, untouched: ${key} (${bySendKey.get(key).name})`);
      continue;
    }
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
    if (DRY_RUN) {
      console.log(`  + would insert: ${key} "${e.subject}" @ ${row.scheduled_at}`);
    } else {
      await sb("campaigns", { method: "POST", body: JSON.stringify(row), headers: { Prefer: "return=minimal" } });
      console.log(`  + inserted: ${key} "${e.subject}" @ ${row.scheduled_at}`);
    }
    inserted++;
  }
  console.log(`Campaigns: ${inserted} inserted, ${EMAILS.length - inserted} already present.`);

  // The coupon trigger template, matched by NAME (it has no send_key of its
  // own: each send mints a child keyed on the subscriber).
  const couponExisting = await sb(
    `campaigns?name=eq.${encodeURIComponent(COUPON_EMAIL.name)}&select=id,name&limit=1`
  );
  if (couponExisting.length > 0) {
    console.log(`  = exists, untouched: coupon template (${couponExisting[0].id})`);
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

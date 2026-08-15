/**
 * setup-love-vs-spec-emails.mjs — seed the Love-vs-Spec 2x2 email arms.
 *
 * Test doc: docs/plan/AB-TEST-LOVE-VS-SPEC.md. Four arms, one per cell:
 *
 *   6a SPEC message, standard offer      6b SPEC message, $249 deposit
 *   7a LOVE message, standard offer      7b LOVE message, $249 deposit
 *
 * Seeds 32 draft campaigns (8 slots x 4 arms) in category "marketing-calendar"
 * so /admin/marketing-calendar shows every variation (4 cards per slot day).
 * Slots run Tue/Thu/Sun Aug 18 - Sep 3 2026, 9:00 AM ET. Nothing sends
 * automatically: status=draft, scheduled_status=NULL; the send script
 * (send-love-vs-spec.mjs) is the only sender.
 *
 * Copy rules (inherited from the rev-2 calendar review, 2026-08-12):
 *   - NO EM DASHES anywhere.
 *   - Every link points at www.dreamplaypianos.com (append-mode tracking).
 *   - Every CTA carries ?v=<armKey>: middleware stamps the dp_ab cookie from
 *     deep links, so each email arm pins its own site variant (offer included).
 *   - Would Lionel spontaneously type this into Gmail? If not, cut it.
 *   - Never promise an asset that does not exist. Never invent a number.
 *   - Only slot 08 states prices. a-arms say $499 today + $500 at ship;
 *     b-arms say $249 today + $750 at ship. Totals identical ($999).
 *
 * The pre-2x2 calendar drafts (send keys marketing-calendar-2026-01..08) are
 * retired by this script: status deleted, category marketing-calendar-retired,
 * scheduled_at cleared. Their copy lives on as the SPEC arms below. The $50
 * coupon template is left untouched (the trigger stays OFF during the test).
 *
 * Usage:
 *   node setup-love-vs-spec-emails.mjs             seed (existing rows untouched)
 *   node setup-love-vs-spec-emails.mjs --rewrite   replace DRAFT copy from this file
 *   node setup-love-vs-spec-emails.mjs --dry-run   report, write nothing
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const REWRITE = argv.includes("--rewrite");

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
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { ...init, headers: { ...HEADERS, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const CATEGORY = "marketing-calendar";
const AUDIENCE_SETTING = "marketing-calendar:audience";
const SITE = "https://www.dreamplaypianos.com";
// 9:00 AM ET is EDT (-04:00) for every slot date below.
const DEFAULT_SEND_TIME_UTC = "T13:00:00.000Z";

/** Tue/Thu/Sun. Slot dates shared by all four arms so day effects cancel. */
const SLOT_DATES = {
  1: "2026-08-18",
  2: "2026-08-20",
  3: "2026-08-23",
  4: "2026-08-25",
  5: "2026-08-27",
  6: "2026-08-30",
  7: "2026-09-01",
  8: "2026-09-03",
};

const ARMS = [
  { key: "6a", msg: "spec", offer: "standard" },
  { key: "6b", msg: "spec", offer: "deposit249" },
  { key: "7a", msg: "love", offer: "standard" },
  { key: "7b", msg: "love", offer: "deposit249" },
];

// Same dark/gold layout as setup-marketing-calendar.mjs (kept in sync by hand).
function emailHtml({ title, preheader, eyebrow, headline, paragraphs, ctaLabel, ctaUrl, closing }) {
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
        <tr>
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

// ---------------------------------------------------------------------------
// SPEC message: the reviewed rev-2 calendar copy, unchanged except slot 8's
// price paragraph (offer-dependent) and the ?v= links.
// ---------------------------------------------------------------------------
const SPEC_EMAILS = [
  {
    slot: 1,
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
    ctaPath: "/why-narrow",
    closing: ["If you have spent years assuming you just needed to practice the stretch more, it is worth reading."],
  },
  {
    slot: 2,
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
    ctaPath: "/our-story",
    closing: ["Thank you for being here while we build it. It means more than you know."],
  },
  {
    slot: 3,
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
    ctaPath: "/hidden-barrier",
    closing: ["The short version: the instrument was standardized around one hand size, and it was not the average one."],
  },
  {
    slot: 4,
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
    ctaPath: "/how-it-works",
    closing: ["If your number is close to a boundary, reply and tell me what it is. I will give you my honest opinion."],
  },
  {
    slot: 5,
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
    ctaPath: "/product-information",
    closing: ["If you are the kind of person who reads the spec sheet before the brochure, this page is for you."],
  },
  {
    slot: 6,
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
    ctaPath: "/learn",
    closing: ["Every DreamPlay One has it, and you can leave it switched off forever if you would rather."],
  },
  {
    slot: 7,
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
    ctaPath: "/production-timeline",
    closing: ["Manufacturing is where the schedule slips, so I would rather you hear it from me than wonder."],
  },
  {
    slot: 8,
    topic: "Reserve yours",
    subject: "Ready to pick yours?",
    preheader: "Choose your key size and finish, and reserve with a deposit.",
    eyebrow: "Reserve yours",
    headline: "Ready to pick yours?",
    paragraphs: [
      "Over the last few weeks I have shown you why the keys are narrower, the research behind it, how to work out your size, what the action feels like, and where production actually stands. If it sounds like the instrument you have been waiting for, here is how to get one.",
      { offer: true }, // replaced per arm below
    ],
    ctaLabel: "Build Your DreamPlay One",
    ctaPath: "/customize",
    closing: [
      "Still unsure about sizing, shipping, or anything else? Reply to this email. I answer these myself and I would rather talk it through than have you guess.",
    ],
  },
];

// ---------------------------------------------------------------------------
// LOVE message: playing the pieces and music you love, for the returning
// player. Facts checked against docs/research/*: octave stats (15 of 18
// surveyed buyers strain to reach an octave), the largest buyer group
// (returning after years away), the Grieg reference (a real buyer named the
// piece in the survey; kept anonymous), and the reach claim (a tenth on the
// DS5.5 spans about 7.1 inches of reach, less than a standard-key ninth at
// about 7.4).
// ---------------------------------------------------------------------------
const LOVE_EMAILS = [
  {
    slot: 1,
    topic: "Is the piano still fun",
    subject: "Is the piano still fun?",
    preheader: "An honest question about why you slowed down, and what it would take to enjoy playing again.",
    eyebrow: "A question",
    headline: "Is the piano still fun?",
    paragraphs: [
      "Hi {{first_name}}, I want to ask you something, and I mean it as a real question. Is the piano still fun? For a lot of people who once played seriously, the honest answer is: not really, not anymore. There was a point where you slowed down, and it was not because you stopped loving the music.",
      "Playing stopped being enjoyable. The pieces you wanted stayed just out of reach, practice started to ache, and you assumed that was simply what getting older meant. I do not accept that, and it is why I build pianos. The barrier was never your effort. It was the width of the keys.",
    ],
    ctaLabel: "See the Piano Built for You",
    ctaPath: "/play-again",
    closing: ["You never lost the ability to want to play. That is worth taking seriously."],
  },
  {
    slot: 2,
    topic: "Founder story",
    subject: "Why I started building pianos",
    preheader: "I taught piano for years before I ever thought about manufacturing one.",
    eyebrow: "From me",
    headline: "Why I started building pianos",
    paragraphs: [
      "Hi {{first_name}}, if you have followed my channel for a while, you know the piano has been my whole life. What you may not know is how many people wrote to me over the years saying the same thing: I love this instrument, but my hands are too small for it.",
      "At some point I stopped treating that as a sad fact and started treating it as a design problem. DreamPlay is my answer: a piano that fits your hands, so the music you love stops being off limits. Nobody should have to give up an instrument they love over the size of their hands.",
    ],
    ctaLabel: "Read Our Story",
    ctaPath: "/our-story",
    closing: ["Thank you for being here while we build it. It means more than you know."],
  },
  {
    slot: 3,
    topic: "The pieces you always wanted to play",
    subject: "The pieces you always wanted to play",
    preheader: "The tenth you roll, the inner notes you drop, and the piece you never quite got to play as written.",
    eyebrow: "The music",
    headline: "The pieces you always wanted to play",
    paragraphs: [
      "Every pianist has a list. The piece with the tenths you have always rolled. The chord where an inner note quietly gets dropped. One of our early customers named his: Wedding Day at Troldhaugen by Grieg, which has a stretch he has never been able to play as written. He ordered a DreamPlay so he finally can.",
      "On keys that fit your hand, that list gets shorter fast. On the DS5.5, reaching a tenth takes less stretch than a ninth does on standard keys. The notes you have been rolling or leaving out are simply there.",
    ],
    ctaLabel: "What Would You Play First?",
    ctaPath: "/play-again",
    closing: ["Reply and tell me the piece you have always wanted to play. I read every one of these."],
  },
  {
    slot: 4,
    topic: "Which size fits the music you love",
    subject: "Which key size fits the music you love",
    preheader: "Measure your span, then see which width puts your repertoire back within reach.",
    eyebrow: "Find your size",
    headline: "Which key size fits the music you love",
    paragraphs: [
      "The point of measuring your hand is not the number. It is what the number unlocks. Measure your span: thumb tip to little finger tip, stretched out flat, in inches. That one measurement tells you which keyboard puts your music back within reach.",
      "Under 7.6 inches and standard keys are genuinely too wide for you, which is what the DS5.5 is for. Between 7.6 and 8.5 the DS6.0 is the comfortable middle. Above that, your hands fit the historical standard and the DS6.5 gives you conventional width. There is a calculator on our site that walks through it and tells you which intervals open up at each size.",
    ],
    ctaLabel: "Check Your Hand Span",
    ctaPath: "/how-it-works",
    closing: ["If your number is close to a boundary, reply and tell me what it is. I will give you my honest opinion."],
  },
  {
    slot: 5,
    topic: "You do not have to give up the piano",
    subject: "You do not have to give up the piano",
    preheader: "Most of our buyers are not beginners. They are people coming back.",
    eyebrow: "Lifelong",
    headline: "You do not have to give up the piano",
    paragraphs: [
      "Here is something that surprised me about the people who ordered a DreamPlay One. The single largest group is not beginners. It is people returning after years away: they played as students, and then strain, aching hands, or plain discouragement slowly pushed the piano out of their lives. Most of the buyers we surveyed cannot comfortably reach an octave on standard keys.",
      "The piano is not an instrument you should have to retire from. Strain at a certain age gets read as the end of the road, but when the real cause is reach, a keyboard that fits your hand changes the story. This is an instrument you can enjoy for the rest of your life.",
    ],
    ctaLabel: "Come Back to the Piano",
    ctaPath: "/play-again",
    closing: ["If you stopped playing years ago, I would genuinely like to hear what stopped you. Reply and tell me."],
  },
  {
    slot: 6,
    topic: "It still has to feel like a piano",
    subject: "It still has to feel like a piano",
    preheader: "Weighted hammer action on custom tooling, because the music deserves a real instrument.",
    eyebrow: "Under the lid",
    headline: "It still has to feel like a piano",
    paragraphs: [
      "Narrow keys only matter if the instrument still feels like a real piano under your fingers. That is where we spent most of our time: fully weighted hammer action, on keybeds we had custom steel tooling made for. Not a toy and not a compromise.",
      "Because the goal is not novelty. The goal is that when you sit down to play the music you love, the instrument answers the way a piano should. The full specification is on one page if you want to look under the lid.",
    ],
    ctaLabel: "See What It Is Made Of",
    ctaPath: "/product-information",
    closing: ["If you are the kind of person who wants the details before the feelings, that page is for you."],
  },
  {
    slot: 7,
    topic: "Production progress",
    subject: "I finally sat down and played one",
    preheader: "The first prototypes are off the line. Here is exactly where things stand.",
    eyebrow: "Behind the scenes",
    headline: "I finally sat down and played one",
    paragraphs: [
      "The first DreamPlay One prototypes have come off the line. We started with a factory partnership in June last year, and after fourteen months of drawings, tooling and revisions, sitting down at one and playing it was a strange feeling. This is real now.",
      "I have put the whole timeline on one page, including the parts that have taken longer than I expected. If you are thinking about coming back to the piano on one of these, you deserve to see exactly where things stand first.",
    ],
    ctaLabel: "Follow the Production Timeline",
    ctaPath: "/production-timeline",
    closing: ["Manufacturing is where the schedule slips, so I would rather you hear it from me than wonder."],
  },
  {
    slot: 8,
    topic: "Ready to play again",
    subject: "Ready to play again?",
    preheader: "Pick your key size and finish, and reserve the piano that fits your hands.",
    eyebrow: "Reserve yours",
    headline: "Ready to play again?",
    paragraphs: [
      "Over the last few weeks I have asked whether the piano is still fun, shown you the music that opens up on keys that fit, and told you where production actually stands. If some piece has been sitting in the back of your mind this whole time, here is how you get to play it.",
      { offer: true }, // replaced per arm below
    ],
    ctaLabel: "Build Your DreamPlay One",
    ctaPath: "/customize",
    closing: [
      "Still unsure about sizing, shipping, or anything else? Reply to this email. I answer these myself and I would rather talk it through than have you guess.",
    ],
  },
];

/** Slot-8 price paragraph per offer. Totals identical; only the split differs. */
const OFFER_PARAGRAPH = {
  standard:
    "The configurator takes about two minutes: pick your key size, pick your finish, see what it looks like. The keyboard is $999 in total, split as $499 today and $500 when yours is boxed and ready to ship, and reserving now locks in the founder price.",
  deposit249:
    "The configurator takes about two minutes: pick your key size, pick your finish, see what it looks like. The keyboard is $999 in total, and you can reserve yours for just $249 today: the remaining $750 is charged only when your piano is boxed and ready to ship. Reserving now locks in the founder price.",
};

const pad2 = (n) => String(n).padStart(2, "0");
const sendKey = (arm, slot) => `mc-${arm.msg}-${arm.key}-${pad2(slot)}`;
const OLD_KEY_PREFIX = "marketing-calendar-2026-";

function buildRow(arm, email) {
  const paragraphs = email.paragraphs.map((p) =>
    typeof p === "object" && p.offer ? OFFER_PARAGRAPH[arm.offer] : p
  );
  const ctaUrl = `${SITE}${email.ctaPath}?v=${arm.key}`;
  const html = emailHtml({
    title: email.subject,
    preheader: email.preheader,
    eyebrow: email.eyebrow,
    headline: email.headline,
    paragraphs,
    ctaLabel: email.ctaLabel,
    ctaUrl,
    closing: email.closing,
  });
  if (html.includes("—")) throw new Error(`em dash in ${sendKey(arm, email.slot)}`);
  return {
    name: `MC 2x2 ${pad2(email.slot)} [${arm.msg.toUpperCase()} ${arm.key}] ${email.topic}`,
    subject_line: email.subject,
    html_content: html,
    category: CATEGORY,
    email_type: "campaign",
    workspace: "dreamplay_marketing",
    status: "draft",
    is_template: false,
    is_ready: false,
    send_key: sendKey(arm, email.slot),
    scheduled_at: `${SLOT_DATES[email.slot]}${DEFAULT_SEND_TIME_UTC}`,
    scheduled_status: null,
    variable_values: {
      preview_text: email.preheader,
      topic: email.topic,
      audience_setting: AUDIENCE_SETTING,
      ab_test: "love-vs-spec-2x2",
      ab_arm: arm.key,
      ab_message: arm.msg,
      ab_offer: arm.offer,
    },
  };
}

async function main() {
  const existing = await sb(
    `campaigns?category=eq.${CATEGORY}&select=id,name,send_key,status&limit=200`
  );
  const bySendKey = new Map(existing.filter((c) => c.send_key).map((c) => [c.send_key, c]));

  let inserted = 0, updated = 0, untouched = 0, retired = 0;

  for (const arm of ARMS) {
    const emails = arm.msg === "spec" ? SPEC_EMAILS : LOVE_EMAILS;
    for (const email of emails) {
      const row = buildRow(arm, email);
      const current = bySendKey.get(row.send_key);
      if (current) {
        if (!REWRITE) {
          untouched++;
          continue;
        }
        if (current.status !== "draft") {
          console.log(`  ! SKIPPED (status=${current.status}): ${row.send_key}`);
          continue;
        }
        if (!DRY_RUN) {
          await sb(`campaigns?id=eq.${current.id}`, {
            method: "PATCH",
            body: JSON.stringify(row),
            headers: { Prefer: "return=minimal" },
          });
        }
        console.log(`  ~ ${DRY_RUN ? "would rewrite" : "rewritten"}: ${row.send_key} "${row.subject_line}"`);
        updated++;
        continue;
      }
      if (!DRY_RUN) {
        await sb("campaigns", { method: "POST", body: JSON.stringify(row), headers: { Prefer: "return=minimal" } });
      }
      console.log(`  + ${DRY_RUN ? "would insert" : "inserted"}: ${row.send_key} @ ${row.scheduled_at} "${row.subject_line}"`);
      inserted++;
    }
  }

  // Retire the pre-2x2 calendar drafts: their copy lives on as the SPEC arms.
  for (const c of existing) {
    if (!c.send_key || !c.send_key.startsWith(OLD_KEY_PREFIX)) continue;
    if (c.status !== "draft") {
      console.log(`  ! leaving non-draft old slot alone (status=${c.status}): ${c.send_key}`);
      continue;
    }
    if (!DRY_RUN) {
      await sb(`campaigns?id=eq.${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted", scheduled_at: null, category: `${CATEGORY}-retired` }),
        headers: { Prefer: "return=minimal" },
      });
    }
    console.log(`  - ${DRY_RUN ? "would retire" : "retired"} pre-2x2 slot: ${c.send_key} (${c.name})`);
    retired++;
  }

  console.log(
    `Done: ${inserted} inserted, ${updated} rewritten, ${untouched} untouched (no --rewrite), ${retired} old slots retired.`
  );
}

await main();

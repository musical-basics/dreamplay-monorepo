/**
 * setup-skeptic-series.mjs: seed the "skeptic" nurture series as drafts.
 *
 * Why this exists: in the Love-vs-Spec 2x2 (Aug 18 - Sep 1, 507 people) one
 * email out-clicked every other send by 3x: slot 06, "I was skeptical about
 * the light-up keys" (12.4% on spec 6b, 8.9% across both SPEC arms, against
 * a sequence average near 2.5%). The LOVE email sent the same day to the same
 * quality of audience pulled 3%. So it was the shape of the email, not the day.
 *
 * The shape, which every email below reproduces:
 *   1. a doubt Lionel genuinely held, stated in the subject in first person
 *   2. credentials that make the doubt credible (taught piano, own hands)
 *   3. ONE concrete observation that flipped it, not an argument
 *   4. a concession that defuses the reader's version of the same objection
 *   5. a CTA that promises to SHOW something the email did not already give away
 *   6. a closing line that removes the last bit of risk
 *
 * Every story is drawn from material already published or recorded in this
 * repo (our-story page, production-timeline page, DS-standard page, the
 * AB Test August 10 survey at n=24, the 2026-08-14 founder call notes). Nothing
 * is invented, but several lines are still claims about Lionel's own past
 * beliefs and MUST be confirmed by him before any real send. The full list is
 * in docs/plan/SKEPTIC-SERIES-DRAFTS.md.
 *
 * Idempotent. Rows are matched by send_key (skeptic-2026-NN). Existing rows are
 * never overwritten unless --rewrite is passed, and --rewrite only touches rows
 * still in status 'draft'. scheduled_status is NULL so nothing sends them: the
 * Inngest scheduler ignores NULL, and the (paused) love-vs-spec workflow only
 * matches send keys beginning mc-. The dates are proposals for the calendar
 * GUI, weekly on Tuesdays, so Lionel can drag them wherever he likes.
 *
 * Template differences from the 2x2 emails, deliberate:
 *   - width="100%" + style width:100% on the card: the 2x2 template was a fixed
 *     640px table (measured 642px in a 375px viewport). 47% of clicks were phones.
 *   - class="pad" on the CTA cell, and the button goes full width under 620px
 *   - a second click surface: an inline text link in the closing paragraph
 *   - one optional hero photo (used once, on the production email)
 *
 * Usage:
 *   node scripts/email/setup-skeptic-series.mjs --dry-run
 *   node scripts/email/setup-skeptic-series.mjs
 *   node scripts/email/setup-skeptic-series.mjs --rewrite
 *   node scripts/email/setup-skeptic-series.mjs --dry-run --html-out /tmp/skeptic   (render to files)
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

const CATEGORY = "marketing-calendar";
const SITE = "https://www.dreamplaypianos.com";
const KEY_PREFIX = "skeptic-2026-";
// Proposed slots: Tuesdays, 9:00 AM ET (13:00 UTC during daylight time).
const SLOT_DATES = { 1: "2026-09-29", 2: "2026-10-06", 3: "2026-10-13", 4: "2026-10-20", 5: "2026-10-27" };
const SEND_TIME_UTC = "T13:00:00.000Z";

const link = (url, text) => `<a href="${url}" style="color:#d8b25c; text-decoration:underline;">${text}</a>`;

function emailHtml({ title, preheader, eyebrow, headline, paragraphs, image, ctaLabel, ctaUrl, closing }) {
  const para = (t) => `            <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">${t}</p>`;
  const closePara = (t) => `            <p class="muted" style="margin:0 0 16px 0; font-size:15px; line-height:1.8;">${t}</p>`;
  const imageRow = image
    ? `        <tr>
          <td style="padding:8px 0 4px 0;">
            <a href="${ctaUrl}" style="display:block;"><img src="${image.src}" alt="${image.alt}" width="640" style="display:block; width:100%; max-width:640px; height:auto; border:0;" /></a>
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
    @media only screen and (max-width:620px) {
      .pad { padding-left:24px !important; padding-right:24px !important; }
      .btnwrap { width:100% !important; }
      .btn { display:block !important; padding-left:16px !important; padding-right:16px !important; letter-spacing:1px !important; }
      h1 { font-size:28px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
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
${imageRow}        <tr>
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

// ---------------------------------------------------------------------------
// The five emails. `closing` may call link(url, text) for the second click
// surface; every link in an email points at the same page as its button.
// ---------------------------------------------------------------------------
const EMAILS = [
  {
    slot: 1,
    topic: "Who this is for",
    subject: "I was wrong about who this was for",
    preheader: "I built this with my students in mind. The people buying it are not who I pictured.",
    eyebrow: "Something I did not expect",
    ctaLabel: "See What I Changed",
    ctaPath: "/play-again",
    paragraphs: [
      "Hi {{first_name}}, when I started building the DreamPlay One I had a clear picture of who it was for. I taught piano for years, and the students I watched struggle with wide intervals were mostly young, and mostly girls. So I pictured students, and the parents and teachers around them. I was wrong.",
      "This summer I asked the people who have already reserved one to tell me about themselves, and twenty-four wrote back. Twenty-three bought it for themselves, not for a child or a student. The largest group is between 45 and 59. A third are coming back to the piano after years away. Twenty of the twenty-four cannot reach an octave without strain. And many of them named the exact piece, or the exact chord, they had given up on.",
      "They were not describing an ambition. They were describing something they had lost.",
    ],
    closing: (url) => [
      `It changed how I talk about this instrument. The page I wrote afterwards does not open with a spec sheet. It opens with a question: ${link(url, "Is the piano still fun?")}`,
    ],
  },
  {
    slot: 2,
    topic: "The first few weeks",
    subject: "For the first few weeks, I was not convinced",
    preheader: "What switching to narrower keys was actually like, including the part nobody advertises.",
    eyebrow: "My own keyboard",
    ctaLabel: "Find Your Key Size",
    ctaPath: "/hidden-barrier",
    paragraphs: [
      "Hi {{first_name}}, a few years ago David Steinbuhler, who has made narrower piano keyboards in a corner of his Pennsylvania textile factory since 1992, put a narrower set of keys into my own Kawai. For the first few weeks I did not notice much difference. What I noticed was the black keys. They felt so narrow. On a standard piano they are wide enough that you can approximate the distance and still hit the note. On these, accuracy was everything, and I was uneasy.",
      "Then the unease went away and something else took its place: relaxation. For the first time in my life I did not have to strain for the most common interval there is, the octave. Pieces I had written off, Chopin, Liszt, Rachmaninoff, started opening up like old friends who had moved back into town. My hands are not large, especially for a man. I had spent three decades on pianos that were simply too big for them, and it took a few weeks to find that out.",
    ],
    closing: (url) => [
      `There is a slider on that page. Measure from the tip of your thumb to the tip of your little finger and it will tell you which size you would be on. ${link(url, "Find your size here.")} And if you are worried about being stuck on one size, pianists who practice on narrower keys report the technique carries back to a standard piano.`,
    ],
  },
  {
    slot: 3,
    topic: "What I told my students",
    subject: "I used to tell my students their hands would grow",
    preheader: "It was true for the children. It was not true for the rest of us.",
    eyebrow: "What I used to say",
    ctaLabel: "See Who Uses These Sizes",
    ctaPath: "/about-us/ds-standard",
    paragraphs: [
      "Hi {{first_name}}, when I was teaching, almost every student under thirteen hit the same wall: their hands could not cover the intervals the music asked for. I said what every teacher says. Do not worry, your hands will grow. For the children, that was true. But most of my female students had the same complaint about the same intervals, and their hands were not going to change. Neither were mine.",
      "By then I had a DS6.0 keyboard at home, and I felt bad demonstrating on it, because I knew they could not reproduce the technique on their standard keys. That is when it flipped for me. I had been treating hand size as the student's problem, something to grow out of or practice around. It is not. The keyboard comes in one size, and that size was standardized around one hand, which was not the average one.",
    ],
    closing: (url) => [
      `Universities are teaching on these sizes now, and international competitions are beginning to accept them. The instrument is finally being adjusted to the player, instead of the other way round. ${link(url, "Here is what the DS standard actually is.")}`,
    ],
  },
  {
    slot: 4,
    topic: "The doubt about delivery",
    subject: "The most common reason people almost did not order",
    preheader: "It is probably the same doubt you have. I would have had it too.",
    eyebrow: "The honest part",
    ctaLabel: "See Everything Built So Far",
    ctaPath: "/production-timeline",
    image: {
      src: `${SITE}/images/product-updates/july-2026-prototype-studio.jpg`,
      alt: "The first DreamPlay prototype, fully assembled in the studio",
    },
    paragraphs: [
      "Hi {{first_name}}, I asked the people who have already reserved a DreamPlay One what nearly stopped them. The most common answer, from nine of the twenty-four who replied, was doubt that a new company could actually deliver. Seven said it was an easy yes. Most of the rest worried about the wait. I want to take that first answer seriously, because it is fair. If I were reading this instead of writing it, I would have the same doubt.",
      "So here is what exists today, rather than what is promised. A factory partner in Shenzhen that agreed to a first batch of under two hundred units, which almost nobody would. Custom steel molds, cut to hundredths of a millimeter, casting our own narrow keys. Finished DS5.5 and DS6.0 keybeds, and a machine whose only job is to press those keys over and over to simulate decades of use. And the first complete prototype, which I have sat down and played. The doubt does not fully go away until instruments ship. But it should be a doubt about a date, not about whether the thing is real.",
    ],
    closing: (url) => [
      `Every step is on one page with photographs, including the parts that took longer than I expected. ${link(url, "The production timeline.")} Questions about the schedule: reply to this email. I answer these myself.`,
    ],
  },
  {
    slot: 5,
    topic: "A call I keep thinking about",
    subject: "He practiced for hours, and it did not help",
    preheader: "A buyer in his sixties, a piano he cannot play as written, and why effort was never going to fix it.",
    eyebrow: "A call I keep thinking about",
    ctaLabel: "See the Number",
    ctaPath: "/why-narrow",
    paragraphs: [
      "Hi {{first_name}}, in August I spent fifteen minutes on the phone with a man who has reserved a DreamPlay One. He is in his sixties and has played since he was fifteen. A condition in his hands pulls the fingers in toward the palm, and his left hand now spans seven inches. He cannot reach an octave unless he catches the very edge of the keys. He owns a good acoustic upright that he cannot play as written.",
      "What stayed with me was what he said about practice. He put in hours against those limits, for years, and saw almost no improvement. The standard advice, and I gave it as a teacher, is to keep at it. But the barrier was never effort. It was geometry, and no amount of practice makes a hand longer. What he wants is not complicated. He wants to play an octave. There is a number for the hand span a standard keyboard quietly expects of you. He is well under it. So are most women, and about a quarter of men.",
    ],
    closing: (url) => [
      `It is on that page, with what changes when the keys are narrower. ${link(url, "See what a standard keyboard expects of your hand.")} If you are under it too, that is not a verdict on your playing. It never was.`,
    ],
  },
];

const pad2 = (n) => String(n).padStart(2, "0");
const sendKey = (slot) => `${KEY_PREFIX}${pad2(slot)}`;

function buildRow(email) {
  const ctaUrl = `${SITE}${email.ctaPath}`;
  const html = emailHtml({
    title: email.subject,
    preheader: email.preheader,
    eyebrow: email.eyebrow,
    headline: email.subject,
    paragraphs: email.paragraphs,
    image: email.image,
    ctaLabel: email.ctaLabel,
    ctaUrl,
    closing: email.closing(ctaUrl),
  });
  const EM_DASH = String.fromCharCode(0x2014);
  if (html.includes(EM_DASH)) throw new Error(`em dash in ${sendKey(email.slot)}`);
  const GLYPHS = new RegExp("[" + String.fromCharCode(0x25B6, 0x2192, 0x2190) + "]"); // play triangle, arrows: Gmail renders them as emoji
  if (GLYPHS.test(html)) throw new Error(`glyph in ${sendKey(email.slot)}`);
  return {
    name: `Skeptic ${pad2(email.slot)} · ${email.topic}`,
    subject_line: email.subject,
    html_content: html,
    category: CATEGORY,
    email_type: "campaign",
    workspace: "dreamplay_marketing",
    status: "draft",
    is_template: false,
    is_ready: false,
    send_key: sendKey(email.slot),
    scheduled_at: `${SLOT_DATES[email.slot]}${SEND_TIME_UTC}`,
    scheduled_status: null,
    variable_values: {
      preview_text: email.preheader,
      topic: email.topic,
      series: "skeptic-2026",
      modelled_on: "mc-spec-6a-06 (12.4% clicks on 6b, 2026-08-30)",
      review_doc: "docs/plan/SKEPTIC-SERIES-DRAFTS.md",
    },
  };
}

async function main() {
  console.log(`${DRY_RUN ? "DRY RUN: " : ""}seeding ${EMAILS.length} skeptic-series drafts into category "${CATEGORY}"`);
  const existing = await sb(`campaigns?send_key=like.${KEY_PREFIX}*&select=id,name,send_key,status&limit=100`);
  const bySendKey = new Map(existing.map((c) => [c.send_key, c]));

  let inserted = 0, rewritten = 0, skipped = 0;
  for (const email of EMAILS) {
    const row = buildRow(email);
    const words = row.html_content.replace(/<style[\s\S]*?<\/style>/, "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    if (HTML_OUT) {
      mkdirSync(HTML_OUT, { recursive: true });
      writeFileSync(join(HTML_OUT, `${row.send_key}.html`), row.html_content.replaceAll("{{first_name}}", "Margaret"));
    }
    const current = bySendKey.get(row.send_key);
    if (current) {
      if (!REWRITE) { console.log(`  = exists, left alone: ${row.send_key} (status=${current.status})`); skipped++; continue; }
      if (current.status !== "draft") { console.log(`  ! SKIPPED (status=${current.status}): ${row.send_key}`); skipped++; continue; }
      if (!DRY_RUN) {
        const { name, subject_line, html_content, variable_values } = row;
        await sb(`campaigns?id=eq.${current.id}`, { method: "PATCH", body: JSON.stringify({ name, subject_line, html_content, variable_values, updated_at: new Date().toISOString() }) });
      }
      console.log(`  ~ ${DRY_RUN ? "would rewrite" : "rewritten"}: ${row.send_key} "${row.subject_line}" (${words} words)`);
      rewritten++;
      continue;
    }
    if (!DRY_RUN) await sb("campaigns", { method: "POST", headers: { ...HEADERS, Prefer: "return=minimal" }, body: JSON.stringify([row]) });
    console.log(`  + ${DRY_RUN ? "would insert" : "inserted"}: ${row.send_key} @ ${row.scheduled_at} "${row.subject_line}" (${words} words)`);
    inserted++;
  }
  console.log(`\ndone: ${inserted} inserted, ${rewritten} rewritten, ${skipped} skipped. Nothing is scheduled to send (scheduled_status NULL).`);
}

main().catch((e) => { console.error(e); process.exit(1); });

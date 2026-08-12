# DreamPlay Marketing Emails — Full Copy Inventory for Review

> **Purpose:** hand every word of the August 2026 nurture sequence to a copy editor (human or AI) for review. This is the live copy as of 2026-08-12, revision 2. Nothing here has been sent yet.
>
> **Hard house rule for any rewrite: no em dashes anywhere.** Use commas, colons or periods instead. The existing copy follows this rule, so keep it that way.

---

## 0. What changed in revision 2 (2026-08-12)

Revision 1 was reviewed externally. The verdict was that the strategy was sound but roughly half the emails read as "a very good copywriter impersonating Lionel" rather than Lionel actually emailing people. Every point was accepted. What changed:

| Change | Why |
|---|---|
| **Cut from 10 emails to 8** | Two emails existed because the calendar needed content, not because there was something to say. The relaxation email (rated 4/10, "it's pretty, that's the problem") and the generic practice-tips email (5/10, "could be from any fitness coach or productivity app") are gone. |
| **Founder story moved from slot 8 to slot 2** | The reader now meets the person before being asked for anything. Revision 1 waited eight emails to introduce Lionel. |
| **The printable hand guide email was removed entirely** | That guide does not exist yet. Revision 1 promised a free 1:1 printable sheet we cannot deliver. Its job (answering "which size fits my hands?") is now done by slot 4, which points at the hand span calculator that is genuinely live on the site today. |
| **Narrow keys email rewritten around real intervals** | Was three escalating abstract statements. Now talks about actual hand-span inches, ninths, tenths and broken octaves, which only a pianist would write. |
| **LED email rewritten as a skeptic's admission** | Was "the DreamPlay One takes that wall down" campaign language. Now Lionel admits light-up keys were not his idea of a serious instrument and explains what changed his mind. |
| **Removed every quotable closing aphorism** | Deleted: "it was never you", "Music as a place to rest, not one more thing to fight with", "Nobody ever quit piano because it was too fun on day one", "Come look over my shoulder", "Small changes, dramatic difference". |
| **Removed business vocabulary** | "Move the needle" is gone and should stay out of DreamPlay's vocabulary. |
| **The coupon email was rewritten completely** | See section 4. The old version told people we counted their opens. |
| **Final email made more directly commercial** | "Reserving now puts you in the earliest production run" was timid for the one email whose job is to sell. It now states the $499 deposit and the price lock. |

**The test applied to every sentence:** not "would Lionel say this?", which is too permissive, but *"would Lionel spontaneously type this into Gmail if there were no marketing campaign?"* If not, it was cut.

---

## 1. Context the editor needs

**The company.** DreamPlay Pianos builds the DreamPlay One, a digital piano with narrower-than-standard keys and an LED guided learning system. The founder is Lionel Yu, who is also the face of the MusicalBasics YouTube channel. The instrument does not ship yet: 64 people have pre-ordered, first prototypes exist, and manufacturing is scheduled for late 2026 with deliveries from early 2027.

**The offer.** Entry price is $499 (keyboard only, deposit today) up to $1,999 for the Pro bundle. Three key widths, sold by hand span:

| Model | For hand spans | What it opens up |
|---|---|---|
| DS5.5 | under 7.6 in | ninths and tenths become comfortable |
| DS6.0 | 7.6 to 8.5 in | octaves easy, ninths and tenths without stretching |
| DS6.5 | over 8.5 in | conventional concert-grand width |

**Who these emails go to.** 507 people who left their email with us and show at least one purchase-intent signal (intent-score tags, an old lead-magnet download, joined a waitlist, claimed an offer, or hit checkout in the last 120 days). Explicitly **not** existing buyers, not suppressed addresses, not test accounts. These are warm prospects who have not bought.

**The goal.** Move considerers to a reservation by being genuinely useful. Six of the eight emails give something away and only the last one, plus the coupon, asks for the sale.

**The voice.** Lionel writes as "I" in first person. He is a piano teacher and YouTuber who became a manufacturer because people kept telling him the instrument did not fit their hands. He is warm, plain-spoken, a little self-deprecating, and never hypey. He does not use exclamation marks much and does not say "game-changing".

**Format.** All nine emails (8 scheduled plus the coupon) share one dark, gold-accented HTML layout: a `D R E A M P L A Y` wordmark, a small uppercase eyebrow line, a headline, two body paragraphs, a gold button, closing paragraph, then the signature. 640px table layout, Helvetica/Arial only. Every email signs off:

> Lionel Yu
> Founder, DreamPlay Pianos

**Technical constraints a rewrite must respect:**

- `{{first_name}}` and `{{discount_code}}` are merge tags and must stay intact and spelled exactly that way.
- Every link must point at a `www.dreamplaypianos.com` page. External destinations (YouTube, Dropbox) are invisible to our click tracking, which is append-mode with no redirects, so they are not allowed.
- No `▶` or other glyphs in buttons: Gmail renders them as giant emoji.
- Keep emails short. One idea per email.
- Subject lines under about 60 characters so they do not truncate on mobile.
- **Do not promise anything that does not exist yet.** This is what killed the printable hand guide email.

---

## 2. The schedule

Eight emails, Tuesdays / Thursdays / Sundays, all at 9:00 AM Eastern by default. Editable per email at `/admin/marketing-calendar`.

| # | Date | Day | Topic | Subject |
|---|---|---|---|---|
| 01 | 2026-08-13 | Thu | Benefits of narrow keys | A ninth should not feel like a stretch |
| 02 | 2026-08-16 | Sun | Founder story | Why I started building pianos |
| 03 | 2026-08-18 | Tue | The research | The research that convinced me |
| 04 | 2026-08-20 | Thu | Which size fits your hands | How to tell which key size fits your hand |
| 05 | 2026-08-23 | Sun | Hardware specs | Under the lid: what it is made of |
| 06 | 2026-08-25 | Tue | LED guided learning | I was skeptical about the light-up keys |
| 07 | 2026-08-27 | Thu | Production progress | The first prototypes are finally here |
| 08 | 2026-08-30 | Sun | Reserve yours | Ready to pick yours? |
| — | automatic | — | **$100 coupon (behavioral trigger)** | {{first_name}}, here is $100 off |

The ninth email is not on the calendar. It fires automatically for anyone who opens 3 or more of the above but has not purchased 3 days later. See section 5.

---

## 3. The eight calendar emails

### 01 — Benefits of narrow keys · Thu Aug 13

- **Subject:** A ninth should not feel like a stretch
- **Preheader:** Why octave chords and tenths are hard on a standard keyboard, and what changes when they are not.
- **Eyebrow:** The DreamPlay One
- **Headline:** A ninth should not feel like a stretch
- **Body 1:** Hi {{first_name}}, here is a thing almost nobody says out loud about piano. A standard octave is 6.5 inches wide. If your hand spans 7.5 inches, an octave chord is fine but a ninth is right at your limit, and a tenth is off the table unless you roll it. Broken octaves in the left hand start to ache after a page. None of that is a technique problem.
- **Body 2:** The DreamPlay One comes in narrower widths, so the same interval takes less reach. On a DS5.5 the octave is 5.54 inches, which is about what a seventh costs you on a standard keyboard. A whole diatonic step of reach, given back on every chord. The notes you have been rolling or leaving out are simply there.
- **Button:** See Why Narrow Keys Work → `/why-narrow`
- **Closing:** If you have spent years assuming you just needed to practice the stretch more, it is worth reading.

> **Numbers verified** against the spec table on `/product-information`: octave width is 6.500 in (DS6.5), 6.000 in (DS6.0), 5.538 in (DS5.5). A standard white-key diatonic step is 6.5/7 = 0.929 in, so a standard seventh spans 5.571 in. The DS5.5 octave at 5.538 in is therefore just inside a standard seventh, which is what the copy now claims. An earlier draft said "where a sixth used to be" and was overstating it by a full step.

### 02 — Founder story · Sun Aug 16

- **Subject:** Why I started building pianos
- **Preheader:** I taught piano for years before I ever thought about manufacturing one.
- **Eyebrow:** From me
- **Headline:** Why I started building pianos
- **Body 1:** Hi {{first_name}}, if you have followed my channel for a while, you know the piano has been my whole life. What you may not know is how many people wrote to me over the years saying the same thing: I love this instrument, but my hands are too small for it.
- **Body 2:** At some point I stopped treating that as a sad fact and started treating it as a design problem. DreamPlay is my answer: an instrument company that fits the piano to the player instead of the other way around. We are a small team building something the big manufacturers decided was not worth their time.
- **Button:** Read Our Story → `/our-story`
- **Closing:** Thank you for being here while we build it. It means more than you know.

### 03 — The research · Tue Aug 18

- **Subject:** The research that convinced me
- **Preheader:** Hand span data, key width, and the studies I read before building anything.
- **Eyebrow:** The research
- **Headline:** The research that convinced me
- **Body 1:** Before I built anything, I spent months reading the research on hand span and key width. One study in Applied Ergonomics measured pianists moving from standard keys to a 5.5 inch octave and found lower muscular effort and less perceived strain. Another found that the internationally acclaimed women pianists tend to be the ones with larger hands, which says something uncomfortable about who the repertoire was written for.
- **Body 2:** So the strain is not a character flaw and it is not a technique problem. The standard advice for a century has been to practice harder or pick easier repertoire. I have put the studies on one page if you want to see what convinced me.
- **Button:** Read the Research → `/hidden-barrier`
- **Closing:** The short version: the instrument was standardized around one hand size, and it was not the average one.

> **Rewritten to match the real citations.** A draft of this email claimed "a majority of adult women, and nearly every child, have hands too small", which nothing on our site supports. The two studies now referenced are the ones actually cited on the research page: Applied Ergonomics 2021 (reduced muscular effort and perceived strain at a 5.5 in octave) and Susan Tomes on hand size among acclaimed women pianists. Both are linked from `/hidden-barrier`. If a reviewer wants a headline statistic here, someone needs to pull a real one from the PASK or ResearchGate hand-span sources rather than inventing it.

### 04 — Which size fits your hands · Thu Aug 20

- **Subject:** How to tell which key size fits your hand
- **Preheader:** Measure your span, then see which of the three key widths matches it.
- **Eyebrow:** Find your size
- **Headline:** How to tell which key size fits your hand
- **Body 1:** I get this question constantly, so I want to answer it properly. Measure your hand span: thumb tip to little finger tip, stretched out flat, in inches. That single number tells you most of what you need to know.
- **Body 2:** Under 7.6 inches and standard keys are genuinely too wide for you, which is what the DS5.5 is for. Between 7.6 and 8.5 the DS6.0 is the comfortable middle. Above that, your hands fit the historical standard and the DS6.5 gives you conventional width. There is a calculator on our site that walks through it and tells you which intervals open up at each size.
- **Button:** Check Your Hand Span → `/how-it-works`
- **Closing:** If your number is close to a boundary, reply and tell me what it is. I will give you my honest opinion.

> This email replaced revision 1's printable-hand-guide email. The thresholds quoted here are taken from the live calculator on `/how-it-works`, so they are accurate as long as that calculator does not change.

### 05 — Hardware specs · Sun Aug 23

- **Subject:** Under the lid: what it is made of
- **Preheader:** Weighted hammer action, three key widths, and the full specification.
- **Eyebrow:** Under the lid
- **Headline:** Under the lid: what it is made of
- **Body 1:** A piano with narrower keys only matters if it still feels like a real piano. So the action was the part we spent the most time on: fully weighted hammer action, on keybeds we had custom steel tooling made for. Narrow keys are not the hard part. Narrow keys that still feel right under your fingers is the hard part.
- **Body 2:** The rest of the specification is on one page: dimensions, the key action, connectivity, what comes in each bundle. Worth a look if you want to know what you are actually getting before you commit to anything.
- **Button:** See the Full Specs → `/product-information`
- **Closing:** If you are the kind of person who reads the spec sheet before the brochure, this page is for you.

> **Corrected before sending.** A draft said the action was "graded so the bass is heavier than the treble". The spec table on `/product-information` lists the DreamPlay One as **Weighted Hammer Action** and only the **Pro** as **Graded Hammer Action**, so that sentence was describing a different product. The graded claim is removed.

### 06 — LED guided learning · Tue Aug 25

- **Subject:** I was skeptical about the light-up keys
- **Preheader:** Why a piano teacher ended up putting LEDs in his own instrument.
- **Eyebrow:** Guided learning
- **Headline:** I was skeptical about the light-up keys
- **Body 1:** I will be honest, light-up keys were not my idea of a serious instrument. I taught piano for years and my instinct was that anything that tells you which note to press is a shortcut around actually learning to read.
- **Body 2:** What changed my mind was watching beginners quit. Not because piano is too hard, but because week one is spent decoding notation instead of making any music at all. The LEDs get you playing something recognisable on the first evening, and then you use them less and less as reading catches up. I would not have added them if they let you skip learning. They just get you past the part where most people give up.
- **Button:** See How Guided Learning Works → `/learn`
- **Closing:** Every DreamPlay One has it, and you can leave it switched off forever if you would rather.

> **Verify with Lionel:** this email puts words in his mouth about having been a skeptic. The reviewer suggested exactly this angle, but it is only usable if it is true. If he was never skeptical, this needs rewriting rather than shipping as a fabricated conversion story.

### 07 — Production progress · Thu Aug 27

- **Subject:** The first prototypes are finally here
- **Preheader:** Where production stands, including the parts that have taken longer than I expected.
- **Eyebrow:** Behind the scenes
- **Headline:** The first prototypes are finally here
- **Body 1:** For anyone quietly watching and wondering whether this is real: the first DreamPlay One prototypes have come off the line. We started with a factory partnership in June last year, and after fourteen months of drawings, tooling and revisions, sitting down at one and playing it was a strange feeling.
- **Body 2:** I have put the whole timeline on one page, including the parts that have taken longer than I expected. Custom steel molds, electronics integration, the revisions we did not plan for. If you are considering a reservation, you should be able to see exactly where things stand first.
- **Button:** Follow the Production Timeline → `/production-timeline`
- **Closing:** Manufacturing is where the schedule slips, so I would rather you hear it from me than wonder.

> **Corrected before sending.** A draft said "after two years". The timeline page dates Project Kickoff and the factory partnership to **June 2025**, which is fourteen months, so the copy now says that.

### 08 — Reserve yours · Sun Aug 30

- **Subject:** Ready to pick yours?
- **Preheader:** Choose your key size and finish, and reserve with a deposit.
- **Eyebrow:** Reserve yours
- **Headline:** Ready to pick yours?
- **Body 1:** Over the last few weeks I have shown you why the keys are narrower, the research behind it, how to work out your size, what the action feels like, and where production actually stands. If it sounds like the instrument you have been waiting for, here is how to get one.
- **Body 2:** The configurator takes about two minutes: pick your key size, pick your finish, see what it looks like. The keyboard is $999 in total, split as $499 today and $500 when yours is boxed and ready to ship, and reserving now locks in the founder price.
- **Button:** Build Your DreamPlay One → `/customize`
- **Closing:** Still unsure about sizing, shipping, or anything else? Reply to this email. I answer these myself and I would rather talk it through than have you guess.

> **Corrected before sending.** A draft said "$499 down", which reads as the whole price. The shop config prices the keyboard at $999 total: "Pay $499 today, then $500 when your piano is boxed and ready to ship", with a "Founder price lock" in the included list, so the copy now states the split. The unverifiable claim that reservations "are filled in order" was removed rather than guessed at.

> **Delivery date, resolved 2026-08-12.** The public target is **August 2027**, with **January 2027** the earliest for early backers. Stale "October 2026" strings on secondary pages were corrected sitewide. This email still deliberately states no date, so an editor may add "August 2027" if they want the specificity, but it must be that date and not one invented to sound nearer.

---

## 4. The $100 coupon email (automatic trigger)

Sent automatically, not on the calendar. See section 5 for the rule that fires it. Contains a gold-bordered code panel between the body copy and the button.

**This email was rewritten from scratch in revision 2.** The old version was subject-lined "$100 off, because you have been paying attention" and opened "You have been opening my emails and reading about the DreamPlay One". The reviewer's verdict was blunt and correct: that reads as surveillance. People vaguely know email tracking exists, but they do not want a company to turn around and announce that it counted their opens. **The trigger is behavioral; the email must not say so.**

- **Subject:** {{first_name}}, here is $100 off
- **Preheader:** In case you have been thinking about a DreamPlay One.
- **Eyebrow:** $100 off
- **Headline:** {{first_name}}, here is $100 off
- **Body 1:** I wanted to send you something in case you have been thinking about getting a DreamPlay One.
- **Body 2:** Here is $100 off. No promotion, no countdown, and it does not expire on you.
- **Code panel:**
  - Label: Your discount code
  - Code: `{{discount_code}}`
  - Note: Enter it at checkout, or use the button below and it applies itself.
- **Button:** Use My $100 Off → `/customize`
- **Closing:** And if the thing holding you back is not the price, reply and tell me what it is. I answer these myself.

**Standing rule for anyone editing this email:** do not reintroduce any reference to the recipient's engagement, open counts, or any "because you..." construction explaining why they received it. It must read as a spontaneous offer. This rule is also written into the code comments above the template.

One open question: "it does not expire on you" is a promise. It is true as written, because no expiry is set in Shopify, but if an expiry is ever added the copy has to change with it.

---

## 5. How the coupon trigger works

The rule: **if someone opens 3 or more of the marketing emails above but has not purchased, wait 3 days, then send them the $100 coupon once.** They keep receiving every scheduled calendar email as well. The coupon is additive, never a replacement.

Details that matter for reviewing the copy:

- **"Opened 3 emails" means 3 different emails**, not 3 pixel loads. Our open endpoint writes a row per hit with no dedup, so Gmail's image proxy and repeat inbox views would otherwise hand out coupons to people who opened one email a few times.
- Opens from security scanners and link expanders are filtered out by user agent. Gmail's image proxy is deliberately **not** filtered, since it fetches because a human opened the message.
- **The 3-day clock starts at the third open**, the moment they became engaged, not at the first email.
- Opens older than 45 days stop counting, so someone who read three emails months ago and went quiet does not get a coupon out of nowhere.
- **Purchase is checked against the analytics purchase events and the buyers table**, so anyone who buys in the meantime drops out of the queue automatically.
- **One coupon per person, ever**, enforced at the database level, so a retry or a second sweep cannot double-send.
- Suppressed and unsubscribed addresses are excluded, as is anyone manually removed from the audience.
- A sweep runs daily at 10:00 AM Eastern, an hour after the usual send slot, capped at 40 coupons per day as a blast-radius guard.

**Two gates, both required, and it ships with both closed:**

1. A master switch, which ships **off**.
2. A discount code. The Shopify code must be created by hand in the Shopify admin (Discounts → amount off order → $100) and pasted into `/admin/marketing-calendar/coupon`. Our Shopify API token has no `write_discounts` scope, so nothing in the code can mint codes. **The trigger refuses to send while no code is saved.** Recommendation: limit the code to one use per customer in Shopify so it cannot be shared around.

---

## 6. Quick reference: every subject line and button

| # | Subject | Button |
|---|---|---|
| 01 | A ninth should not feel like a stretch | See Why Narrow Keys Work |
| 02 | Why I started building pianos | Read Our Story |
| 03 | The research that convinced me | Read the Research |
| 04 | How to tell which key size fits your hand | Check Your Hand Span |
| 05 | Under the lid: what it is made of | See the Full Specs |
| 06 | I was skeptical about the light-up keys | See How Guided Learning Works |
| 07 | The first prototypes are finally here | Follow the Production Timeline |
| 08 | Ready to pick yours? | Build Your DreamPlay One |
| Coupon | {{first_name}}, here is $100 off | Use My $100 Off |

---

## 7. What we would most like reviewed this round

1. **Is the voice fixed, or just differently artificial?** Revision 1's failure was polish: perfect hooks, tidy rule-of-three constructions, quotable closing lines. Revision 2 tried to remove those. Point at any sentence Lionel would not spontaneously type into Gmail.
2. **Email 06 needs Lionel's sign-off, not an editor's.** It has him confessing he was skeptical of light-up keys. That was the previous reviewer's own suggested angle and it is the most human email in the set, but it is only usable if it is actually true of him. If it is not, it is a fabricated conversion story and has to be rewritten.
3. **Cadence.** Eight emails in 18 days, Thursday / Sunday / Tuesday and around. Still too much from a piano manufacturer, or about right now that each one has a reason to exist?
4. **Is email 08 commercial enough?** It is the only scheduled email that asks for the sale. It now states the full $999 price and the deposit split.
5. **The coupon email.** It is now deliberately plain, four short sentences. Too plain, given it is giving away $100?
6. **Should email 08 state the delivery date at all?** It currently does not. The real answer is August 2027 for a new reservation (January 2027 was only ever the early-backer date). That is eleven months out, which is honest but a long wait to put in writing next to a "reserve now" button. Editor's judgement: state it plainly, or let the configurator page do it?

**On factual claims.** Four passages in revision 2 were caught and corrected against the real product pages before anything sent: the DS5.5 interval comparison (was overstated by a full diatonic step), a graded-action claim that actually describes the Pro model, a "two years" that is fourteen months, and a "$499 down" that hid the $999 total. Each is documented in a note under its email in section 3. The lesson worth carrying: this copy is persuasive enough that a wrong number reads as confidently as a right one, so every figure needs checking against `/product-information`, `/production-timeline` or `config/shop.ts` rather than trusted because it sounds plausible.

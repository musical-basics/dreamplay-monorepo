# DreamPlay Marketing Emails — Full Copy Inventory for Review

> **Purpose:** hand every word of the August 2026 nurture sequence to a copy editor (human or AI) for review and rewrite. This is the live copy as of 2026-08-11. Nothing here has been sent yet.
>
> **Hard house rule for any rewrite: no em dashes anywhere.** Use commas, colons or periods instead. The existing copy follows this rule, so keep it that way.

---

## 1. Context the editor needs

**The company.** DreamPlay Pianos builds the DreamPlay One, a digital piano with narrower-than-standard keys and an LED guided learning system. The founder is Lionel Yu, who is also the face of the MusicalBasics YouTube channel. The instrument does not ship yet: 64 people have pre-ordered, first prototypes exist, and manufacturing is scheduled for late 2026 with deliveries from early 2027.

**The offer.** Entry price is $499 (keyboard only, deposit today) up to $1,999 for the Pro bundle. Three key sizes: DS5.5 and DS6.0 (narrow) plus conventional width.

**Who these emails go to.** 507 people who left their email with us and show at least one purchase-intent signal (intent-score tags, downloaded the printable hand guide, joined a waitlist, claimed an offer, or hit checkout in the last 120 days). Explicitly **not** existing buyers, not suppressed addresses, not test accounts. These are warm prospects who have not bought.

**The goal.** Move considerers to a reservation, by being genuinely useful rather than pushy. Nine of the eleven emails give something away (research, a printable guide, practice advice, specs, the story) and only the last one and the coupon ask for the sale directly.

**The voice.** Lionel writes as "I" in first person. He is a piano teacher and YouTuber who became a manufacturer because people kept telling him the instrument did not fit their hands. He is warm, plain-spoken, a little self-deprecating, and never hypey. He does not use exclamation marks much, does not say "game-changing", and is comfortable admitting delays and doubts.

**Format.** All eleven emails share one dark, gold-accented HTML layout: a `D R E A M P L A Y` wordmark, a small uppercase eyebrow line, a headline, two body paragraphs, a gold button, closing paragraph(s), then the signature. 640px table layout, Helvetica/Arial only. Every email signs off:

> Lionel Yu
> Founder, DreamPlay Pianos

**Technical constraints a rewrite must respect:**

- `{{first_name}}` and `{{discount_code}}` are merge tags and must stay intact and spelled exactly that way.
- Every link must point at a `www.dreamplaypianos.com` page. Links to YouTube or Dropbox are invisible to our click tracking (we use append-mode tracking with no redirects), so external destinations are not allowed.
- No `▶` or other glyphs in buttons: Gmail renders them as giant emoji.
- Keep emails short. One idea per email.
- Subject lines should stay under about 60 characters so they do not truncate on mobile.

---

## 2. The schedule

Ten emails, Tuesdays / Thursdays / Sundays, all at 9:00 AM Eastern by default. Editable per email at `/admin/marketing-calendar`.

| # | Date | Day | Topic | Subject |
|---|---|---|---|---|
| 01 | 2026-08-13 | Thu | Benefits of narrow keys | What happens when the keys finally fit |
| 02 | 2026-08-16 | Sun | The research | The research that started all of this |
| 03 | 2026-08-18 | Tue | Hand guide download | Print this, then place your hand on it |
| 04 | 2026-08-20 | Thu | Practice tips | Practice less, improve more |
| 05 | 2026-08-23 | Sun | Relaxation | The twenty minutes that reset your whole day |
| 06 | 2026-08-25 | Tue | Hardware specs | Under the lid: the DreamPlay One, spec by spec |
| 07 | 2026-08-27 | Thu | LED guided learning | Learn songs with the lights on |
| 08 | 2026-08-30 | Sun | Founder story | Why I started building pianos |
| 09 | 2026-09-01 | Tue | Production progress | The first prototypes exist. I have held them. |
| 10 | 2026-09-03 | Thu | Choosing your size | Which DreamPlay One is yours? |
| — | automatic | — | **$100 coupon (behavioral trigger)** | $100 off, because you have been paying attention |

The eleventh email is not on the calendar. It fires automatically for anyone who opens 3 or more of the above but has not purchased 3 days later. See section 5.

---

## 3. The ten calendar emails

### 01 — Benefits of narrow keys · Thu Aug 13

- **Subject:** What happens when the keys finally fit
- **Preheader:** Chords you could never reach become comfortable. Same music, without the fight.
- **Eyebrow:** The DreamPlay One
- **Headline:** What happens when the keys finally fit
- **Body 1:** Hi {{first_name}}, most pianos come in exactly one size. If your hands are on the smaller side, that has meant years of stretching, straining and leaving notes out, and probably blaming yourself for all of it.
- **Body 2:** The DreamPlay One is built around narrower keys, sized for real hands instead of the largest ones. Chords you could never reach become comfortable. Passages that always broke down start to flow. It is the same music, just without the fight.
- **Button:** See Why Narrow Keys Work → `/why-narrow`
- **Closing:** If you have ever wondered whether the problem was you or the instrument, I can tell you now: it was never you.

### 02 — The research · Sun Aug 16

- **Subject:** The research that started all of this
- **Preheader:** Hand span, key width, and why so many players struggle with an instrument made for someone else.
- **Eyebrow:** The science
- **Headline:** The research that started all of this
- **Body 1:** Before I built anything, I spent months in the research on hand span and key width. What I found honestly upset me: for a large share of players, especially women and children, a conventional keyboard is simply too wide to play in comfort.
- **Body 2:** That mismatch shows up as strain, missed notes and sometimes injury, and for a century the industry answer has been to practice harder. We took the other route and changed the instrument instead. I put the studies and the numbers on one page so you can see them for yourself.
- **Button:** Read the Research → `/hidden-barrier`
- **Closing:** Five minutes with this page explains the DreamPlay One better than anything else I could write.

### 03 — Hand guide download · Tue Aug 18

- **Subject:** Print this, then place your hand on it
- **Preheader:** Our free 1:1 printable hand guide shows you exactly which key size fits your hands.
- **Eyebrow:** Free printable guide
- **Headline:** Print this, then place your hand on it
- **Body 1:** The question I get most, every single day: how do I know which key size fits my hand? So we made the answer physical. Our printable hand guide is a true 1:1 scale sheet. Print it, lay your hand flat on the paper, and it shows you which size matches your reach.
- **Body 2:** It takes two minutes and a regular printer, and it pairs with the hand span calculator on the same page. You will walk away knowing exactly which keyboard is the right home for your hands, before you spend a dollar.
- **Button:** Get the Hand Guide → `/how-it-works`
- **Closing:** Measure first. It is the most useful two minutes in this whole journey.

### 04 — Practice tips · Thu Aug 20

- **Subject:** Practice less, improve more
- **Preheader:** The practice habits that actually move the needle, from years of playing and teaching.
- **Eyebrow:** Practice, better
- **Headline:** Practice less, improve more
- **Body 1:** The biggest practice myth is that more hours automatically mean more progress. They do not. After years of playing and teaching, I can tell you that focused, comfortable practice beats long, tense practice every single time.
- **Body 2:** I wrote up the habits that actually move the needle: shorter sessions, slower tempos, real goals for each sitting, and an instrument that does not wear your hands out in the first ten minutes. Small changes, dramatic difference.
- **Button:** Read the Practice Guide → `/better-practice`
- **Closing:** Try even one of these this week and you will feel the difference at the keyboard.

### 05 — Relaxation · Sun Aug 23

- **Subject:** The twenty minutes that reset your whole day
- **Preheader:** Some of the best piano time has no goal at all.
- **Eyebrow:** Play to unwind
- **Headline:** The twenty minutes that reset your whole day
- **Body 1:** Not every session at the piano needs a goal. Some of the best time you will ever spend there is the kind where you sit down after a long day, play something slow, and feel your shoulders come down from your ears.
- **Body 2:** That only works when the instrument itself is comfortable: weighted keys that respond gently, a size that fits your hands, nothing pulling you out of the moment. That is the experience the DreamPlay One is built for. Music as a place to rest, not one more thing to fight with.
- **Button:** Meet the DreamPlay One → `/`
- **Closing:** Whatever first brought you to the piano, I hope it gives you that kind of quiet.

### 06 — Hardware specs · Tue Aug 25

- **Subject:** Under the lid: the DreamPlay One, spec by spec
- **Preheader:** Weighted hammer action, three key sizes, LED guided learning. The full sheet.
- **Eyebrow:** Under the lid
- **Headline:** What the DreamPlay One is actually made of
- **Body 1:** A piano with narrower keys only matters if it still feels like a real piano. So we obsessed over the parts you touch: fully weighted hammer-action keys, custom steel tooling for the keybeds, and a cabinet that belongs in your living room, not a storage closet.
- **Body 2:** Every DreamPlay One carries the LED guided learning system and comes in three key sizes, including conventional width. I put the full specification on one page, from the key action to the dimensions, so you can inspect everything yourself.
- **Button:** See the Full Specs → `/product-information`
- **Closing:** If you are the kind of person who reads the spec sheet before the brochure, this page is for you.

> Note for the editor: the subject line and the headline say different things here ("Under the lid: the DreamPlay One, spec by spec" vs "What the DreamPlay One is actually made of"). That was deliberate, to avoid repeating the subject at the top of the email, but check that it does not feel disjointed.

### 07 — LED guided learning · Thu Aug 27

- **Subject:** Learn songs with the lights on
- **Preheader:** How the LED guided learning system gets you playing real music on day one.
- **Eyebrow:** Guided learning
- **Headline:** Learn songs with the lights on
- **Body 1:** The fastest way to lose a new player is week one: staring at sheet music that might as well be another language, not sure which key to press. The DreamPlay One takes that wall down. The LED guided learning system lights the way, so you are playing real music on day one.
- **Body 2:** It is not a replacement for learning, it is a bridge to it. As you improve you lean on the lights less and read more. Beginners get momentum, returning players get their confidence back, and kids get hooked instead of frustrated.
- **Button:** See How Guided Learning Works → `/learn`
- **Closing:** Nobody ever quit piano because it was too fun on day one.

### 08 — Founder story · Sun Aug 30

- **Subject:** Why I started building pianos
- **Preheader:** A note from Lionel about the people who inspired DreamPlay.
- **Eyebrow:** From Lionel
- **Headline:** Why I started building pianos
- **Body 1:** Hi {{first_name}}, if you have followed my channel for a while, you know the piano has been my whole life. What you may not know is how many people wrote to me over the years saying the same thing: I love this instrument, but my hands are too small for it.
- **Body 2:** At some point I stopped treating that as a sad fact and started treating it as a design problem. DreamPlay is my answer: an instrument company that fits the piano to the player instead of the other way around. We are a small team building something the big manufacturers decided was not worth their time.
- **Button:** Read Our Story → `/our-story`
- **Closing:** Thank you for being here while we build it. It means more than you know.

> Note for the editor: the preheader refers to Lionel in the third person while the body is first person. Intentional (the preheader reads like a label) but worth a second look.

### 09 — Production progress · Tue Sep 1

- **Subject:** The first prototypes exist. I have held them.
- **Preheader:** A look inside DreamPlay production, delays and all.
- **Eyebrow:** Behind the scenes
- **Headline:** The first prototypes exist, and I have held them
- **Body 1:** For everyone quietly watching and wondering whether this is real: the first DreamPlay One prototypes have come off the line, and holding one after all the drawings, tooling and testing was one of the best moments of my life.
- **Body 2:** From custom steel molds to electronics integration, the whole journey is documented on our production timeline: what is finished, what is in progress, and what still stands between us and your doorstep. I keep it honest, delays included.
- **Button:** Follow the Production Timeline → `/production-timeline`
- **Closing:** Building an instrument company in public is terrifying and wonderful. Come look over my shoulder.

### 10 — Choosing your size · Thu Sep 3

- **Subject:** Which DreamPlay One is yours?
- **Preheader:** DS5.5, DS6.0 or conventional width: two minutes in the configurator answers it.
- **Eyebrow:** Find your fit
- **Headline:** Which DreamPlay One is yours?
- **Body 1:** Every DreamPlay One starts with one decision: your key size. DS5.5 for smaller hands, DS6.0 for players who feel cramped on conventional keys, and full conventional width if you simply want the guided learning and the build quality.
- **Body 2:** The configurator walks you through it in about two minutes: pick your size, pick your finish, and see exactly what your instrument will look like. Reserving now puts you in the earliest production run.
- **Button:** Build Your DreamPlay One → `/customize`
- **Closing:** Not sure about size? Reply to this email and I will help you decide personally.

---

## 4. The $100 coupon email (automatic trigger)

Sent automatically, not on the calendar. See section 5 for the rule that fires it. This one contains a gold-bordered code panel between the body copy and the button.

- **Subject:** $100 off, because you have been paying attention
- **Preheader:** A thank you for following along, and $100 off your DreamPlay One if you are ready.
- **Eyebrow:** $100 off, just for you
- **Headline:** I saved you $100, {{first_name}}
- **Body 1:** You have been opening my emails and reading about the DreamPlay One, which tells me something about it is speaking to you. You just have not pulled the trigger yet, and honestly, I get it. This is a new instrument from a small company, and that takes a leap.
- **Body 2:** So let me make the leap smaller. Here is $100 off your DreamPlay One, from me. Use it whenever you are ready.
- **Code panel:**
  - Label: Your discount code
  - Code: `{{discount_code}}`
  - Note: Enter it at checkout, or use the button below and it applies itself.
- **Button:** Use My $100 Off → `/customize`
- **Closing:** If something is holding you back that $100 will not fix, reply and tell me what it is. Sizing, shipping, whether it will suit your hands: I answer these myself and I would rather help you decide than have you wonder.

**Questions for the editor on this one specifically:**

1. Does "because you have been paying attention" read as thoughtful or as surveillance? It is honest about why they got the email, but it does tell someone we track their opens. An alternative framing would drop the reason entirely ("A $100 thank you").
2. Is "pulled the trigger" too casual, or does it fit Lionel's voice?
3. The email admits the reader has hesitated. That is intentional (it earns the discount and invites a reply) but it could also plant doubt. Worth a judgement call.
4. No expiry or scarcity language is used anywhere. That was deliberate, since Lionel's brand guidance avoids false urgency, but it does reduce response. If an expiry is added it has to be real and set in Shopify.

---

## 5. How the coupon trigger works

The rule, in plain terms: **if someone opens 3 or more of the marketing emails above but has not purchased, wait 3 days, then send them the $100 coupon once.** They keep receiving every scheduled calendar email as well. The coupon is additive, never a replacement.

The details that matter for reviewing the copy:

- **"Opened 3 emails" means 3 different emails**, not 3 pixel loads of the same one. Repeat opens of one email do not count, because Gmail's image proxy inflates raw counts.
- Opens from security scanners and link expanders are filtered out by user agent. Gmail's image proxy is deliberately **not** filtered, since it fetches because a human opened the message.
- **The 3-day clock starts at the third open**, the moment the person became engaged, not at the first email.
- Opens older than 45 days stop counting, so someone who read three emails last winter and went quiet does not get a coupon out of nowhere.
- **Purchase is checked against the analytics purchase events and the buyers table**, so anyone who buys in the meantime is dropped from the queue automatically.
- **One coupon per person, ever.** Enforced at the database level, so a retry or a second sweep cannot double-send.
- Suppressed and unsubscribed addresses are excluded, as is anyone Lionel manually removed from the audience.
- A sweep runs daily at 10:00 AM Eastern, one hour after the usual send slot, and is capped at 40 coupons per day as a blast-radius guard.

**Two things gate the whole thing:**

1. A master switch, which ships **off**.
2. A discount code. The Shopify code must be created by hand in the Shopify admin (Discounts, amount off order, $100) and pasted into `/admin/marketing-calendar/coupon`. Our Shopify API token has no `write_discounts` scope, so nothing in the code can mint discount codes. **The trigger refuses to send while no code is saved.** Recommendation: limit the code to one use per customer in Shopify so it cannot be shared around.

---

## 6. Quick reference: every subject line and button

| # | Subject | Button |
|---|---|---|
| 01 | What happens when the keys finally fit | See Why Narrow Keys Work |
| 02 | The research that started all of this | Read the Research |
| 03 | Print this, then place your hand on it | Get the Hand Guide |
| 04 | Practice less, improve more | Read the Practice Guide |
| 05 | The twenty minutes that reset your whole day | Meet the DreamPlay One |
| 06 | Under the lid: the DreamPlay One, spec by spec | See the Full Specs |
| 07 | Learn songs with the lights on | See How Guided Learning Works |
| 08 | Why I started building pianos | Read Our Story |
| 09 | The first prototypes exist. I have held them. | Follow the Production Timeline |
| 10 | Which DreamPlay One is yours? | Build Your DreamPlay One |
| Coupon | $100 off, because you have been paying attention | Use My $100 Off |

---

## 7. What we would most like reviewed

1. **Does this read as one person, or as a campaign?** The failure mode we are trying to avoid is copy that explains its own logic out loud, flatters generically, and lands every paragraph at exactly the same length. If any of these eleven slip into that, say which.
2. **Sequence and pacing.** Eleven emails in three weeks to warm prospects. Is the order right? Should the founder story (08) come earlier, before we ask for anything? Is five emails before any real product detail too many, or exactly right?
3. **The single ask.** Only email 10 and the coupon ask for a reservation. Is that too passive for a list of people who are actively considering buying?
4. **Subject lines.** Which would you not open?
5. **The coupon email specifically.** See the four questions in section 4.
6. **Anything that sounds like AI wrote it.** Particularly stock transitions, tidy rule-of-three lists, and any sentence that could appear in any company's email.

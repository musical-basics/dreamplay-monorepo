# The "Love" angle: every word, for copy review

> **Purpose:** hand the complete Love-arm copy (website page + 8 emails) to an
> editor for a humanising pass. The brief is: **make it sound like a person
> wrote it, not an AI.**
>
> **Status:** this copy is LIVE on the site (variants 7a/7b at `/play-again`)
> and seeded as 16 email drafts. The first email sends **Tue 18 Aug 2026, 9 AM
> ET**, automatically. Edits are cheap before then and impossible after a slot
> sends.
>
> Test context: [AB-TEST-LOVE-VS-SPEC.md](AB-TEST-LOVE-VS-SPEC.md).
> Prior review of the other arm's copy: [MARKETING-EMAILS-DRAFTED.md](MARKETING-EMAILS-DRAFTED.md).

---

## 1. What the editor needs to know

**The company.** DreamPlay Pianos builds the DreamPlay One, a digital piano
with narrower than standard keys and an LED guided learning system. The founder
is Lionel Yu, who is also the face of the MusicalBasics YouTube channel. The
instrument does not ship yet: 64 people have pre-ordered and the first
prototypes exist. Public delivery target is **May 2027**.

**The angle being tested.** Everything in this document is the "love" arm of a
2x2 test. The other arm sells specifications, research and geometry. This arm
sells **the music itself**: playing the pieces you always wanted to play, and
coming back to an instrument you gave up on. It is aimed at a specific person.

**Who that person is** (from a survey of our own buyers, n=18):

- **59% are 45 or older.** 45 to 59 is the single largest bracket. This is not
  a youth product and not a family product. Nobody is buying for a child.
- **"Returning after years away" is the largest experience group.** These are
  people who stopped playing and want back in.
- **15 of 18 cannot comfortably reach an octave.** Seven "barely", eight "with
  some strain".
- They are not motivated by becoming concert pianists, by their kids, or by
  millimetre specifications. They are motivated by the feeling that
  **something they were previously blocked from is now unblocked**.

The archetype is a real customer: 64, playing since 15, a progressive
connective-tissue condition, a 7 inch left-hand reach. He owns an acoustic
upright he cannot play as written. He did not lose the ability to want to
play. He lost the ability to play what he wants.

**The voice.** Lionel writes as "I", first person. He is a piano teacher and
YouTuber who became a manufacturer because people kept telling him the
instrument did not fit their hands. Warm, plain-spoken, a little
self-deprecating, never hypey. Not many exclamation marks. He does not say
"game-changing".

---

## 2. What "less AI-ish" means here, specifically

The other arm's copy went through this exact review once already. The verdict
was that the strategy was sound but half of it read as **"a very good
copywriter impersonating Lionel"** rather than Lionel actually emailing
people. These are the failure patterns that were found and removed then, and
they are the ones to hunt for here:

- **Tidy rule-of-three constructions.** Three escalating clauses in a row is a
  copywriter's tic, not a person's speech.
- **Quotable closing aphorisms.** Lines engineered to be screenshotted. Real
  emails end flatly. Deleted last time: "it was never you", "Music as a place
  to rest, not one more thing to fight with", "Nobody ever quit piano because
  it was too fun on day one", "Small changes, dramatic difference".
- **Business vocabulary.** "Move the needle" is banned from DreamPlay's
  vocabulary entirely.
- **Perfect symmetry and polish.** Every paragraph the same length, every
  section landing its point cleanly. People are messier.
- **Emotional overreach.** This audience gave up something they loved. Copy
  that performs that feeling back at them will read as manipulation. Naming
  the experience plainly beats dramatising it.

**The test to apply to every sentence:** not "would Lionel say this?", which
is too permissive, but **"would Lionel spontaneously type this into Gmail if
there were no marketing campaign?"** If not, cut it.

Two places in this document are known to be the most "written" and are the
best places to start: the repertoire cards on the website (section 4.4) and
the closing lines of emails 01, 03 and 05.

---

## 3. Hard constraints a rewrite must not break

**Absolute rules:**

1. **NO EM DASHES ANYWHERE.** Not one. Use commas, colons or periods. This is
   the founder's hard rule and there is an automated guard that refuses to
   send any email containing one.
2. **`{{first_name}}` is a merge tag.** It must stay spelled exactly that way
   or it renders as literal text in the inbox.
3. **Every link points at `www.dreamplaypianos.com`.** Click tracking is
   append-mode with no redirects, so any external destination (YouTube,
   Dropbox) is invisible to us and is not allowed.
4. **Do not promise anything that does not exist.** This rule killed an entire
   email last round, which promised a printable hand guide we had not made.
5. **No real customer names, and no verbatim customer quotes.** The return
   stories on the website are deliberately paraphrased patterns, not people.
   Keep them that way.
6. **Subject lines under about 60 characters** so they do not truncate on
   mobile.
7. **Keep emails short.** One idea per email.

**Numbers and facts that must not drift.** These were each checked against the
product pages, and a wrong number reads exactly as confidently as a right one:

| Claim | Correct value |
|---|---|
| Total price of the keyboard | $999 (MSRP at launch $1,499) |
| Deposit, arm 7a | $499 today, $500 when it ships |
| Deposit, arm 7b | $249 today, $750 when it ships |
| Delivery estimate | May 2027 |
| DS5.5 | handspans under 7.6 inches |
| DS6.0 | handspans 7.6 to 8.5 inches |
| DS6.5 / standard | handspans over 8.5 inches |
| Factory partnership began | June 2025, so "fourteen months" |
| Action | weighted hammer action (graded action is the **Pro** only) |

The tenth claim in email 03 ("reaching a tenth takes less stretch than a ninth
does on standard keys") is arithmetically verified: a tenth on the DS5.5 spans
about 7.1 inches, a ninth on standard keys about 7.4. Keep the comparison or
cut it, but do not inflate it.

The handspan statistic on the website ("8.5 inches or more, leaving behind
most women and nearly a third of men") is long-standing copy that already
appears elsewhere on the site. Rephrasing is fine, changing the numbers is
not.

---

## 4. WEBSITE: the `/play-again` page

Live at `www.dreamplaypianos.com/play-again` (also reachable as `/7a` or
`/7b`, which additionally pin the visitor's test arm). Structure mirrors the
original DreamPlay homepage so that messaging, not design, is what differs
between test arms.

Copy is given verbatim below in page order. Headings marked **[structural]**
are layout labels; they can be reworded but something has to fill the slot.

### 4.1 Hero

- **H1:** Is the piano still fun?
- **Sub-line:** Play the pieces you always wanted to play.
- **Button:** Start Playing Again

> This is the single most important question on the page. The strategy note
> behind it: asking outright is likely stronger than any claim we could make,
> because for this cohort the honest answer is "no, not really, not anymore",
> and that is the opening.

### 4.2 Recognition section

- **H2:** There was a point where you slowed down.
- **Body:** Not because you stopped loving the music. Playing simply stopped
  being enjoyable. The pieces you wanted stayed out of reach, practice turned
  into strain, and you assumed that was what getting older meant.
- **Overlay card H3:** It was never effort.
- **Overlay card body:** The barrier was geometry. The standard piano key was
  sized for one hand size, and it was not yours. Traditional keyboards fit
  handspans of 8.5 inches or more, leaving behind most women and nearly a
  third of men.
- **Closing line:** You never lost the ability to want to play.
- **Button:** See Why Key Width Matters

### 4.3 Repertoire section

- **Eyebrow [structural]:** What Opens Up
- **H2:** The music comes back.
- **Intro:** On keys that fit your hand, the notes you have been rolling or
  leaving out are simply there.

Four cards:

| Card title | Card text |
|---|---|
| The tenth | Reach it as one chord, not a roll. The interval that was always half an inch too far sits under your hand. |
| The inner notes | Big chords stop being outer shells. The middle voices you used to drop are back under your fingers. |
| Grieg | "Wedding Day at Troldhaugen," played the way it is written, stretches and all. |
| Rachmaninoff | Written by a pianist with an enormous reach. Narrower keys bring his chords into yours. |

> **Most "written" part of the page.** These four cards are where the copy is
> most obviously composed. The underlying insight is real and came from
> buyers: one named Grieg's "Wedding Day at Troldhaugen" himself as the piece
> he has never been able to play as written. Worth making these sound like a
> pianist talking to another pianist rather than four parallel product
> benefits.

### 4.4 Sizing section

- **Eyebrow [structural]:** Three Key Widths
- **H2:** Find Your Perfect Fit.
- **Intro:** The number matters because of the music it unlocks. Measure your
  handspan, pick the width, and the repertoire follows.
- **Card 1 [structural]:** Piano DS5.5 / Perfect for handspans under 7.6 inches. / Zone A
- **Card 2 [structural]:** Piano DS6.0 / Perfect for handspans between 7.6-8.5 inches. / Zone B
- **Card 3 [structural]:** Standard Piano / Perfect for handspans over 8.5 inches. / Zone C

> The three cards are shared with other pages on the site. Only the intro line
> above them is Love-specific and freely editable.

### 4.5 Return stories section

- **Eyebrow [structural]:** Who Buys This Piano
- **H2:** Most of our buyers are coming back.
- **Intro:** Not beginners. People who played for years, stopped, and never
  quite stopped missing it. The same stories keep reaching us, in different
  words.

Three cards:

| Card title | Card text |
|---|---|
| The one who quit after school | They grew up assuming their hands would eventually grow into the keys. The hands never did, and after school the playing quietly ended. |
| The one who cut practice shorter | Every year the fingers and wrists ached a little sooner, so every year the sessions got a little shorter, until one year they stopped. |
| The one caught at the key edge | Octaves landed on the very edge of the keys, every time, for decades. At that stretch, accuracy at speed was never going to come, no matter how much they practiced. |

- **Closing line:** We are how people come back.

> Each card is a real pattern from real buyers, deliberately anonymised into a
> type. Keep them anonymous. The temptation an editor should resist is making
> these more novelistic; they work because they are recognisable, not because
> they are vivid.

### 4.6 Founder note

- **Eyebrow [structural]:** A Note From the Founder
- **Paragraph 1:** I am a piano teacher and a YouTuber. I never planned to
  become a manufacturer. But for years, people kept telling me the same thing:
  my hands are too small. I heard it so many times that I stopped believing
  the problem was the players.
- **Paragraph 2:** So I am building the piano I could not find, with keys
  sized for real hands, so nobody has to give up the music they love.
- **Signature:** Lionel, founder of DreamPlay

### 4.7 Reserve section

- **Headline:** Lock in the $999 Founder's Price
- **Body:** The DreamPlay One will launch at an MSRP of **$1,499**. Reserve
  yours now for $999 with free shipping, the lowest price we will ever offer.
  Every reservation is covered by a money-back guarantee any time before your
  piano ships. Estimated delivery: May 2027.
- **Button:** Reserve My Piano
- **Under button [structural]:** Available in White or Black

---

## 5. EMAILS: the 8-email Love sequence

Sent Tuesday / Thursday / Sunday at 9:00 AM ET, 18 Aug to 3 Sep 2026, to
around 250 warm prospects who have shown purchase intent but have not bought.
All eight share one dark, gold-accented HTML layout: wordmark, small uppercase
eyebrow, headline, body paragraphs, gold button, closing paragraph,
signature. Every email signs off:

> Lionel Yu
> Founder, DreamPlay Pianos

Six of the eight give something away. Only the last one asks for the sale.

### Email 01 (Tue 18 Aug) - the opening question

- **Subject:** Is the piano still fun?
- **Preheader:** An honest question about why you slowed down, and what it would take to enjoy playing again.
- **Eyebrow:** A question
- **Headline:** Is the piano still fun?
- **Body 1:** Hi {{first_name}}, I want to ask you something, and I mean it as a real question. Is the piano still fun? For a lot of people who once played seriously, the honest answer is: not really, not anymore. There was a point where you slowed down, and it was not because you stopped loving the music.
- **Body 2:** Playing stopped being enjoyable. The pieces you wanted stayed just out of reach, practice started to ache, and you assumed that was simply what getting older meant. I do not accept that, and it is why I build pianos. The barrier was never your effort. It was the width of the keys.
- **Button:** See the Piano Built for You
- **Closing:** You never lost the ability to want to play. That is worth taking seriously.

> The closing line is doing a lot of work and may be doing too much. Candidate
> for flattening.

### Email 02 (Thu 20 Aug) - founder story

- **Subject:** Why I started building pianos
- **Preheader:** I taught piano for years before I ever thought about manufacturing one.
- **Eyebrow:** From me
- **Headline:** Why I started building pianos
- **Body 1:** Hi {{first_name}}, if you have followed my channel for a while, you know the piano has been my whole life. What you may not know is how many people wrote to me over the years saying the same thing: I love this instrument, but my hands are too small for it.
- **Body 2:** At some point I stopped treating that as a sad fact and started treating it as a design problem. DreamPlay is my answer: a piano that fits your hands, so the music you love stops being off limits. Nobody should have to give up an instrument they love over the size of their hands.
- **Button:** Read Our Story
- **Closing:** Thank you for being here while we build it. It means more than you know.

> This email is shared with the other test arm apart from its second
> paragraph, which was reframed for Love. Keep any rewrite confined to the
> second paragraph and the arms stay comparable.

### Email 03 (Sun 23 Aug) - the repertoire email

- **Subject:** The pieces you always wanted to play
- **Preheader:** The tenth you roll, the inner notes you drop, and the piece you never quite got to play as written.
- **Eyebrow:** The music
- **Headline:** The pieces you always wanted to play
- **Body 1:** Every pianist has a list. The piece with the tenths you have always rolled. The chord where an inner note quietly gets dropped. One of our early customers named his: Wedding Day at Troldhaugen by Grieg, which has a stretch he has never been able to play as written. He ordered a DreamPlay so he finally can.
- **Body 2:** On keys that fit your hand, that list gets shorter fast. On the DS5.5, reaching a tenth takes less stretch than a ninth does on standard keys. The notes you have been rolling or leaving out are simply there.
- **Button:** What Would You Play First?
- **Closing:** Reply and tell me the piece you have always wanted to play. I read every one of these.

> The customer in body 1 is real and consented to nothing, so he stays
> unnamed. "Every pianist has a list" followed by two parallel sentences is
> the most copywriter-ish opening in the sequence.

### Email 04 (Tue 25 Aug) - sizing

- **Subject:** Which key size fits the music you love
- **Preheader:** Measure your span, then see which width puts your repertoire back within reach.
- **Eyebrow:** Find your size
- **Headline:** Which key size fits the music you love
- **Body 1:** The point of measuring your hand is not the number. It is what the number unlocks. Measure your span: thumb tip to little finger tip, stretched out flat, in inches. That one measurement tells you which keyboard puts your music back within reach.
- **Body 2:** Under 7.6 inches and standard keys are genuinely too wide for you, which is what the DS5.5 is for. Between 7.6 and 8.5 the DS6.0 is the comfortable middle. Above that, your hands fit the historical standard and the DS6.5 gives you conventional width. There is a calculator on our site that walks through it and tells you which intervals open up at each size.
- **Button:** Check Your Hand Span
- **Closing:** If your number is close to a boundary, reply and tell me what it is. I will give you my honest opinion.

### Email 05 (Thu 27 Aug) - you do not have to give up the piano

- **Subject:** You do not have to give up the piano
- **Preheader:** Most of our buyers are not beginners. They are people coming back.
- **Eyebrow:** Lifelong
- **Headline:** You do not have to give up the piano
- **Body 1:** Here is something that surprised me about the people who ordered a DreamPlay One. The single largest group is not beginners. It is people returning after years away: they played as students, and then strain, aching hands, or plain discouragement slowly pushed the piano out of their lives. Most of the buyers we surveyed cannot comfortably reach an octave on standard keys.
- **Body 2:** The piano is not an instrument you should have to retire from. Strain at a certain age gets read as the end of the road, but when the real cause is reach, a keyboard that fits your hand changes the story. This is an instrument you can enjoy for the rest of your life.
- **Button:** Come Back to the Piano
- **Closing:** If you stopped playing years ago, I would genuinely like to hear what stopped you. Reply and tell me.

> Emotionally the heaviest email in the sequence, and the one most at risk of
> reading as performed. Both body-2 sentences are arguable candidates for
> plainer phrasing.

### Email 06 (Sun 30 Aug) - hardware

- **Subject:** It still has to feel like a piano
- **Preheader:** Weighted hammer action on custom tooling, because the music deserves a real instrument.
- **Eyebrow:** Under the lid
- **Headline:** It still has to feel like a piano
- **Body 1:** Narrow keys only matter if the instrument still feels like a real piano under your fingers. That is where we spent most of our time: fully weighted hammer action, on keybeds we had custom steel tooling made for. Not a toy and not a compromise.
- **Body 2:** Because the goal is not novelty. The goal is that when you sit down to play the music you love, the instrument answers the way a piano should. The full specification is on one page if you want to look under the lid.
- **Button:** See What It Is Made Of
- **Closing:** If you are the kind of person who wants the details before the feelings, that page is for you.

### Email 07 (Tue 1 Sep) - production progress

- **Subject:** I finally sat down and played one
- **Preheader:** The first prototypes are off the line. Here is exactly where things stand.
- **Eyebrow:** Behind the scenes
- **Headline:** I finally sat down and played one
- **Body 1:** The first DreamPlay One prototypes have come off the line. We started with a factory partnership in June last year, and after fourteen months of drawings, tooling and revisions, sitting down at one and playing it was a strange feeling. This is real now.
- **Body 2:** I have put the whole timeline on one page, including the parts that have taken longer than I expected. If you are thinking about coming back to the piano on one of these, you deserve to see exactly where things stand first.
- **Button:** Follow the Production Timeline
- **Closing:** Manufacturing is where the schedule slips, so I would rather you hear it from me than wonder.

### Email 08 (Thu 3 Sep) - the ask

- **Subject:** Ready to play again?
- **Preheader:** Pick your key size and finish, and reserve the piano that fits your hands.
- **Eyebrow:** Reserve yours
- **Headline:** Ready to play again?
- **Body 1:** Over the last few weeks I have asked whether the piano is still fun, shown you the music that opens up on keys that fit, and told you where production actually stands. If some piece has been sitting in the back of your mind this whole time, here is how you get to play it.
- **Body 2, arm 7a:** The configurator takes about two minutes: pick your key size, pick your finish, see what it looks like. The keyboard is $999 in total, split as $499 today and $500 when yours is boxed and ready to ship, and reserving now locks in the founder price.
- **Body 2, arm 7b:** The configurator takes about two minutes: pick your key size, pick your finish, see what it looks like. The keyboard is $999 in total, and you can reserve yours for just $249 today: the remaining $750 is charged only when your piano is boxed and ready to ship. Reserving now locks in the founder price.
- **Button:** Build Your DreamPlay One
- **Closing:** Still unsure about sizing, shipping, or anything else? Reply to this email. I answer these myself and I would rather talk it through than have you guess.

> **This email exists in two versions**, identical except for the price
> paragraph, because the test also measures a $249 deposit against the current
> $499. Any rewrite of body 2 has to be done twice, changing only the money.

---

## 6. What we would most like reviewed

1. **Is the voice human, or just differently artificial?** Point at any
   sentence Lionel would not spontaneously type into Gmail.
2. **The repertoire cards** (4.3) and the **return stories** (4.5) are the two
   most composed passages on the website. Do they read as recognition or as
   marketing?
3. **Email 05** carries the most emotional weight of the eight. Does it land
   as honest, or as a company performing empathy at a 60 year old?
4. **The closing lines.** Every email ends on one. Last review found these
   were where the "impersonation" was thickest. Several here could probably
   just be deleted rather than improved.
5. **Cadence.** Eight emails in 17 days. Right, or too much?
6. **Repetition across the arc.** "The notes you have been rolling or leaving
   out are simply there" appears on both the website and in email 03. "You
   never lost the ability to want to play" appears on the website and in email
   01. Deliberate echo, or does it read as recycled?

---

## 7. How to return edits

Return the rewritten copy in this same structure, keeping the labels
(Subject / Preheader / Eyebrow / Headline / Body 1 / Body 2 / Button /
Closing) so it can be applied mechanically. Do not reformat into prose.

Applying edits, for whoever does it afterwards:

- **Website:** `apps/web/src/app/(website-pages)/play-again/page.tsx`.
- **Emails:** `scripts/email/setup-love-vs-spec-emails.mjs`, then re-run with
  `--rewrite`. It replaces draft copy only and refuses to touch anything
  already sent, so a slot that has gone out cannot be rewritten.
- **Deadline:** copy is frozen slot by slot as each email sends, starting
  09:00 ET on 18 Aug 2026. Anything not applied before a slot's send time is
  permanent for that email.

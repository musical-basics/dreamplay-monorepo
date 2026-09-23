# Skeptic series: five email drafts modelled on the one email that worked

**Date** 2026-09-23 · **Status** DRAFT, seeded to /admin/marketing-calendar, nothing scheduled to send · **Seed script** `scripts/email/setup-skeptic-series.mjs` · **Test copies** `scripts/email/send-test-copy.mjs`

## 1. Why these exist

In the Love-vs-Spec 2x2 (Aug 18 to Sep 1, 507 people, 7 sends) one email out-clicked
everything else by three times:

| send | subject | clicks |
|---|---|---|
| spec 6b, slot 06 | I was skeptical about the light-up keys | **12.4%** |
| spec 6a, slot 06 | I was skeptical about the light-up keys | 5.4% |
| love 7a / 7b, slot 06 (same day, same list) | It still has to feel like a piano | 2.6% / 3.4% |
| sequence average, all other sends | | about 2.5% |

Same day, same audience quality, same template. The difference was the shape of
the email. Every draft below reproduces that shape:

1. **A doubt Lionel genuinely held**, stated in the subject in the first person.
2. **Credentials that make the doubt credible** (taught piano for years, his own hands).
3. **One concrete observation that flipped it.** An observation, not an argument.
4. **A concession** that defuses the reader's own version of the objection.
5. **A CTA that promises to show something the email did not already give away.**
6. **A closing line that removes the last bit of risk.**

The 2x2's other emails failed on point 5: they delivered the whole argument in the
body, then asked the reader to click through to read it again.

## 2. What is different in the template

- **Mobile fix.** The 2x2 template was a fixed `width="640"` table with no
  `width:100%`; measured 642px wide in a 375px viewport, so phones (47% of the
  test's clicks) got a zoomed-out or clipped email. The new template uses
  `width="100%"` with `max-width:640px`, puts `class="pad"` on the CTA cell
  (missing in all 32 old templates), and makes the button full width under 620px
  so long labels wrap cleanly instead of squeezing.
  Measured: 360px document width at 375px, no overflow at 320px.
- **Second click surface.** Each closing paragraph carries an inline gold text
  link to the same page as the button. The 58%-click July update repeated its
  link three times; the 2x2 emails had exactly one.
- **One photo, once.** Email 04 carries the studio prototype photo (already
  hosted and proven in the July update), linked to the CTA. The other four are
  text only, like slot 06.
- **No `?v=` on links.** The 2x2 stamped an arm on every link. These are not
  part of that test, so the site assigns variants normally. If Lionel wants to
  push everyone to the winning offer (b, the $249 deposit), add `?v=6b` or
  `?v=7b` to every `ctaPath` in the seed script and `--rewrite`.

## 3. The five emails

Send keys `skeptic-2026-01` to `-05`, category `marketing-calendar`, status
draft, `scheduled_status` NULL. Dates are proposals only (Tuesdays, 9 AM ET,
Sep 29 to Oct 27) so the cards land somewhere sensible on the calendar.

### 01 · I was wrong about who this was for → /play-again

> **Preheader:** I built this with my students in mind. The people buying it are not who I pictured.
>
> Hi {{first_name}}, when I started building the DreamPlay One I had a clear picture of who it was for. I taught piano for years, and the students I watched struggle with wide intervals were mostly young, and mostly girls. So I pictured students, and the parents and teachers around them. I was wrong.
>
> This summer I asked the people who have already reserved one to tell me about themselves, and twenty-four wrote back. Twenty-three bought it for themselves, not for a child or a student. The largest group is between 45 and 59. A third are coming back to the piano after years away. Twenty of the twenty-four cannot reach an octave without strain. And many of them named the exact piece, or the exact chord, they had given up on.
>
> They were not describing an ambition. They were describing something they had lost.
>
> **[See What I Changed]**
>
> It changed how I talk about this instrument. The page I wrote afterwards does not open with a spec sheet. It opens with a question: _Is the piano still fun?_ (link)

**Sources.** Survey at n=24 (`buyer_survey_responses`, 2026-09-23): who_for Myself 23 / student 1; age 45 to 59 = 7 (largest); returning after years away 8 of 24; octave reach: with some strain 13 + barely 7 = 20. Students under 13 and female students: our-story page. The /play-again hero is "Is the piano still fun?".

### 02 · For the first few weeks, I was not convinced → /hidden-barrier

> **Preheader:** What switching to narrower keys was actually like, including the part nobody advertises.
>
> Hi {{first_name}}, a few years ago David Steinbuhler, who has made narrower piano keyboards in a corner of his Pennsylvania textile factory since 1992, put a narrower set of keys into my own Kawai. For the first few weeks I did not notice much difference. What I noticed was the black keys. They felt so narrow. On a standard piano they are wide enough that you can approximate the distance and still hit the note. On these, accuracy was everything, and I was uneasy.
>
> Then the unease went away and something else took its place: relaxation. For the first time in my life I did not have to strain for the most common interval there is, the octave. Pieces I had written off, Chopin, Liszt, Rachmaninoff, started opening up like old friends who had moved back into town. My hands are not large, especially for a man. I had spent three decades on pianos that were simply too big for them, and it took a few weeks to find that out.
>
> **[Find Your Key Size]**
>
> There is a slider on that page. Measure from the tip of your thumb to the tip of your little finger and it will tell you which size you would be on. _Find your size here._ (link) And if you are worried about being stuck on one size, pianists who practice on narrower keys report the technique carries back to a standard piano.

**Sources.** Every sentence of the story is Lionel's own published wording on /our-story (Steinbuhler, 1992, the Kawai MP11SE swap to DS6.0, "the black keys feel so narrow", "approximate the distance", "finger accuracy was paramount", "complete relaxation", "#1 most common interval, the octave", "like old friends who moved back into town", "3 decades ... too big for my hands"). Technique carrying back to a standard piano: /about-us/ds-standard. The slider is the fourth section of /hidden-barrier.

### 03 · I used to tell my students their hands would grow → /about-us/ds-standard

> **Preheader:** It was true for the children. It was not true for the rest of us.
>
> Hi {{first_name}}, when I was teaching, almost every student under thirteen hit the same wall: their hands could not cover the intervals the music asked for. I said what every teacher says. Do not worry, your hands will grow. For the children, that was true. But most of my female students had the same complaint about the same intervals, and their hands were not going to change. Neither were mine.
>
> By then I had a DS6.0 keyboard at home, and I felt bad demonstrating on it, because I knew they could not reproduce the technique on their standard keys. That is when it flipped for me. I had been treating hand size as the student's problem, something to grow out of or practice around. It is not. The keyboard comes in one size, and that size was standardized around one hand, which was not the average one.
>
> **[See Who Uses These Sizes]**
>
> Universities are teaching on these sizes now, and international competitions are beginning to accept them. The instrument is finally being adjusted to the player, instead of the other way round. _Here is what the DS standard actually is._ (link)

**Sources.** /our-story: "Almost universally, students under 13 faced hand size issues. I constantly had to remind them, 'don't worry, your hands will grow.'"; "Most female students complained about large intervals"; "I felt bad demonstrating on my DS6.0, knowing they couldn't replicate the technique on their standard keys." "Standardized around one hand size, and it was not the average one" is the approved closing line of 2x2 slot 03. Universities (SMU, UNT) and competitions: /about-us/ds-standard.

### 04 · The most common reason people almost did not order → /production-timeline

> **Preheader:** It is probably the same doubt you have. I would have had it too.
>
> Hi {{first_name}}, I asked the people who have already reserved a DreamPlay One what nearly stopped them. The most common answer, from nine of the twenty-four who replied, was doubt that a new company could actually deliver. Seven said it was an easy yes. Most of the rest worried about the wait. I want to take that first answer seriously, because it is fair. If I were reading this instead of writing it, I would have the same doubt.
>
> So here is what exists today, rather than what is promised. A factory partner in Shenzhen that agreed to a first batch of under two hundred units, which almost nobody would. Custom steel molds, cut to hundredths of a millimeter, casting our own narrow keys. Finished DS5.5 and DS6.0 keybeds, and a machine whose only job is to press those keys over and over to simulate decades of use. And the first complete prototype, which I have sat down and played. The doubt does not fully go away until instruments ship. But it should be a doubt about a date, not about whether the thing is real.
>
> _(photo: the first prototype, assembled, in the studio)_
>
> **[See Everything Built So Far]**
>
> Every step is on one page with photographs, including the parts that took longer than I expected. _The production timeline._ (link) Questions about the schedule: reply to this email. I answer these myself.

**Sources.** Hesitation at n=24: doubts a new company could deliver 9, easy yes 7, the wait 3, not able to try first 2, other 3. Shenzhen / under 200 units / steel molds to hundredths of a millimetre / assembled DS5.5 and DS6.0 keybeds / Key Life Test Machine: all captions on /production-timeline. "I finally sat down and played one" was the sent subject of 2x2 slot 07 (LOVE). "The parts that have taken longer than I expected" and "I answer these myself" are approved 2x2 lines. Photo: `/images/product-updates/july-2026-prototype-studio.jpg`, the July update's image.

### 05 · He practiced for hours, and it did not help → /why-narrow

> **Preheader:** A buyer in his sixties, a piano he cannot play as written, and why effort was never going to fix it.
>
> Hi {{first_name}}, in August I spent fifteen minutes on the phone with a man who has reserved a DreamPlay One. He is in his sixties and has played since he was fifteen. A condition in his hands pulls the fingers in toward the palm, and his left hand now spans seven inches. He cannot reach an octave unless he catches the very edge of the keys. He owns a good acoustic upright that he cannot play as written.
>
> What stayed with me was what he said about practice. He put in hours against those limits, for years, and saw almost no improvement. The standard advice, and I gave it as a teacher, is to keep at it. But the barrier was never effort. It was geometry, and no amount of practice makes a hand longer. What he wants is not complicated. He wants to play an octave. There is a number for the hand span a standard keyboard quietly expects of you. He is well under it. So are most women, and about a quarter of men.
>
> **[See the Number]**
>
> It is on that page, with what changes when the keys are narrower. _See what a standard keyboard expects of your hand._ (link) If you are under it too, that is not a verdict on your playing. It never was.

**Sources.** Founder call notes, Appendix C of `docs/research/ab-test-august-10-findings.md` (2026-08-14, WhatsApp, 15 min): age 64, playing since 15, Dupuytren's contracture, 7-inch left hand, octave only at the key edges, Yamaha upright bought about 20 years ago, "practiced for hours ... very little improvement", "the barrier was never effort. It was geometry", "what he wants: to actually be able to play an octave". Scotland and the exact age are deliberately left out. The number is the 8.5-inch threshold on /why-narrow, with "87% of females" and "24% of males" under it.

## 4. Confirm before any real send

Everything above is drawn from things already published or recorded, but these
are still first-person claims about Lionel, and the rule from slot 06 applies:
**a conversion story is only usable if it is actually true of him.**

| # | email | claim | status |
|---|---|---|---|
| 1 | 01 | "I pictured students, and the parents and teachers around them." | **Lionel to confirm.** The research doc records the realization (buyers are 45+, nobody buys for a child) but not what he expected beforehand. If he never pictured parents, rewrite the first paragraph around what he did expect. |
| 2 | 01 | "many of them named the exact piece, or the exact chord" | True at n=24: roughly ten answers name a piece, chord, interval or composer. "Many", not "most". |
| 3 | 02 | Thumb-tip to little-finger-tip is how the slider wants the measurement | Confirm against the calculator copy on /hidden-barrier ("Spread your hand wide. Measure from the ..."). |
| 4 | 03 | "most of my female students had the same complaint" | /our-story says "most female students complained about large intervals". Kept verbatim. Fine unless Lionel wants it softened. |
| 5 | 04 | "which almost nobody would" (take a batch under 200) | /production-timeline: "finding a manufacturer willing to take on ... under 200 units ... was our biggest hurdle". A fair paraphrase, but it is a claim about other factories. |
| 6 | 04 | "the first complete prototype, which I have sat down and played" | The July update video and the sent slot 07 LOVE subject both say so. Confirm still the wording he wants. |
| 7 | 05 | **Consent.** The story is a real buyer, from a research call. | **Needs his OK, or further anonymizing.** He would recognize himself. Name, country and exact age are already omitted. |
| 8 | 05 | "I gave it as a teacher" (the advice to keep at it) | Inference from teaching plus the 2x2's approved "standard advice for a century" line. Lionel to confirm it is honestly his. |
| 9 | 05 | "most women, and about a quarter of men" are under the threshold | /why-narrow states 87% of females and 24% of males. Kept, since it is the site's own claim; the page is the CTA target. |

Any change: edit in the GUI (`/admin/marketing-calendar`), or edit the seed
script and run it with `--rewrite` (drafts only; a sent row is skipped).

## 5. Open decisions (Lionel's, not made here)

1. **Audience.** The 2x2 list (507, frozen snapshot, opens fell from 58% to 40%
   over seven sends) or the wider active list (8,263, never emailed by this
   program). The drafts do not reference earlier emails, so either works.
2. **Cadence.** The 2x2 sent three times a week and fatigued visibly. The
   proposed dates are weekly.
3. **Offer stamping.** See section 2. The b-offer led on clicks (3.3% vs 2.6%)
   and both variant-attributed sales were 7b.
4. **Slot 08 of the 2x2** ("Ready to pick yours?", the only email that links to
   /customize) was never sent and is still a draft. It could close this series
   instead, with the deposit paragraph.

## 6. How to proof and send

```
# proof copies to Lionel's inbox (house rule: test first, every time)
node scripts/email/send-test-copy.mjs --prefix skeptic-2026- --to musicalbasics@gmail.com

# after his edits in the GUI, or after editing the seed script:
node scripts/email/setup-skeptic-series.mjs --rewrite
```

There is no real-send script for this series yet. When Lionel approves, model
one on `send-love-vs-spec.mjs` without the arm logic: child campaign per send
key (`:send`), sent_history idempotency, suppression check, the unsubscribe
footer and RFC 8058 headers, append-mode tracking, 300 ms pacing.

# AB Test August 10 — Test Design and Full Copy Inventory

> **Purpose of this document:** the test design plus every word of copy in it, in one place.
>
> **Status (2026-08-10): LIVE.** The copy below is the rewritten version, warmer and less self-explanatory than the first draft, and it has been applied to both the four campaign templates and the two landing pages. This document now matches what is actually deployed. Nothing has been sent to buyers yet.
>
> **Hard house rule: no em dashes anywhere.** Use commas, colons or periods instead.

---

## 1. What the test is

DreamPlay Pianos has 64 pre-order buyers of the DreamPlay One, an instrument with narrower-than-standard keys and an LED guided learning system. It does not ship yet. These are the earliest believers in the company.

Lionel (founder, also the face of the MusicalBasics YouTube channel) wants two things from them:

1. **Research:** who these buyers actually are and the deepest reason they bought.
2. **A methodology answer:** what is the cheapest, highest-response way to get that kind of insight out of a small buyer list, for every future launch.

So the outreach itself is the experiment.

### The 2x2 design

Two dimensions crossed:

- **Collection method:** a self-serve web survey vs a 15-minute one-on-one call with the founder.
- **Incentive:** store credit vs nothing at all.

|        | Store credit                    | No incentive                  |
| ------ | ------------------------------- | ----------------------------- |
| Survey | **A1** — survey + $5 credit     | **A2** — survey, no offer     |
| Call   | **B1** — call + $10 credit      | **B2** — call, no offer       |

- 64 buyers, split exactly **16 / 16 / 16 / 16**.
- Assignment is deterministic: `sha256("buyer-research-4arm-v55:" + buyerId)`, first byte mod 4. The salt `4arm-v55` was picked before any email went out because it produced the exact even split. It must not be changed now.
- Lionel can hand-move individual buyers between groups on the admin page. Those manual moves are stored as overrides and win over the hash everywhere: page access, credit rules, reporting, the send itself.

### What we are measuring

Per arm: open rate, click rate, and completion (survey submitted, or call requested and completed). Comparing across the grid answers:

- Does asking for a call beat asking for a survey, or scare people off?
- Does store credit lift response enough to justify paying for it?
- Is there an interaction, for example does credit matter far more for the call ask than for the survey ask?

### Mechanics worth knowing before touching copy

- Every buyer gets **one email** with a personal signed link. No login.
- **Call-arm buyers get a survey escape hatch.** Both call emails and the call landing page offer "fill out the survey instead" for people who do not want to talk. So the survey page has to accept visitors from all four arms.
- The survey page is exclusive to nobody, but the call page is exclusive to B1/B2. A survey-arm buyer who lands on the call page is silently redirected to their survey.
- **Credit is granted automatically:** $5 the moment an A1 buyer submits the survey; $10 once Lionel marks a B1 call completed. Credit is a real ledger balance shown on their reservation and order pages.
- Nothing has been sent yet. The emails go out only when Lionel gives the word.

### The voice, and why it was rewritten

The first draft of this copy had the usual tells: it explained its own logic out loud ("your answers directly shape what we build next"), it flattered in a generic way ("that makes your perspective priceless"), and every paragraph was the same length and shape, which reads as optimized rather than written.

The rewrite fixes that by taking things out. It no longer tells the buyer why their answer is strategically valuable to DreamPlay. Lionel obviously wants the research for positioning and product decisions, but a normal person writing personally would not explain all of that. "I realized I'd really like to understand what made you decide to take a chance on us" does the same job and sounds like a human.

Deliberately kept, and worth protecting in any future edit:

- Slightly inefficient phrases: "or anything to set up", "Nothing formal", "I've been wanting to", "that's completely fine", "once you finally have it in front of you". The small inefficiency is exactly what makes them sound spoken.
- "Would you be up for a quick call?" instead of "Can I call you?". The second one sounds like an acquisition email, the first sounds like a person asking another person.
- Uneven paragraph lengths, including the one-line "Would you be up for talking with me for about 15 minutes?" sitting alone.

Constraints any further edit must respect:

- The A/B contrast has to survive. A1 vs A2 must differ **only** by the credit mention. Same for B1 vs B2. If an edit changes the base pitch in one arm, the test is confounded.
- The two credit arms should present the credit the same way relative to each other, at $5 and $10 respectively.
- Merge tags must stay intact: `{{first_name}}`, `{{research_url}}`, `{{survey_url}}`.
- The emails and the landing pages must move together. If only the emails get edited, clicking through drops the buyer into a different voice, which is the exact problem this rewrite set out to solve.
- No em dashes.

---

## 2. Email copy (four variants)

Stored as campaign templates in the database, editable at `/admin/ab-test-august-10`. All four share the same dark, gold-accented layout: a `D R E A M P L A Y` wordmark, a small uppercase eyebrow line, a headline, body paragraphs, a gold button, a closing paragraph, then the signature.

Every email signs off:

> Lionel Yu
> Founder, DreamPlay Pianos

Note the body is now three or four short paragraphs rather than two even blocks. The uneven rhythm is deliberate.

### A1 — Survey + $5 credit

- **Subject:** {{first_name}}, I'd love to hear from you
- **Preheader (hidden preview text):** I'd love to know a little more about why you decided to order one. I'll add $5 of DreamPlay credit as a thank you.
- **Eyebrow:** A quick question · $5 store credit
- **Headline:** {{first_name}}, I'd love to hear from you
- **Body paragraph 1:** You were one of the first people to order a DreamPlay One, long before most people have even had a chance to see one in person.
- **Body paragraph 2:** I've been thinking a lot lately about those first orders, and I realized I'd really like to understand what made you decide to take a chance on us. So I put together a short survey. It's nine questions and should only take a couple of minutes.
- **Body paragraph 3 (credit):** As a thank you for doing it, I'll add **$5 of DreamPlay store credit** to your account as soon as you submit it.
- **Button:** Share Your Thoughts → `{{research_url}}`
- **Closing:** There's no login or anything to set up. The link is just for you, and I'll personally be reading the responses.
- **Sign-off line:** Thanks again for being here this early. It really does mean a lot to me.

### A2 — Survey, no incentive

Identical to A1 with the credit paragraph removed and the credit dropped from the subject, preheader and eyebrow. Nothing else changes, which is what keeps the incentive comparison clean.

- **Subject:** {{first_name}}, I'd love to hear from you
- **Preheader:** I'd love to know a little more about why you decided to order one.
- **Eyebrow:** A quick question
- **Headline:** {{first_name}}, I'd love to hear from you
- **Body paragraph 1:** *(same as A1)* You were one of the first people to order a DreamPlay One, long before most people have even had a chance to see one in person.
- **Body paragraph 2:** *(same as A1)* I've been thinking a lot lately about those first orders, and I realized I'd really like to understand what made you decide to take a chance on us. So I put together a short survey. It's nine questions and should only take a couple of minutes.
- **Body paragraph 3:** *(omitted, this is the credit paragraph)*
- **Button:** Share Your Thoughts → `{{research_url}}`
- **Closing:** *(same as A1)* There's no login or anything to set up. The link is just for you, and I'll personally be reading the responses.
- **Sign-off line:** *(same as A1)* Thanks again for being here this early. It really does mean a lot to me.

### B1 — Call + $10 credit

- **Subject:** {{first_name}}, would you be up for a quick call? + $10 credit
- **Preheader:** I'm talking with a few of our earliest DreamPlay buyers and would love to talk with you too. I'll also add $10 of DreamPlay credit after the call.
- **Eyebrow:** A quick call · $10 store credit
- **Headline:** {{first_name}}, would you be up for a quick call?
- **Body paragraph 1:** I've been wanting to get to know some of the people who ordered the DreamPlay One a little better, so I'm reaching out personally to a few of our earliest buyers.
- **Body paragraph 2:** Would you be up for talking with me for about 15 minutes?
- **Body paragraph 3:** Nothing formal. I mostly want to hear about you, what you play, how you came across DreamPlay, and what made you decide to order one. I'm also curious what you're hoping it'll be like once you finally have it in front of you.
- **Body paragraph 4 (credit):** As a thank you for taking the time, I'll add **$10 of DreamPlay store credit** to your account after we talk.
- **Button:** Let Me Know When You're Free → `{{research_url}}`
- **Closing:** Just tell me how you'd like me to reach you and what days generally work. I'll email you myself to figure out an actual time.
- **Escape hatch:** And if you'd rather not do a call, that's completely fine. You can [fill out the short survey](`{{survey_url}}`) instead.
- **Sign-off line:** Thanks again,

### B2 — Call, no incentive

Identical to B1 with the credit paragraph removed and the credit dropped from the subject, preheader and eyebrow.

- **Subject:** {{first_name}}, would you be up for a quick call?
- **Preheader:** I'm talking with a few of our earliest DreamPlay buyers and would love to talk with you too.
- **Eyebrow:** A quick call
- **Headline:** {{first_name}}, would you be up for a quick call?
- **Body paragraph 1:** *(same as B1)* I've been wanting to get to know some of the people who ordered the DreamPlay One a little better, so I'm reaching out personally to a few of our earliest buyers.
- **Body paragraph 2:** *(same as B1)* Would you be up for talking with me for about 15 minutes?
- **Body paragraph 3:** *(same as B1)* Nothing formal. I mostly want to hear about you, what you play, how you came across DreamPlay, and what made you decide to order one. I'm also curious what you're hoping it'll be like once you finally have it in front of you.
- **Body paragraph 4:** *(omitted, this is the credit paragraph)*
- **Button:** Let Me Know When You're Free → `{{research_url}}`
- **Closing:** *(same as B1)* Just tell me how you'd like me to reach you and what days generally work. I'll email you myself to figure out an actual time.
- **Escape hatch:** *(same as B1)* And if you'd rather not do a call, that's completely fine. You can [fill out the short survey](`{{survey_url}}`) instead.
- **Sign-off line:** *(same as B1)* Thanks again,

---

## 3. Survey landing page copy (`/buyer-survey`)

Reached by A1 and A2 buyers, and by B1/B2 buyers who take the escape hatch. Page title: `Your DreamPlay Survey | DreamPlay Pianos`. Not indexed.

### Header

- **Eyebrow:** A quick question · 2 minutes · $5 store credit *(the credit segment only shows for credit arms)*
- **Headline:** I'd love to hear from you.
- **Intro paragraph:** You ordered a DreamPlay One long before most people have even had a chance to see one in person. I'd really like to understand what made you decide to take a chance on us.
- **Second paragraph, credit arms:** Nine questions, a couple of minutes. As a thank you for doing it, **$5 of DreamPlay store credit** goes into your account as soon as you submit.
- **Second paragraph, no-incentive arms:** Nine questions, a couple of minutes. I'll personally be reading the responses.

### The nine questions

All are required except the last. The first seven are multiple choice, the last two are free text.

1. **Who is the DreamPlay One for?** → Myself / My child / A student I teach / A family member or partner / It is a gift
2. **Your age range** → Under 18 / 18 to 29 / 30 to 44 / 45 to 59 / 60 or older / Prefer not to say
3. **Your piano experience** → Just starting / Returning after years away / Intermediate / Advanced / Professional or teacher
4. **On a standard keyboard, can you comfortably reach a full octave?** → Easily / With some strain / Barely / No / Not sure
5. **What was the biggest reason you ordered?** → Narrow keys that finally fit my hands / Relief from pain or strain while playing / The LED guided learning system / It is for someone with smaller hands / I believe in the mission and wanted to support it / The look and design / Other
6. **What almost stopped you from ordering?** → The price / The wait for delivery / Not being able to try it first / Doubts that a new company could deliver / Nothing, it was an easy yes / Other
7. **Where did you first hear about DreamPlay?** → Lionel's YouTube channel (MusicalBasics) / Another YouTube channel or video / Google search / Social media / A friend, family member or teacher / Other
8. **In your own words: what made you decide the DreamPlay One was worth pre-ordering?** *(free text)*
9. **Anything else you want Lionel to know? (optional)** *(free text)*

Free-text placeholder: `Type your answer here...`

### Buttons and states

- **Submit button, credit arms:** Send My Answers and Claim $5
- **Submit button, no-incentive arms:** Send My Answers
- **While submitting:** Sending...
- **Validation hint:** `N questions left to answer.` (singular "question" when one remains)
- **Error:** Something went wrong. Please try again.

### Confirmation states

- **Just submitted, credit arm:** "Thank you. Your $5 credit is in your account."
- **Just submitted, no-incentive arm:** "Thank you, this is really helpful."
- **Body for both:** I'll be reading these myself. Thanks again for being here this early, it really does mean a lot to me.
- **Returning after already submitting:** "You have already filled this out." / Sending it again would just update your answers, so if something has changed, reply to my email instead.

### Bad or missing link

- **Headline:** This link is not valid.
- **Body:** Please use the personal link from my email, or just write to support@dreamplaypianos.com.

---

## 4. Call landing page copy (`/founder-call`)

B1 and B2 only. Page title: `A Call with Lionel | DreamPlay Pianos`. Not indexed.

### Header

- **Eyebrow:** A quick call · $10 store credit *(credit segment only for B1)*
- **Headline:** Glad you're up for it.
- **Intro paragraph:** Nothing formal, about 15 minutes. I mostly want to hear about you, what you play, how you came across DreamPlay, and what made you decide to order one.
- **Second paragraph, B1:** Just let me know how to reach you and roughly when you're free. As a thank you for taking the time, **$10 of DreamPlay store credit** goes into your account after we talk.
- **Second paragraph, B2:** Just let me know how to reach you and roughly when you're free.

### The booking form

**Section 1 heading:** How should I reach you?

| Option     | Sub-label            |
| ---------- | -------------------- |
| Zoom       | I'll email a link    |
| Phone call | I'll call you        |
| WhatsApp   | Voice call           |

Phone and WhatsApp reveal a number field. Placeholders: `Your phone number (with country code)` and `Your WhatsApp number`.

**Section 2 heading:** Which days generally work?
Chips: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday (multi-select)

**Section 3 heading:** What part of the day?
Options: Morning, Afternoon, Evening (multi-select)
Below it: `Your timezone, detected automatically:` followed by an editable timezone field.

**Section 4 heading:** Anything I should know beforehand? (optional)
Placeholder: `Totally optional...`

**Submit button:** Yes, Let's Talk (`Sending...` while in flight)

### Confirmation states

- **Just booked:** "Great, I'll be in touch."
- **Returning after already booking:** "You're already on my list."
- **Body for both:** I'll email you in the next few days to sort out an actual time on one of the days you picked. *(B1 only, appended:)* After we talk, $10 of store credit goes into your account. Need to change anything? Just reply to my email.

### Survey escape hatch (footer of the call page)

> Would you rather not do a call? That's completely fine. You can [fill out the short survey](/buyer-survey) instead.

### Bad or missing link

Same as the survey page: "This link is not valid." / Please use the personal link from my email, or just write to support@dreamplaypianos.com.

---

## 5. Quick reference

The headline elements, old vs new:

| Where | Element | Was | Now |
| --- | --- | --- | --- |
| A1 email | Subject | Two minutes of your time, $5 store credit | {{first_name}}, I'd love to hear from you |
| A2 email | Subject | A quick question about your DreamPlay One | {{first_name}}, I'd love to hear from you |
| B1 email | Subject | 15 minutes with me, $10 store credit | {{first_name}}, would you be up for a quick call? + $10 credit |
| B2 email | Subject | Can I call you about your DreamPlay One? | {{first_name}}, would you be up for a quick call? |
| A1/A2 email | Headline | Why did you say yes, {{first_name}}? | {{first_name}}, I'd love to hear from you |
| B1/B2 email | Headline | {{first_name}}, can I call you? | {{first_name}}, would you be up for a quick call? |
| A1/A2 email | Button | Take the 2-Minute Survey | Share Your Thoughts |
| B1/B2 email | Button | Pick a Time That Suits You | Let Me Know When You're Free |
| Survey page | Headline | Help us build this right. | I'd love to hear from you. |
| Call page | Headline | Talk to Lionel about your DreamPlay One. | Glad you're up for it. |
| Survey page | Submit (credit) | Submit and Claim My $5 Credit | Send My Answers and Claim $5 |
| Survey page | Submit (no credit) | Submit My Answers | Send My Answers |
| Call page | Submit | Yes, I Can Call | Yes, Let's Talk |

**Voice change worth flagging.** The old copy used "I" in the emails but third-person "Lionel" on the landing pages, on the theory that the pages were the company speaking about him. The rewrite drops that split and uses "I" everywhere. Once the email sounds like a personal note, arriving on a page that refers to Lionel in the third person breaks the spell, and third person is a large part of why the pages read as marketing. This is why the page copy above says "I'll email you" rather than "Lionel will email you", and why the form headings became "How should I reach you?" and "Anything I should know beforehand?".

The subject line for A1 and A2 is now identical, as is the headline. That is intentional and correct for the test: the incentive dimension should be the only difference, and A1 still surfaces the credit in the preheader, the eyebrow and its own paragraph.

---

## 6. Where this copy lives (applied 2026-08-10)

1. **The four emails** are rows in the `campaigns` table (`is_template = true`), named `Buyer Research Survey Credit (A1)`, `Buyer Research Survey NoCredit (A2)`, `Buyer Research Call Credit (B1)`, `Buyer Research Call NoCredit (B2)`. They were updated in place, so the layout, gold button and wordmark are unchanged and only the text moved. Bodies went from two paragraphs to three (A1), two (A2), four (B1) and three (B2). Further edits go through `/admin/ab-test-august-10`, which has a live preview and writes straight to these rows.
2. **The two landing pages** are code:
   - `apps/web/src/app/(website-pages)/buyer-survey/page.tsx` and its `SurveyForm.tsx`
   - `apps/web/src/app/(website-pages)/founder-call/page.tsx` and its `CallRequestForm.tsx`

The nine survey questions and their answer options were not touched by this rewrite, they live in `SURVEY_QUESTIONS` in `apps/web/src/lib/buyer-research.ts`.

Verified after applying: no em dashes in any of the four templates, the credit paragraph exists only in A1 and B1, `{{survey_url}}` only in the call arms, and the A1-vs-A2 and B1-vs-B2 HTML diffs are exactly three lines each (preheader, eyebrow, credit paragraph).

**Still to do before the send:** email yourself the `[TEST A1/A2/B1/B2]` set and read all four on a phone. The send itself is manual and still waiting on Lionel.

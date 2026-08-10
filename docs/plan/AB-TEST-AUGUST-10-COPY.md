# AB Test August 10 — Test Design and Full Copy Inventory

> **Purpose of this document:** hand every word of this test to a copy editor (human or AI) for a rewrite. The current wording is functional but reads too direct and too "AI written". Everything below is the live copy as of 2026-08-10, exactly as buyers will see it.
>
> **Hard house rule for any rewrite: no em dashes anywhere.** Use commas, colons or periods instead. The existing copy already follows this rule, so keep it that way.

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

### Mechanics worth knowing before rewriting copy

- Every buyer gets **one email** with a personal signed link. No login.
- **Call-arm buyers get a survey escape hatch.** Both call emails and the call landing page offer "fill out the survey instead" for people who do not want to talk. So the survey page has to accept visitors from all four arms.
- The survey page is exclusive to nobody, but the call page is exclusive to B1/B2. A survey-arm buyer who lands on the call page is silently redirected to their survey.
- **Credit is granted automatically:** $5 the moment an A1 buyer submits the survey; $10 once Lionel marks a B1 call completed. Credit is a real ledger balance shown on their reservation and order pages.
- Nothing has been sent yet. The emails go out only when Lionel gives the word.

### The copy problem to solve

Across all four arms the current voice has the same tells: it explains its own logic out loud, it flatters in a slightly generic way ("that makes your perspective priceless"), it repeats the same setup line in all four variants, and the structure is very evenly balanced, so every paragraph is roughly the same length and shape. It should sound like one person who builds pianos wrote a short note to 64 people he is grateful for, not like a well-optimized campaign.

Constraints a rewrite must respect:

- The A/B contrast has to survive. A1 vs A2 must differ **only** by the credit mention. Same for B1 vs B2. If the rewrite changes the base pitch in one arm, the test is confounded.
- The two credit arms should present the credit the same way relative to each other, at $5 and $10 respectively.
- Merge tags must stay intact: `{{first_name}}`, `{{research_url}}`, `{{survey_url}}`.
- No em dashes.

---

## 2. Email copy (four variants)

Stored as campaign templates in the database, editable at `/admin/ab-test-august-10`. All four share the same dark, gold-accented layout: a `D R E A M P L A Y` wordmark, a small uppercase eyebrow line, a headline, two body paragraphs, a gold button, a closing paragraph, then the signature.

Every email signs off:

> Lionel Yu
> Founder, DreamPlay Pianos

### A1 — Survey + $5 credit

- **Subject:** Two minutes of your time, $5 store credit
- **Preheader (hidden preview text):** Nine quick questions about why you ordered, and $5 of DreamPlay store credit as a thank you.
- **Eyebrow:** Two minutes · $5 store credit
- **Headline:** Why did you say yes, {{first_name}}?
- **Body paragraph 1:** You ordered an instrument that did not exist until you and a small group of believers made it real. Before we lock in how the DreamPlay One reaches the rest of the world, I want to understand one thing deeply: why you said yes.
- **Body paragraph 2:** I put together a short survey: nine questions, about two minutes. Your answers directly shape what we build next and how we talk about it. As a thank you, **$5 of DreamPlay store credit** is added to your account the moment you submit.
- **Button:** Take the 2-Minute Survey → `{{research_url}}`
- **Closing:** It is your personal link, no login needed, and it works on your phone. Thank you for being part of this from the start.

### A2 — Survey, no incentive

Identical to A1 except the credit is gone. This is the control for the incentive dimension.

- **Subject:** A quick question about your DreamPlay One
- **Preheader:** Nine quick questions about why you ordered. Lionel reads every answer personally.
- **Eyebrow:** Two minutes
- **Headline:** Why did you say yes, {{first_name}}?
- **Body paragraph 1:** *(same as A1)* You ordered an instrument that did not exist until you and a small group of believers made it real. Before we lock in how the DreamPlay One reaches the rest of the world, I want to understand one thing deeply: why you said yes.
- **Body paragraph 2:** I put together a short survey: nine questions, about two minutes. Your answers directly shape what we build next and how we talk about it. Every answer is read personally, and it takes about two minutes.
- **Button:** Take the 2-Minute Survey → `{{research_url}}`
- **Closing:** *(same as A1)* It is your personal link, no login needed, and it works on your phone. Thank you for being part of this from the start.

> Note for the editor: A2's paragraph 2 currently says "about two minutes" twice in a row, once in each sentence. Worth fixing.

### B1 — Call + $10 credit

- **Subject:** 15 minutes with me, $10 store credit
- **Preheader:** A 15-minute call with Lionel about your DreamPlay One, and $10 of DreamPlay store credit as a thank you.
- **Eyebrow:** 15 minutes · $10 store credit
- **Headline:** {{first_name}}, can I call you?
- **Body paragraph 1:** You are one of the first people in the world to order a DreamPlay One. I am personally calling a small group of our earliest buyers, and I would love for you to be one of them.
- **Body paragraph 2:** Fifteen minutes, whenever suits you: what you play, why you ordered, and what you are hoping for when it arrives. No preparation, no sales pitch, just a conversation between a builder and the person the instrument is for. As a thank you for your time, **$10 of DreamPlay store credit** is added to your account after we talk.
- **Button:** Pick a Time That Suits You → `{{research_url}}`
- **Closing:** Two taps: how to reach you and when you are usually free. I take care of the rest and confirm by email. Don't feel like calling? [Fill out this survey](`{{survey_url}}`) instead. We would love to hear from you!

### B2 — Call, no incentive

Identical to B1 except the credit is gone.

- **Subject:** Can I call you about your DreamPlay One?
- **Preheader:** A 15-minute conversation with Lionel about your DreamPlay One.
- **Eyebrow:** 15 minutes with the founder
- **Headline:** {{first_name}}, can I call you?
- **Body paragraph 1:** *(same as B1)* You are one of the first people in the world to order a DreamPlay One. I am personally calling a small group of our earliest buyers, and I would love for you to be one of them.
- **Body paragraph 2:** Fifteen minutes, whenever suits you: what you play, why you ordered, and what you are hoping for when it arrives. No preparation, no sales pitch, just a conversation between a builder and the person the instrument is for.
- **Button:** Pick a Time That Suits You → `{{research_url}}`
- **Closing:** *(same as B1)* Two taps: how to reach you and when you are usually free. I take care of the rest and confirm by email. Don't feel like calling? [Fill out this survey](`{{survey_url}}`) instead. We would love to hear from you!

---

## 3. Survey landing page copy (`/buyer-survey`)

Reached by A1 and A2 buyers, and by B1/B2 buyers who take the escape hatch. Page title: `Your DreamPlay Survey | DreamPlay Pianos`. Not indexed.

### Header

- **Eyebrow:** DreamPlay Buyer Survey · 2 minutes · $5 store credit *(the credit segment only shows for credit arms)*
- **Headline:** Help us build this right.
- **Intro paragraph:** You are one of the first people in the world to order a DreamPlay One, and that makes your perspective priceless. These few questions tell us who this instrument is really for and what matters most to you.
- **Second paragraph, credit arms:** As a thank you, **$5 of DreamPlay store credit** is added to your account the moment you submit.
- **Second paragraph, no-incentive arms:** It takes about two minutes, and every answer is read personally.

### The nine questions

All are required except the last. The first seven are multiple choice, the last two are free text.

1. **Who is the DreamPlay One for?** — Myself / My child / A student I teach / A family member or partner / It is a gift
2. **Your age range** — Under 18 / 18 to 29 / 30 to 44 / 45 to 59 / 60 or older / Prefer not to say
3. **Your piano experience** — Just starting / Returning after years away / Intermediate / Advanced / Professional or teacher
4. **On a standard keyboard, can you comfortably reach a full octave?** — Easily / With some strain / Barely / No / Not sure
5. **What was the biggest reason you ordered?** — Narrow keys that finally fit my hands / Relief from pain or strain while playing / The LED guided learning system / It is for someone with smaller hands / I believe in the mission and wanted to support it / The look and design / Other
6. **What almost stopped you from ordering?** — The price / The wait for delivery / Not being able to try it first / Doubts that a new company could deliver / Nothing, it was an easy yes / Other
7. **Where did you first hear about DreamPlay?** — Lionel's YouTube channel (MusicalBasics) / Another YouTube channel or video / Google search / Social media / A friend, family member or teacher / Other
8. **In your own words: what made you decide the DreamPlay One was worth pre-ordering?** *(free text)*
9. **Anything else you want Lionel to know? (optional)** *(free text)*

Free-text placeholder: `Type your answer here...`

### Buttons and states

- **Submit button, credit arms:** Submit and Claim My $5 Credit
- **Submit button, no-incentive arms:** Submit My Answers
- **While submitting:** Submitting...
- **Validation hint:** `N questions left to answer.` (singular "question" when one remains)
- **Error:** Something went wrong. Please try again.

### Confirmation states

- **Just submitted, credit arm:** "Thank you. Your $5 store credit is in your account."
- **Just submitted, no-incentive arm:** "Thank you. Your answers are in."
- **Body for both:** Every answer directly shapes how we build and talk about the DreamPlay One. Lionel reads each one personally.
- **Returning after already submitting:** "You have already completed this survey." / Submitting again would simply update your answers, so if anything has changed, reply to the email instead.

### Bad or missing link

- **Headline:** This link is not valid.
- **Body:** Please use the personal link from your DreamPlay email, or write to support@dreamplaypianos.com.

---

## 4. Call landing page copy (`/founder-call`)

B1 and B2 only. Page title: `A Call with Lionel | DreamPlay Pianos`. Not indexed.

### Header

- **Eyebrow:** 15 minutes with the founder · $10 store credit *(credit segment only for B1)*
- **Headline:** Talk to Lionel about your DreamPlay One.
- **Intro paragraph:** You ordered an instrument that does not exist anywhere else, and Lionel wants to hear the story behind that decision directly from you: what you play, what made you order, and what you are hoping for. Fifteen minutes, no preparation needed, no sales pitch.
- **Second paragraph, B1:** As a thank you for your time, **$10 of DreamPlay store credit** is added to your account after the call. Two taps below and you are booked.
- **Second paragraph, B2:** Two taps below and you are booked.

### The booking form

**Section 1 heading:** How should we call you?

| Option     | Sub-label            |
| ---------- | -------------------- |
| Zoom       | We email you a link  |
| Phone call | Lionel calls you     |
| WhatsApp   | Voice call           |

Phone and WhatsApp reveal a number field. Placeholders: `Your phone number (with country code)` and `Your WhatsApp number`.

**Section 2 heading:** Which days usually work?
Chips: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday (multi-select)

**Section 3 heading:** What part of the day?
Options: Morning, Afternoon, Evening (multi-select)
Below it: `Your timezone, detected automatically:` followed by an editable timezone field.

**Section 4 heading:** Anything Lionel should know beforehand? (optional)
Placeholder: `Totally optional...`

**Submit button:** Yes, I Can Call (`Sending...` while in flight)

### Confirmation states

- **Just booked:** "You are on Lionel's call list."
- **Returning after already booking:** "Your call request is already in."
- **Body for both:** Lionel will email you within a few days to lock in a time on one of your preferred days. *(B1 only, appended:)* After the call, $10 of store credit is added to your account. Need to change anything? Just reply to the email that brought you here.

### Survey escape hatch (footer of the call page)

> Don't feel like calling? [Fill out this survey](/buyer-survey) instead. We would love to hear from you!

### Bad or missing link

Same as the survey page: "This link is not valid." / Please use the personal link from your DreamPlay email, or write to support@dreamplaypianos.com.

---

## 5. Quick reference for the editor

Every piece of user-facing copy in the test, in one list:

| Where | Element | Current text |
| --- | --- | --- |
| A1 email | Subject | Two minutes of your time, $5 store credit |
| A2 email | Subject | A quick question about your DreamPlay One |
| B1 email | Subject | 15 minutes with me, $10 store credit |
| B2 email | Subject | Can I call you about your DreamPlay One? |
| A1/A2 email | Headline | Why did you say yes, {{first_name}}? |
| B1/B2 email | Headline | {{first_name}}, can I call you? |
| A1/A2 email | Button | Take the 2-Minute Survey |
| B1/B2 email | Button | Pick a Time That Suits You |
| Survey page | Headline | Help us build this right. |
| Call page | Headline | Talk to Lionel about your DreamPlay One. |
| Survey page | Submit (credit) | Submit and Claim My $5 Credit |
| Survey page | Submit (no credit) | Submit My Answers |
| Call page | Submit | Yes, I Can Call |

Voice notes: Lionel writes as "I" in the emails and is referred to as "Lionel" in third person on the landing pages. That split is intentional, the emails are from him and the pages are the company speaking about him. Keep it unless there is a good reason not to.

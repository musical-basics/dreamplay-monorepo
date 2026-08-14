# AB Test: Love vs Spec (email + website, Aug-Sep 2026)

**Drafted** 2026-08-14 · **Status: PLAN, nothing built or sent** · Owner: Lionel

The question this test answers: **does our marketing move the needle, or not?**
Specifically: does repositioning around the love of playing (the 45+ returning
player) outperform our existing spec-and-research marketing, measured on the
same audience, with the same offer, over the same weeks?

Source research: [marketing-positioning-45-plus.md](../research/marketing-positioning-45-plus.md)
and [ab-test-august-10-findings.md](../research/ab-test-august-10-findings.md).

---

## 1. Design at a glance

Two aligned arms. Each arm is an email sequence plus the landing page it drives to,
so we test the whole marketing combination, not just a subject line.

| | Arm SPEC (control) | Arm LOVE (challenger) |
|---|---|---|
| Positioning | Existing marketing: intervals, research, specs, production | Playing the pieces and music you love; the return story; 45+ passionate players |
| Emails | The existing 8-email marketing calendar (frozen, re-dated) | 8 new emails, same cadence and dates, love-of-piano framing |
| Landing page | Variant **1a** `/premium-offer` (the incumbent homepage) | New variant **6a** at `/play-again` (built from existing content + new sections) |
| Audience | Half of the 507 interested subscribers | The other half |
| Email links | Homepage CTAs force `/1a` | Homepage CTAs force `/6a` |

**Two site changes are NOT part of the test. They ship globally, to both arms,
before launch:**

1. **$249 deposit** as the headline offer (replaces the $499 50%-down card).
2. **Pro model marked sold out.**

Reason: with 507 subscribers we have traffic for exactly one variable. If the
$249 deposit only existed on one arm, we could never say whether the messaging
or the money moved the needle. Deposit and scarcity apply everywhere; messaging
is the only difference between arms. (The dedicated payment-structure test from
findings §7a, current offer vs $600 Go vs instalments, stays a separate future
test.)

---

## 2. Website side

### 2.1 Control: variant 1a (premium-offer)

Recommendation: **1a**, not 1b. It is the incumbent: the exact page `/main`
serves today, so the control equals "what we currently say to the world."
1b leads the score sheet (9.3 vs 7.8) but the spread across all six variants is
inside noise at ~40 sessions per arm, and 1b carries child-hero and trade-in
sections the 45+ research says are dead weight; it is a worse embodiment of
"our existing marketing as we would actually ship it." If Lionel prefers the
score leader anyway, everything below works identically with 1b.

### 2.2 Challenger: new variant 6a at `/play-again`

New group 6 in `apps/web/src/config/ab.ts` ("Love of the piano, Aug 2026"),
one variation `6a`, route `/play-again`, noindex like other variant pages,
previewable at `/6a`.

Page composition, reusing existing components wherever they exist and adding
new sections (the "slides") only where no content exists:

| # | Section | Source |
|---|---|---|
| 1 | **Hero: "Is the piano still fun?"** Sub: "Play the pieces you always wanted to play." Single CTA: Reserve for $249 | NEW (chassis: `simple-offer/simple-hero.tsx`) |
| 2 | **The recognition**: there was a point where you slowed down on piano because it stopped being enjoyable. You assumed that was what getting older meant. The barrier was never effort. It was geometry. | NEW |
| 3 | **The repertoire slides**: name the music. Reach a tenth without rolling it. The inner notes of chords. Wedding Day at Troldhaugen. Rachmaninoff. "The notes you have been rolling or leaving out are simply there." | NEW (3-4 short slides/cards) |
| 4 | Hand comparison | existing `HandComparisonSection` |
| 5 | **The return story**: most of our buyers are people who stopped playing and came back. Paraphrased buyer patterns (returned after decades, played through pain, quit after high school). | NEW; paraphrase patterns, do NOT print buyer names or verbatim quotes without permission |
| 6 | Founder section | existing creator section from premium-offer |
| 7 | Pricing (with the new $249 deposit + Pro sold out) | existing shared `PricingSection` |
| 8 | Small Hands Guide capture | existing `SmallHandsGuideCapture` |
| 9 | Guarantee | existing `GuaranteeSection` |

Standard section composition like 5a, not the intro-offer scroll-snap deck:
5a's simple linear structure is our engagement leader, and scroll-snap adds
build cost without evidence it converts. ("Slides" here means the new content
cards in sections 2, 3, 5.)

Copy bank for the new sections (from the positioning doc, phrasing is the point):

- Is the piano still fun?
- Play the pieces you always wanted to play.
- You don't have to give up the piano as you get older.
- He did not lose the ability to want to play. He lost the ability to play what he wants. (rewrite in second person: "You never lost the ability to want to play.")
- The piano is enjoyable, and you can enjoy it for the rest of your life.

House rules apply: no em dashes, no invented statistics, every number checked
against `/product-information` or `config/shop.ts`.

### 2.3 Registry changes at launch

- Groups 2, 3, 5 set `active: false`; within group 1, `1b` set `active: false`.
  4a is already off. Traffic then splits 50/50 between 1a and 6a.
- **Set a fresh `since` on 1a at the launch deploy timestamp.** The $249
  deposit and sold-out Pro change the control page itself, so pre-launch 1a
  data is not comparable and must not blend in. 6a gets the same `since`.
- Testing mode (`ab_testing_mode`) is already ON; all traffic joins the split.
- Sticky `dp_ab` cookie (30 days) keeps assignment stable for the whole test.

### 2.4 Global change 1: the $249 deposit

Current offer structure: $99 "Lock My Spot" (already hidden by default),
$499 50%-down on the One ($999 total), $549 50%-down on the Bundle ($1,099),
and pay-in-full options.

Recommended structure: **replace the 50%-down cards with a $249 deposit**.

- DreamPlay One: **$249 today**, $750 + shipping/taxes when yours is ready to
  ship. Total $999. Founder price lock. Fully refundable until ship (confirm
  refund wording with Lionel).
- Premium Bundle: **$249 today**, $850 at ship. Total $1,099.
- Pay-in-full options stay.
- The $99 reservation stays hidden (it would undercut the $249 headline).

Do not add $249 as a third deposit option beside the 50% cards: buyers are
already unsure between sizes and finishes, and findings §7a warns about
decision cost. One deposit story, told everywhere.

Implementation surfaces (the tier arrays are duplicated, all must change
together): `components/premium-offer/pricing-section.tsx`,
`components/extended-offer/pricing-section.tsx`,
`customize/CustomizeClient.tsx` (`PRODUCT_CATALOG`), `config/shop.ts`, plus
`config/variant-map.ts` and new Shopify products/variants for the $249 deposit
(our Admin token has `write_products`, so these can be created via API the same
way the Pro upgrade product was). Also sweep stray "$499"/"$549" deposit
strings (`shop/ShopClient.tsx`, `product-information`, terms, etc.).
Balance collection at ship works like the existing 50% flow's second half.

### 2.5 Global change 2: Pro sold out

- `config/shop.ts`: mark `dreamplay-one-pro` and `dreamplay-one-pro-bundle`
  sold out (SOLD OUT badge, disabled purchase CTA, `unavailableMessage`).
  Remove their `purchasedToday` counters.
- `/customize`: Pro tiers render as sold out. **Must fix the known bypass at
  `CustomizeClient.tsx:252`** where pro tiers skip the hidden-products filter;
  without this the Pro stays buyable on `/customize`.
- `/dreamplay-pro`: sold-out banner + **email capture "Join the Pro waitlist"**
  (tag `Pro Waitlist`). Scarcity plus capture beats scarcity alone, and the
  tag becomes a future high-intent segment.
- **Do not touch the $200 existing-buyer Pro upgrade flow** (separate Shopify
  product, variant 53858415739194). Existing buyers keep their upgrade path.

---

## 3. Email side

### 3.1 The split

- Audience: rebuild the 507-person snapshot (`marketing-calendar:audience`)
  right before launch, honoring existing `removedIds`.
- Deterministic split, Aug-10 pattern: `sha256(salt + subscriber_id)` parity,
  **salt chosen before send to give an exact even split** (~253/254), frozen
  forever after. Overrides in `app_settings` if ever needed.
- Send mechanics: new script `send-marketing-love-ab.mjs` modeled on
  `send-ab-test-august-10.mjs` (child campaigns per arm per slot, suppression
  checks, `sent_history` idempotency, RFC 8058, append-mode tracking, em-dash
  refusal guard, `--test` mode). One invocation per slot day, both arms in the
  same run so nobody's send drifts. Manual script sends, not Inngest: Inngest
  is still unregistered, and the script path is the proven one.
- Send keys: arm SPEC uses the existing `marketing-calendar-2026-01..08`
  templates; arm LOVE gets new templates seeded with keys
  `marketing-love-2026-01..08` (extend `setup-marketing-calendar.mjs` or a
  sibling seeder, same GUI category so they appear on `/admin/marketing-calendar`).

### 3.2 Copy review: the existing 8 (arm SPEC)

Verdict: **strong as-is, and it should stay frozen as the control.** Revision 2
already fixed voice and the four false claims; re-editing it now would blur
what "our existing marketing" means. Three blockers before send:

1. **Dates have slipped.** Slots 01 (Aug 13) and 02 (Aug 16) are past/at-risk
   and unsent. Re-date the whole calendar (schedule in 3.4).
2. **Email 08 contradicts the new offer.** It says "$999 total, split as $499
   today and $500 when yours is boxed." With the $249 deposit live this is
   false. Update the figures to $249/$750 in BOTH arms' closing emails. This
   is an offer fact, not a messaging variable, so changing the control here is
   correct, not contamination.
3. **Email 06 still needs Lionel's confirmation** that he genuinely was
   skeptical about the LEDs. If untrue, rewrite before send (standing flag
   from MARKETING-EMAILS-DRAFTED.md §7.2).

Minor: email 05 says "fully weighted hammer action"; fine. Email 04
thresholds match the live calculator; fine. Nothing else changes.

### 3.3 Arm LOVE: 8 new emails (outline)

Same cadence, same dates, same 9:00 AM ET, same dark/gold layout, same
sign-off. Exclusively love-of-the-music framing for the older passionate
player. Where an existing email's content is reusable, it is reframed rather
than rewritten from nothing (per "use our existing content").

| # | Subject (draft) | Content | CTA |
|---|---|---|---|
| 01 | Is the piano still fun? | The recognition email. There was a point where you slowed down on piano because it was not enjoyable anymore. It was never effort. Standard keys were built for one hand size and it was not yours. The piano is enjoyable, and you can enjoy it for the rest of your life. | See the piano built for you → `/6a` |
| 02 | Why I started building pianos | Existing founder story, close reframed: not "a design problem" alone but "so nobody has to give up the music they love." | Read Our Story → `/our-story` |
| 03 | The pieces you always wanted to play | Name the repertoire. The tenth you have always rolled. The inner notes of chords. Grieg's Wedding Day at Troldhaugen, Rachmaninoff. On a keyboard that fits, those notes are simply there. | What would you play first? → `/6a` |
| 04 | Which size fits your hand | Existing sizing email, opening reframed: the number matters because of the music it unlocks. Same thresholds, same calculator. | Check Your Hand Span → `/how-it-works` |
| 05 | You do not have to give up the piano | The aging and return email. Most of our buyers are returning after years away. Pain in fingers and wrists made practice shorter until it stopped. Paraphrased buyer patterns, no names. You never lost the ability to want to play. | Come back to the piano → `/6a` |
| 06 | It still has to feel like a piano | Existing hardware email reframed: weighted action in service of expressive playing of the music you love, not spec-sheet pride. | See What It Is Made Of → `/product-information` |
| 07 | The first prototypes are finally here | Existing production email, close reframed: the honest question at the end is what piece you will play first. | Follow the Production Timeline → `/production-timeline` |
| 08 | Come back to the piano for $249 | The ask. $249 today reserves yours, $750 when it ships, $999 total, founder price lock, money-back guarantee. Reply and tell me what piece you will start with; I answer these myself. | Build Your DreamPlay One → `/customize` |

Rules for drafting: the "would Lionel spontaneously type this into Gmail" test,
no em dashes, no invented stories or statistics, no buyer names or verbatim
quotes without permission, every number checked against the product pages,
subjects under ~60 chars, own-domain links only.

### 3.4 Schedule (proposed)

Site changes must be live before the first send. Assuming site work ships by
Mon Aug 17:

| Slot | Date | Day |
|---|---|---|
| 01 | Aug 18 | Tue |
| 02 | Aug 20 | Thu |
| 03 | Aug 23 | Sun |
| 04 | Aug 25 | Tue |
| 05 | Aug 27 | Thu |
| 06 | Aug 30 | Sun |
| 07 | Sep 1 | Tue |
| 08 | Sep 3 | Thu |

Readout: ~Sep 10 (one week after the final send).

---

## 4. Measurement and decision rules

### What we already have

- Per-campaign unique open rate, unique click rate, click-to-open, attributed
  orders and revenue: `campaign-stats.ts` + the marketing-calendar dashboard.
- Email → purchase attribution: `dp_sid`/`dp_cid` planted in the Shopify order
  note, parsed by the orders webhook (live since 2026-08-12, forward-only).
- Site variant scoring: `/admin/ab-tests` + daily PDF, 1a vs 6a, with fresh
  `since` cutoffs.

### Metrics, ranked

1. **Primary: attributed deposits/purchases per arm** (email attribution via
   sid/cid; site attribution via ab_variant in the order note). The site has
   converted zero so far, so ANY purchase is signal.
2. begin_checkout and configurations per arm.
3. Unique click rate and click-to-open per slot pair (same-day arm A vs arm B
   emails are direct head-to-heads).
4. Email captures on 1a vs 6a (hand guide + Pro waitlist).
5. Replies (qualitative; Lionel reads them anyway).

### Pre-registered readings (write the findings against these, not after-the-fact stories)

- **LOVE wins**: clearly more attributed deposits, or with zero-to-few
  purchases, consistently higher clicks AND checkouts (rough bar: ≥1.5x on
  both). Action: love positioning becomes the primary frame; rewrite `/main`.
- **SPEC wins** by the same bars: keep current positioning; the 45+ thesis is
  wrong for cold conversion even if true of past buyers.
- **Both flat, still ~zero deposits despite $249**: messaging is not the
  binding constraint at this audience size. Escalate to the §7a price/product
  test (Go vs instalments) instead of another copy test.

Honesty about power: ~253 people per arm, historical open rates near 55-65%.
Purchase counts will be single digits at best. Click and checkout rates will
separate long before purchases reach significance; that is why they are
pre-registered as decision inputs. Compare by RATE, never raw counts.

---

## 5. Guardrails and confounds

- **Coupon trigger stays OFF for the whole test.** It fires on opens, and the
  arms may open at different rates, so it would hand unequal $50 discounts to
  the arms and contaminate the price story.
- **Freeze both arms' templates once slot 01 sends.** Same rule as AB Test
  August 10 (whose 4 buyer-research templates are still live and also must not
  be edited).
- Every one of the 16 emails goes to musicalbasics@gmail.com as [TEST] first;
  Lionel approves before real send. From "Lionel from DreamPlay
  <lionel@email.dreamplaypianos.com>", reply-to support@.
- Never change the split salt after slot 01. Overrides only via app_settings.
- Arm-consistent landing: homepage CTAs in emails use the force links `/1a`
  and `/6a` (they 307 to `/ab/<key>` and stamp the sticky cookie). Deep links
  (`/our-story`, `/how-it-works`, `/customize`) stay plain; the cookie from
  any earlier forced click keeps the visitor's variant sticky for 30 days.
- Organic (non-email) traffic also splits 1a/6a. That is fine: it adds site
  data and is arm-neutral by construction.
- Admin/bot exclusion: verify Lionel's current IP is in `settings.admin_ips`
  before launch (ISP rotation has burned us before).
- The `/6a` page and both arms' email 08 must state the same $249 offer and
  the same August 2027 delivery target if a date is stated at all. No date
  invented to sound nearer (standing rule from the positioning doc §6).

---

## 6. Execution checklist

Phase A: global site changes
- [ ] $249 deposit across the 4 tier surfaces + shop.ts + variant-map + stray strings
- [ ] Shopify $249 deposit products/variants created via Admin API
- [ ] Pro sold out in shop.ts + /customize (incl. the L252 bypass fix) + /dreamplay-pro banner + Pro waitlist capture
- [ ] Build green, tests green, smoke on preview

Phase B: challenger page
- [ ] Build `/play-again` (sections per 2.2), noindex
- [ ] Register group 6 / variant 6a; preview at `/6a`

Phase C: registry launch state
- [ ] Pause 1b, 2a, 3a, 5a; fresh `since` on 1a and 6a at deploy time
- [ ] Verify 50/50 assignment spread by smoke test

Phase D: emails
- [ ] Lionel confirms or rewrites email 06 (skeptic story)
- [ ] Update email 08 deposit figures ($249/$750) in the SPEC template
- [ ] Draft + seed the 8 LOVE emails (send keys `marketing-love-2026-01..08`)
- [ ] Re-date both arms per 3.4 schedule

Phase E: split + approval
- [ ] Rebuild the 507 audience snapshot; pick and freeze the split salt
- [ ] Write `send-marketing-love-ab.mjs` (Aug-10 guarantees)
- [ ] [TEST] all 16 emails to musicalbasics@gmail.com; Lionel approves

Phase F: run
- [ ] Send per slot (both arms in one invocation), watch dashboards
- [ ] Confirm coupon trigger is OFF

Phase G: readout (~Sep 10)
- [ ] Findings doc in docs/research/, written against §4's pre-registered readings

---

## 7. Open decisions for Lionel

1. **Control variant**: 1a (recommended, the incumbent) or 1b (score leader)?
2. **$249 structure**: replace the 50%-down cards (recommended) or add $249
   as a third option beside them? And is the $249 fully refundable?
3. **Email 06**: is the LED-skeptic story true of you? Confirm or it gets rewritten.
4. **Delivery date in email 08 and on `/play-again`**: state August 2027
   plainly, or let the configurator carry the date?
5. **Pro sold out**: with waitlist capture (recommended) or plain badge only?
6. **Start date**: Aug 18 assumes site changes ship by Aug 17. Push to Aug 20
   if that is tight.

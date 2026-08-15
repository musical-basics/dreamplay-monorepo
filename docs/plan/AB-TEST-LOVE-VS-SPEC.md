# AB Test: Love vs Spec (email + website 2x2, Aug-Sep 2026)

**Rev 2, 2026-08-14, per Lionel's direction.** Rev 1 (single love-vs-control split
with the $249 deposit shipped globally) is superseded: Lionel chose a **2x2**
so the deposit and the messaging are measured separately.

The questions this test answers:
1. Does love-of-the-piano positioning outperform our existing spec marketing?
2. Does a $249 deposit (plus a sold-out Pro) outperform the current offer?

Source research: [marketing-positioning-45-plus.md](../research/marketing-positioning-45-plus.md)
and [ab-test-august-10-findings.md](../research/ab-test-august-10-findings.md).

---

## 1. The 2x2

Base page: **2a (legacy-home, the original Dec 2025 homepage)**. The love page
is a rewrite of that same layout, so visual style stays constant and messaging
is the only thing that differs between columns.

| | Offer: current | Offer: $249 deposit + Pro sold out |
|---|---|---|
| **Message: SPEC** (existing marketing) | **6a** = `/legacy-home` as-is, `/customize` as-is | **6b** = `/legacy-home`, `/customize` shows $249 + Pro sold out |
| **Message: LOVE** (play the music you love) | **7a** = new `/play-again` rewrite | **7b** = `/play-again`, $249 + Pro sold out |

- Delivery date moves to **May 2027** everywhere public (was August 2027).
  This is global, all arms, not a test variable. January 2027 early-backer
  strings stay untouched.
- Emails: the 507 interested subscribers split **4 ways** (~127 each), one
  arm per cell. SPEC arms get the existing 8-email calendar; LOVE arms get 8
  rewritten emails. Within a message pair, only price-carrying emails differ
  (6a vs 6b, 7a vs 7b) plus the forced-variant links.
- Start: **Tue Aug 18**.

## 2. Website implementation

### 2.1 Registry (`config/ab.ts`)

- Groups 1, 2, 3, 5 set inactive (4 already is). 2a's history stays on the
  score sheet under 2a.
- New group 6 "Original homepage rerun": 6a and 6b, both route
  `/legacy-home` (the funnel validator allows shared routes; keys differ).
- New group 7 "Love of the piano": 7a and 7b, both route `/play-again`.
- All four get `since` = launch deploy time. Traffic splits 25/25/25/25.
- Testing mode stays ON.

### 2.2 Offer mode (the per-variant $249 + sold-out fork)

New helper `apps/web/src/lib/ab-offer.ts`: variant key → offer mode
(`"standard"` for 6a/7a and untagged visitors, `"deposit249"` for 6b/7b).

- `/customize` reads the variant (server cookie + client hook) and in
  deposit249 mode: the `solo` card becomes **$249 today, $750 + shipping at
  ship, $999 total**; the `full` bundle card becomes **$249 today, $850 at
  ship, $1,099 total**; the `reserve50` card is dropped (redundant next to a
  $249 headline); `reservation` ($99) stays hidden. Pro tiers render SOLD OUT
  with a Pro-waitlist email capture instead of a buy CTA. Includes the fix for
  the known `CustomizeClient.tsx:252` bypass that exempts pro tiers from
  filtering.
- `/dreamplay-pro` shows a sold-out banner + waitlist capture in deposit249
  mode (tag `Pro Waitlist`).
- **Middleware gains `?v=<key>` cookie stamping on any page** (today only
  `/ab` honors `?v=`), so email links like `/customize?v=6b` force the right
  arm. Unknown keys are ignored; real routes are never shadowed.
- New Shopify products for the $249 deposits (Admin API, `write_products`):
  one per catalog tier (One / Premium Bundle), 6 size-x-finish variants each,
  priced $249, balance invoiced at ship exactly like the 50% flow's second
  half. Variant IDs land in a `DEPOSIT249_VARIANT_MAP`.
  CAVEAT: cart permalinks require publishing, so the $249 products are
  publicly visible on the Online Store channel (same accepted trade-off as
  the $200 Pro upgrade product).
- Known gap, accepted: the shop subdomain (`shop.dreamplaypianos.com`) keeps
  the standard offer; the funnel drives to `/customize`, not /shop.

### 2.3 The love page `/play-again` (7a/7b)

A rewrite of legacy-home's structure with love-of-the-music copy, plus new
sections where no content exists (the "slides"): recognition ("Is the piano
still fun?"), named repertoire (the tenth, Wedding Day at Troldhaugen,
Rachmaninoff), and the return story (paraphrased buyer patterns, no names).
Hero: "Is the piano still fun?" / "Play the pieces you always wanted to
play." Noindex like all variant pages. Copy bank in
[marketing-positioning-45-plus.md](../research/marketing-positioning-45-plus.md) §4.
Offer-dependent copy on the page itself defers to `/customize` (the page
states $999 founder total, true in all arms).

### 2.4 May 2027 delivery sweep

All public "August 2027" strings → "May 2027": shop.ts tiers, /customize
catalog, FAQ, premium/extended pricing sections, shipping policy, intro-offer,
vip, FoundersBatchCapture, NewsletterPopup, RisksSection, buyers-guide,
DynamicProductionTimeline (TARGET_DELIVERY → 2027-05-15, clamp updated),
one-pro-delivery. Leave: all January 2027 backer-facing strings,
buyers.est_ship_date rule, bench preorder copy.

## 3. Email implementation

### 3.1 Four arms

Deterministic 4-way split of the rebuilt 507 snapshot:
`sha256(salt + subscriber_id) % 4`, salt chosen pre-send for the most even
split, frozen forever. Overrides in `app_settings` (Aug-10 pattern).

| Arm | Emails | Forced links carry |
|---|---|---|
| SPEC-6a | existing 8, re-dated | `?v=6a` |
| SPEC-6b | same 8, price email(s) rewritten for $249 | `?v=6b` |
| LOVE-7a | 8 new love emails | `?v=7a` |
| LOVE-7b | same 8, price email(s) rewritten for $249 | `?v=7b` |

Price-carrying email: only 08 states the deposit. 6b/7b's email 08 says $249
today / $750 at ship / $999 total. 6a/7a's email 08 keeps $499/$500/$999.
Email 06 (LED skeptic) still needs Lionel's true/false confirmation for the
SPEC arms.

### 3.2 Seeding and the calendar GUI

All 32 templates seeded as `campaigns` rows, category `marketing-calendar`,
named with an arm prefix (e.g. "MC 03 [LOVE 7b] ..."), send keys
`mc-<spec|love>-<6a|6b|7a|7b>-01..08`, scheduled per 3.3 so
**/admin/marketing-calendar shows every variation** (4 cards per slot day).
The old 8 templates (`marketing-calendar-2026-01..08`) are retired
(status=deleted, category `marketing-calendar-retired`), their copy carried
into the new SPEC rows. Coupon trigger stays OFF for the whole test.

### 3.3 Schedule

Slots on Tue/Thu/Sun 9:00 AM ET: Aug 18, 20, 23, 25, 27, 30, Sep 1, Sep 3.
All four arms send the same slot the same morning via one script invocation
(`send-marketing-love-ab.mjs`, Aug-10 guarantees: child campaigns per arm,
suppression, sent_history idempotency, em-dash guard, `--test`).
Readout ~Sep 10.

## 4. Measurement

Same instruments as rev 1 (campaign-stats dashboard, sid/cid purchase
attribution, /admin/ab-tests score sheet, daily PDF). The 2x2 adds:

- **Message effect**: pool 6a+6b vs 7a+7b (emails: SPEC arms vs LOVE arms).
- **Offer effect**: pool 6a+7a vs 6b+7b.
- Interaction: read directionally only; ~127/arm cannot power it.

Pre-registered readings unchanged from rev 1 §4: attributed deposits first,
then begin_checkout/configurations, then unique click rates per slot pair;
compare by rate; single-digit purchase counts expected; if all four arms stay
at zero deposits, messaging is not the binding constraint and the next test is
price/product (§7a Go vs instalments).

## 5. Guardrails

Unchanged from rev 1 plus: never edit any of the 32 templates after slot 01
sends; salt frozen after slot 01; coupon OFF; all 32 emails [TEST]-sent to
musicalbasics@gmail.com for approval before slot 01; no em dashes; own-domain
links; no fabricated stories or invented numbers; no buyer names/verbatims in
public copy; admin_ips current before launch; AB Test August 10's 4 buyer
templates remain untouched.

## 6. Execution checklist

Phase A: platform
- [x] Registry groups 6/7, pause 1/2/3/5 (2026-08-14, commit 00b1eec)
- [x] `?v=` stamping on any deep link (packages/ab funnel.ts + tests)
- [x] `ab-offer.ts` + /customize offer fork + pro filter fix
- [x] May 2027 sweep (14 files; Jan 2027 backer strings untouched)
- [x] Shopify $249 products created + DEPOSIT249_VARIANT_MAP (products
      10398999642426 / 10398999675194, 12 variants @ $249, no-shipping)
- [x] /dreamplay-pro sold-out banner + Pro Waitlist capture (deposit249 only)
Phase B: love page
- [x] `/play-again` built, noindex, registered as 7a/7b
Phase C: emails
- [x] 8 LOVE emails drafted (scripts/email/setup-love-vs-spec-emails.mjs)
- [x] 32 templates seeded (send keys mc-<spec|love>-<arm>-01..08, Aug 18 -
      Sep 3, 4 per slot day on /admin/marketing-calendar); old 8 retired
- [ ] Email 06 confirmed by Lionel (SPEC arms; swap angle if untrue)
Phase D: split + approval
- [ ] Audience snapshot REBUILT on send day (run
      `node scripts/email/setup-marketing-calendar.mjs --audience-only`)
- [x] `send-love-vs-spec.mjs` with frozen 4-way salt
- [ ] [TEST] emails approved by Lionel (per slot: `--slot N --test musicalbasics@gmail.com`)
Phase E: run from Aug 18 (`--slot N --execute` each slot morning); readout
~Sep 10 in docs/research/. Coupon trigger confirmed OFF (no setting rows).

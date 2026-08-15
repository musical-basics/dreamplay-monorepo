/**
 * Published target delivery for the DreamPlay One Pro. This used to compute a
 * rolling "one year from today" date; as of 2026-08-14 the Pro quotes the
 * fixed published target instead. Keep this in sync with the delivery strings
 * in src/config/shop.ts whenever the target moves.
 */
const ONE_PRO_TARGET_DELIVERY = "May 2027";

export function formatOneProTargetDeliveryDate(_fromDate = new Date()) {
    return ONE_PRO_TARGET_DELIVERY;
}

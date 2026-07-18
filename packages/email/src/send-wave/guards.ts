/**
 * Pre-send guards. Every one exists because a real send broke in a specific
 * way the guard now prevents. Don't strip without reading the incident that
 * introduced the rule (see docs/reference/email-3.md).
 */

/** Reject em dashes (— or the mdash entity). Standing style rule. */
export function assertNoEmDash(content: string, label: string): void {
    if (content.includes("—") || content.includes("mdash")) {
        throw new Error(`em dash in ${label}`);
    }
}

/** Reject unresolved template placeholders that should be filled pre-send. */
export function assertNoPlaceholders(
    content: string,
    label: string,
    placeholders: string[] = ["LANDING_PAGE_URL", "TODO_REPLACE", "subscriber.first_name"]
): void {
    for (const p of placeholders) {
        if (content.includes(p)) throw new Error(`unresolved placeholder "${p}" in ${label}`);
    }
}

/** scheduledAt must be at least marginMs in the future (default 1 minute). */
export function assertScheduledFresh(scheduledAt: string, marginMs = 60_000): void {
    const t = new Date(scheduledAt).getTime();
    if (Number.isNaN(t)) throw new Error(`scheduledAt "${scheduledAt}" is not a valid ISO timestamp`);
    if (t < Date.now() + marginMs) {
        throw new Error(`scheduledAt ${scheduledAt} is too close to now (must be >= ${marginMs}ms in the future)`);
    }
}

/**
 * Invalid-email pre-filter (legacy had this only in ad-hoc scripts; a `#` in
 * a local part and missing TLDs both crashed past bulk sends mid-flight).
 */
const EMAIL_RE = /^[A-Za-z0-9._+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
export function isValidEmail(email: string): boolean {
    return EMAIL_RE.test(email || "");
}

/** Canonicalize for de-dup keys (gmail dot-trick + plus-suffix collapse). */
export function canonicalEmail(email: string): string {
    const e = (email || "").trim().toLowerCase();
    const at = e.indexOf("@");
    if (at < 0) return e;
    const local = e.slice(0, at);
    const domain = e.slice(at + 1);
    if (domain === "gmail.com" || domain === "googlemail.com") {
        return `${local.split("+")[0]!.replace(/\./g, "")}@gmail.com`;
    }
    return e;
}

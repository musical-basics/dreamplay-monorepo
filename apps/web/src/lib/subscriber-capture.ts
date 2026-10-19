/**
 * Website email capture → `subscribers` (D20).
 *
 * Until 2026-10-19 every site form posted to the legacy dreamplay-email-2
 * webhook at email.dreamplaypianos.com/api/webhooks/subscribe. Cutover
 * (2026-07-18) pointed that host at this app, which has no such route, so
 * every capture 404'd and the forms showed "Failed to subscribe". The rules
 * below are that webhook's, adapted to this schema: `email` is unique across
 * workspaces here (citext), so an existing row is merged wherever it lives
 * instead of upserting on (email, workspace).
 *
 * Kept pure so the merge rules are testable; the server action does the I/O.
 */

/** Workspace for new website captures (the legacy webhook's default). */
export const CAPTURE_WORKSPACE = "dreamplay_marketing";

/** Legacy webhook's default when a form sends no tags. */
export const DEFAULT_CAPTURE_TAGS = ["Website Import"];

/** A capture never re-activates someone who opted out or can't receive mail. */
const KEEP_STATUSES = new Set(["unsubscribed", "bounced", "complained"]);

export interface ExistingSubscriber {
    id: string;
    tags: string[] | null;
    status: string;
    first_name: string | null;
    workspace: string;
}

export interface CaptureInput {
    email: string;
    firstName?: string;
    tags?: string[];
    /** ISO country code from x-vercel-ip-country; "Unknown" is ignored. */
    countryCode?: string | null;
}

export type CapturePlan =
    | {
          kind: "insert";
          row: {
              email: string;
              first_name: string;
              tags: string[];
              status: "active";
              workspace: string;
              country_code?: string;
          };
      }
    | {
          kind: "update";
          id: string;
          patch: { tags: string[]; first_name?: string; status?: "active" };
      };

export function normalizeCaptureEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function captureTags(tags: string[] | undefined): string[] {
    const clean = Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
    return clean.length ? clean : DEFAULT_CAPTURE_TAGS;
}

export function planSubscriberCapture(existing: ExistingSubscriber | null, input: CaptureInput): CapturePlan {
    const tags = captureTags(input.tags);
    const firstName = (input.firstName ?? "").trim();

    if (!existing) {
        const countryCode = input.countryCode && input.countryCode !== "Unknown" ? input.countryCode : undefined;
        return {
            kind: "insert",
            row: {
                email: normalizeCaptureEmail(input.email),
                first_name: firstName,
                tags,
                status: "active",
                workspace: CAPTURE_WORKSPACE,
                ...(countryCode ? { country_code: countryCode } : {}),
            },
        };
    }

    const patch: Extract<CapturePlan, { kind: "update" }>["patch"] = {
        tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
    };
    // Fill a missing first name; never overwrite one already on file.
    if (firstName && !existing.first_name?.trim()) patch.first_name = firstName;
    if (existing.status !== "active" && !KEEP_STATUSES.has(existing.status)) patch.status = "active";

    return { kind: "update", id: existing.id, patch };
}

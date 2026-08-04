import { redirect } from "next/navigation";
import { processUnsubscribe, verifyUnsubscribeToken } from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";

/**
 * /unsubscribe?s=<subscriberId>&c=<campaignId>&t=<hmac>
 *
 * Human-facing unsubscribe confirm page (the footer link in every email).
 * The confirm button runs a server action that performs the unsubscribe
 * (suppressions + subscribers.status + email_events). One-click mail-client
 * unsubscribes POST to /api/email/unsubscribe instead (RFC 8058 header URL).
 *
 * Legacy compatibility: emails sent by dreamplay-email-3 (pre-cutover) link
 * to /unsubscribe?s=<subscriberId>&c=<campaignId>&w=<workspace> with NO
 * signature — those links must keep unsubscribing after the tracking hosts
 * move here. An unsigned link is accepted only in that exact legacy shape
 * (w present, t absent). Same trust level as the legacy system had.
 */

export const metadata = {
    title: "Unsubscribe – DreamPlay",
    robots: { index: false },
};

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[#050505] min-h-screen text-white flex items-center justify-center px-6">
            <div className="max-w-md w-full border border-white/10 bg-white/[0.03] p-8 md:p-10 text-center">
                {children}
            </div>
        </div>
    );
}

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const subscriberId = firstParam(params.s);
    const campaignId = firstParam(params.c);
    const token = firstParam(params.t);
    const workspace = firstParam(params.w);
    const done = firstParam(params.done) === "1";

    const isLegacyLink = !token && workspace.length > 0;
    const validLink =
        UUID_RE.test(subscriberId) &&
        (isLegacyLink || verifyUnsubscribeToken(token, subscriberId, campaignId));

    if (!validLink) {
        return (
            <Shell>
                <h1 className="font-serif text-2xl mb-4">Invalid unsubscribe link</h1>
                <p className="font-sans text-sm text-white/60 leading-relaxed">
                    This link is missing or has an invalid signature. Please use the unsubscribe link from a
                    recent email, or contact us and we will remove you manually.
                </p>
            </Shell>
        );
    }

    if (done) {
        return (
            <Shell>
                <h1 className="font-serif text-2xl mb-4">You are unsubscribed</h1>
                <p className="font-sans text-sm text-white/60 leading-relaxed">
                    You will no longer receive marketing emails from us. Unsubscribed by mistake? Reply to any
                    of our previous emails and we will re-add you.
                </p>
            </Shell>
        );
    }

    async function confirmUnsubscribe() {
        "use server";
        // Re-verify inside the action: the form values are attacker-controlled.
        const legacyOk = !token && workspace.length > 0;
        if (!UUID_RE.test(subscriberId) || (!legacyOk && !verifyUnsubscribeToken(token, subscriberId, campaignId))) {
            return;
        }
        await processUnsubscribe(getAdminDb(), {
            subscriberId,
            campaignId: UUID_RE.test(campaignId) ? campaignId : null,
            source: "page",
        });
        redirect(
            `/unsubscribe?s=${encodeURIComponent(subscriberId)}&c=${encodeURIComponent(campaignId)}${legacyOk ? `&w=${encodeURIComponent(workspace)}` : `&t=${encodeURIComponent(token)}`}&done=1`
        );
    }

    return (
        <Shell>
            <h1 className="font-serif text-2xl mb-4">Unsubscribe from our emails?</h1>
            <p className="font-sans text-sm text-white/60 leading-relaxed mb-8">
                You will stop receiving marketing emails from DreamPlay and MusicalBasics. Transactional
                emails about orders you have placed are unaffected.
            </p>
            <form action={confirmUnsubscribe}>
                <button
                    type="submit"
                    className="w-full bg-white text-black font-sans text-sm uppercase tracking-widest py-3 hover:bg-white/80 transition-colors"
                >
                    Yes, unsubscribe me
                </button>
            </form>
            <p className="font-sans text-xs text-white/30 mt-6">
                Changed your mind? Just close this page — nothing happens until you confirm.
            </p>
        </Shell>
    );
}

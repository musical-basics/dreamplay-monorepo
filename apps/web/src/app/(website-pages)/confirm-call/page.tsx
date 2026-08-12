import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAdminDb } from "@/lib/db";
import { parseConfirmToken } from "@/lib/call-confirm-token";
import { formatIn, tzAbbrev, LIONEL_TZ } from "@/lib/call-scheduling";
import { ConfirmCallForm } from "./ConfirmCallForm";

/**
 * /confirm-call?t=<signed token>: the buyer accepts (or declines) the time
 * Lionel proposed. Confirming is what unlocks the Zoom link, which a
 * separate sender emails out, so no meeting is ever created for a call
 * nobody agreed to.
 */

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Confirm our call | DreamPlay Pianos",
    robots: { index: false, follow: false },
};

function Invalid() {
    return (
        <section className="max-w-2xl mx-auto px-6 pt-40 pb-32 text-center">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-6">This link is not valid.</h1>
            <p className="font-sans text-base text-white/60 leading-relaxed">
                Please use the link from my email, or just write to{" "}
                <a href="mailto:support@dreamplaypianos.com" className="text-white/80 underline">
                    support@dreamplaypianos.com
                </a>
                .
            </p>
        </section>
    );
}

export default async function ConfirmCallPage({
    searchParams,
}: {
    searchParams: Promise<{ t?: string }>;
}) {
    const { t } = await searchParams;
    const requestId = parseConfirmToken(t);

    let content: React.ReactNode;
    if (!requestId) {
        content = <Invalid />;
    } else {
        const db = getAdminDb();
        const { data: row } = await db
            .from("buyer_call_requests")
            .select("id, scheduled_at, timezone, contact_method, contact_value, confirmed_at, declined_at")
            .eq("id", requestId)
            .maybeSingle();

        if (!row || !row.scheduled_at) {
            content = <Invalid />;
        } else {
            const when = new Date(row.scheduled_at);
            const tz = row.timezone || LIONEL_TZ;
            content = (
                <div className="max-w-2xl mx-auto px-6 pt-36 pb-28">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                        Our call
                    </p>
                    <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                        Does this time work?
                    </h1>

                    <div className="border border-white/15 bg-white/[0.03] rounded-xl p-6 mb-8">
                        <p className="font-sans text-2xl text-white mb-1">
                            {formatIn(when, tz, { weekday: "long", month: "long" })}
                        </p>
                        <p className="font-sans text-sm text-white/50">
                            {tzAbbrev(when, tz)} · about 15 minutes ·{" "}
                            {row.contact_method === "zoom"
                                ? "on Zoom"
                                : row.contact_method === "whatsapp"
                                  ? "on WhatsApp"
                                  : "by phone"}
                        </p>
                    </div>

                    <ConfirmCallForm
                        token={t!}
                        alreadyConfirmed={Boolean(row.confirmed_at)}
                        alreadyDeclined={Boolean(row.declined_at)}
                        isZoom={row.contact_method === "zoom"}
                    />
                </div>
            );
        }
    }

    return (
        <div className="min-h-screen font-sans bg-[#050505] text-white selection:bg-blue-500/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />
            <main>{content}</main>
            <Footer />
        </div>
    );
}

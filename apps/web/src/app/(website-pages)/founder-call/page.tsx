import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAdminDb } from "@/lib/db";
import {
    CALL_REWARD_USD,
    CALL_TIME_OPTIONS,
    armHasIncentive,
    armMethod,
    buildResearchPath,
    buildSurveyFallbackPath,
    parseResearchToken,
    researchArm,
} from "@/lib/buyer-research";
import { CallRequestForm } from "./CallRequestForm";

/**
 * /founder-call?t=<signed token>: the founder call invite (arms B1/B2 only;
 * survey-arm visitors are redirected to their survey). B1 earns $10 store
 * credit after the call; B2 sees no reward copy. Buyers who would rather
 * not talk get the survey as a fallback link.
 */

export const dynamic = "force-dynamic";

export const metadata = {
    title: "A Call with Lionel | DreamPlay Pianos",
    robots: { index: false, follow: false },
};

function InvalidLink() {
    return (
        <section className="max-w-2xl mx-auto px-6 pt-40 pb-32 text-center">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-6">This link is not valid.</h1>
            <p className="font-sans text-base text-white/60 leading-relaxed">
                Please use the personal link from your DreamPlay email, or write to{" "}
                <a href="mailto:support@dreamplaypianos.com" className="text-white/80 underline">support@dreamplaypianos.com</a>.
            </p>
        </section>
    );
}

export default async function FounderCallPage({
    searchParams,
}: {
    searchParams: Promise<{ t?: string }>;
}) {
    const { t } = await searchParams;
    const buyerId = parseResearchToken(t);

    let content: React.ReactNode;
    if (!buyerId) {
        content = <InvalidLink />;
    } else if (armMethod(researchArm(buyerId)) !== "call") {
        redirect(buildResearchPath(buyerId));
    } else {
        const db = getAdminDb();
        const [{ data: buyer }, { data: existing }] = await Promise.all([
            db.from("buyers").select("id").eq("id", buyerId).maybeSingle(),
            db.from("buyer_call_requests").select("id").eq("buyer_id", buyerId).maybeSingle(),
        ]);
        if (!buyer) {
            content = <InvalidLink />;
        } else {
            const withCredit = armHasIncentive(researchArm(buyerId));
            content = (
                <div className="max-w-2xl mx-auto px-6 pt-36 pb-28">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                        15 minutes with the founder
                        {withCredit && <> &nbsp;&middot;&nbsp; ${CALL_REWARD_USD} store credit</>}
                    </p>
                    <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                        Talk to Lionel about your DreamPlay One.
                    </h1>
                    <p className="font-sans text-base text-white/60 leading-relaxed mb-3">
                        You ordered an instrument that does not exist anywhere else, and Lionel wants to hear the story
                        behind that decision directly from you: what you play, what made you order, and what you are
                        hoping for. Fifteen minutes, no preparation needed, no sales pitch.
                    </p>
                    {withCredit ? (
                        <p className="font-sans text-base text-white/60 leading-relaxed mb-12">
                            As a thank you for your time, <strong className="text-white">${CALL_REWARD_USD} of
                            DreamPlay store credit</strong> is added to your account after the call. Two taps below and
                            you are booked.
                        </p>
                    ) : (
                        <p className="font-sans text-base text-white/60 leading-relaxed mb-12">
                            Two taps below and you are booked.
                        </p>
                    )}
                    <CallRequestForm
                        token={t!}
                        timeOptions={CALL_TIME_OPTIONS}
                        alreadyRequested={Boolean(existing)}
                        showReward={withCredit}
                    />
                    <p className="font-sans text-sm text-white/50 leading-relaxed mt-12 border-t border-white/10 pt-8">
                        Don&apos;t feel like calling?{" "}
                        <a href={buildSurveyFallbackPath(buyerId)} className="text-blue-400 underline hover:text-blue-300">
                            Fill out this survey
                        </a>{" "}
                        instead. We would love to hear from you!
                    </p>
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

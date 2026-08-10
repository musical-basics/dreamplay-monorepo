import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAdminDb } from "@/lib/db";
import {
    SURVEY_QUESTIONS,
    SURVEY_REWARD_USD,
    armHasIncentive,
    loadArmOverrides,
    parseResearchToken,
    resolveArm,
} from "@/lib/buyer-research";
import { SurveyForm } from "./SurveyForm";

/**
 * /buyer-survey?t=<signed token>: the research survey. Primary page for the
 * survey arms (A1/A2) and the fallback for call-arm buyers (B1/B2) who
 * would rather not talk. Credit arms (A1, B1) earn $5 store credit on
 * completion; no-incentive arms see no reward copy.
 */

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Your DreamPlay Survey | DreamPlay Pianos",
    robots: { index: false, follow: false },
};

function InvalidLink() {
    return (
        <section className="max-w-2xl mx-auto px-6 pt-40 pb-32 text-center">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-6">This link is not valid.</h1>
            <p className="font-sans text-base text-white/60 leading-relaxed">
                Please use the personal link from my email, or just write to{" "}
                <a href="mailto:support@dreamplaypianos.com" className="text-white/80 underline">support@dreamplaypianos.com</a>.
            </p>
        </section>
    );
}

export default async function BuyerSurveyPage({
    searchParams,
}: {
    searchParams: Promise<{ t?: string }>;
}) {
    const { t } = await searchParams;
    const buyerId = parseResearchToken(t);

    let content: React.ReactNode;
    if (!buyerId) {
        content = <InvalidLink />;
    } else {
        const db = getAdminDb();
        const [{ data: buyer }, { data: existing }] = await Promise.all([
            db.from("buyers").select("id").eq("id", buyerId).maybeSingle(),
            db.from("buyer_survey_responses").select("id").eq("buyer_id", buyerId).maybeSingle(),
        ]);
        if (!buyer) {
            content = <InvalidLink />;
        } else {
            const withCredit = armHasIncentive(resolveArm(buyerId, await loadArmOverrides(db)));
            content = (
                <div className="max-w-2xl mx-auto px-6 pt-36 pb-28">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                        A quick question &nbsp;&middot;&nbsp; 2 minutes
                        {withCredit && <> &nbsp;&middot;&nbsp; ${SURVEY_REWARD_USD} store credit</>}
                    </p>
                    <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                        I&rsquo;d love to hear from you.
                    </h1>
                    <p className="font-sans text-base text-white/60 leading-relaxed mb-3">
                        You ordered a DreamPlay One long before most people have even had a chance to see one in
                        person. I&rsquo;d really like to understand what made you decide to take a chance on us.
                    </p>
                    {withCredit ? (
                        <p className="font-sans text-base text-white/60 leading-relaxed mb-12">
                            Nine questions, a couple of minutes. As a thank you for doing it,{" "}
                            <strong className="text-white">${SURVEY_REWARD_USD} of DreamPlay store credit</strong> goes
                            into your account as soon as you submit.
                        </p>
                    ) : (
                        <p className="font-sans text-base text-white/60 leading-relaxed mb-12">
                            Nine questions, a couple of minutes. I&rsquo;ll personally be reading the responses.
                        </p>
                    )}
                    <SurveyForm
                        token={t!}
                        questions={SURVEY_QUESTIONS}
                        alreadySubmitted={Boolean(existing)}
                        showReward={withCredit}
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

import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAdminDb } from "@/lib/db";
import {
    SURVEY_QUESTIONS,
    buildResearchPath,
    parseResearchToken,
    researchVariant,
} from "@/lib/buyer-research";
import { SurveyForm } from "./SurveyForm";

/**
 * /buyer-survey?t=<signed token>: research variant A. A short questionnaire
 * about who the buyer is and why they ordered; $5 off on completion.
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
                Please use the personal link from your DreamPlay email, or write to{" "}
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
    } else if (researchVariant(buyerId) !== "survey") {
        // Wrong page for this buyer's variant: send them to their own.
        redirect(buildResearchPath(buyerId));
    } else {
        const db = getAdminDb();
        const [{ data: buyer }, { data: existing }] = await Promise.all([
            db.from("buyers").select("id").eq("id", buyerId).maybeSingle(),
            db.from("buyer_survey_responses").select("id").eq("buyer_id", buyerId).maybeSingle(),
        ]);
        if (!buyer) {
            content = <InvalidLink />;
        } else {
            content = (
                <div className="max-w-2xl mx-auto px-6 pt-36 pb-28">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                        DreamPlay Buyer Survey &nbsp;&middot;&nbsp; 2 minutes &nbsp;&middot;&nbsp; $5 off
                    </p>
                    <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                        Help us build this right.
                    </h1>
                    <p className="font-sans text-base text-white/60 leading-relaxed mb-3">
                        You are one of the first people in the world to order a DreamPlay One, and that makes your
                        perspective priceless. These few questions tell us who this instrument is really for and what
                        matters most to you.
                    </p>
                    <p className="font-sans text-base text-white/60 leading-relaxed mb-12">
                        As a thank you, <strong className="text-white">$5 off your order</strong> is applied
                        automatically when you submit.
                    </p>
                    <SurveyForm token={t!} questions={SURVEY_QUESTIONS} alreadySubmitted={Boolean(existing)} />
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

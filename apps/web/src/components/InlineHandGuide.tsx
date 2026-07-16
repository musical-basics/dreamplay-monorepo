"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { FileText, CheckCircle2, Loader2 } from "lucide-react";

const PDF_URL = "https://www.dropbox.com/scl/fi/9b72rbi4ga0pjterxyoan/DreamPlay-Infographic.pdf?rlkey=mc08i1ahn5tp3thdd0qjnag2d&st=olbh1t9w&dl=1";

export function InlineHandGuide() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const tempSession = typeof window !== "undefined"
                ? localStorage.getItem("dp_temp_session") || undefined
                : undefined;

            const res = await subscribeToNewsletter({
                email,
                first_name: "",
                tags: ["Hand Guide Download"],
                temp_session_id: tempSession,
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to subscribe");
            }

            localStorage.setItem("dp_v2_subscribed", "true");
            localStorage.setItem("dp_user_email", email);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);

            trackEmailConversion('conversion_t1', window.location.pathname);
            setIsSuccess(true);

            // Auto-open the PDF
            window.open(PDF_URL, "_blank");
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="my-12 mx-auto max-w-2xl border border-teal-500/20 bg-teal-500/5 p-8 md:p-10 text-center">
                <div className="mx-auto bg-teal-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-teal-500" size={24} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl text-neutral-900 mb-2">Your guide is downloading!</h3>
                <p className="font-sans text-sm text-neutral-500 leading-relaxed">
                    Check your new tab for the PDF. Print it out, place your hand on the guide, and discover your ideal key size.
                </p>
            </div>
        );
    }

    return (
        <div className="my-12 mx-auto max-w-2xl border border-neutral-200 bg-neutral-50 p-8 md:p-10">
            <div className="flex items-start gap-4">
                <div className="hidden sm:flex shrink-0 bg-white border border-neutral-200 w-12 h-12 rounded-full items-center justify-center">
                    <FileText className="text-neutral-700" size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                    <h3 className="font-serif text-lg text-neutral-900 mb-1">
                        Not sure if you need the DS5.5 or the DS6.0?
                    </h3>
                    <p className="font-sans text-sm text-neutral-500 leading-relaxed mb-4">
                        We created a 1:1 scale <strong className="text-neutral-700">Printable Hand Guide</strong>. Print it out, place your hand on the paper, and see exactly which size fits your biology perfectly.
                    </p>

                    {error && (
                        <div className="mb-3 p-2 border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-sans text-center rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your email to download"
                            className="flex-1 px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:ring-1 focus:ring-black focus:border-black outline-none font-sans text-sm"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 bg-black text-white font-sans text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors disabled:opacity-70 cursor-pointer whitespace-nowrap"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Get Free PDF"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

import { redirect } from "next/navigation";
import { getServerDb } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReservationDecisionModule from "./ReservationDecisionModule";
import ReservationPageClient from "./ReservationPageClient";
import { getReservationDecision, isBuyer } from "@/actions/reservation-actions";
import { getLatestOrderForEmail, sizeLabel } from "@/lib/shopify/admin";

export const metadata = {
    title: "My Reservation | DreamPlay Pianos",
    description: "Manage your DreamPlay reservation and choose your next steps.",
    robots: { index: false, follow: false }, // private buyer page — keep out of search
};

export default async function MyReservationPage() {
    const supabase = await getServerDb();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
        redirect("/login?next=/my-reservation");
    }

    // Non-buyers should not see this page — send them to the VIP page
    if (!user.email || !(await isBuyer(user.email))) {
        redirect("/vip");
    }

    // Fetch existing decision server-side
    const existingDecision = await getReservationDecision(user.id);

    // Pull the buyer's actual order config (size/finish) live from Shopify so the
    // page shows what they ordered — no more guessing from generic milestone copy.
    const order = await getLatestOrderForEmail(user.email);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-32 pb-24">
                <div className="max-w-4xl mx-auto px-6">

                    {/* Page Header */}
                    <div className="mb-14">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">
                            DreamPlay Pianos · Early Backer Portal
                        </p>
                        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white mb-5">
                            Your Reservation
                        </h1>
                        <p className="font-sans text-sm text-white/40">{user.email}</p>
                    </div>

                    {/* ── Your Order (live from Shopify) ── */}
                    {order && order.items.length > 0 && (
                        <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10 mb-12">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6">
                                Your Order · {order.orderName}
                            </p>
                            <div className="space-y-4">
                                {order.items.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                                    >
                                        <h3 className="font-serif text-xl text-white">{item.title}</h3>
                                        <div className="flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-white/60">
                                            {item.size && (
                                                <span>
                                                    Size:{" "}
                                                    <span className="text-white">
                                                        {item.size}
                                                        {sizeLabel(item.size) ? ` (${sizeLabel(item.size)})` : ""}
                                                    </span>
                                                </span>
                                            )}
                                            {item.finish && (
                                                <span>
                                                    Finish: <span className="text-white">{item.finish}</span>
                                                </span>
                                            )}
                                            {item.quantity > 1 && (
                                                <span>
                                                    Qty: <span className="text-white">{item.quantity}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="font-sans text-xs text-white/30 mt-6">
                                This is the configuration on file for your reservation. If anything looks off,{" "}
                                <a href="/contact" className="underline hover:text-white/60">contact us</a>.
                            </p>
                        </div>
                    )}

                    {/* ── Reservation Decision Module ── */}
                    <ReservationDecisionModule
                        userId={user.id}
                        email={user.email}
                        existingDecision={existingDecision}
                    />

                    {/* Divider */}
                    <div className="h-px bg-white/5 my-16" />

                    {/* Production Timeline */}
                    <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10 mb-12">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6">Production Status</p>
                        <h2 className="font-serif text-2xl text-white mb-6">Your DreamPlay One Timeline</h2>

                        {/* Estimated delivery highlight */}
                        <div className="border border-amber-400/30 bg-amber-400/[0.06] px-6 py-5 mb-10">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-300/80 mb-1">Estimated Ship Date</p>
                            <p className="font-serif text-2xl text-white">January 2027</p>
                            <p className="font-sans text-xs text-white/40 mt-2">The first full prototype is being built now. We expect a working prototype by the end of July, with official manufacturing beginning in November 2026.</p>
                        </div>

                        <div className="space-y-0">
                            {/* Stage 1 */}
                            <div className="flex gap-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-none border border-white/20 bg-white flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="w-px h-full bg-white/10 min-h-[48px]" />
                                </div>
                                <div className="pb-8">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Stage 1 — Complete</p>
                                    <h3 className="font-sans font-bold text-white text-sm">Design &amp; Prototyping</h3>
                                    <p className="font-sans text-xs text-white/40 mt-1">Finalized the patented 7/8 and 15/16 key designs and acoustic profiles.</p>
                                </div>
                            </div>

                            {/* Stage 2 */}
                            <div className="flex gap-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-none border border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                    <div className="w-px h-full bg-white/10 min-h-[48px]" />
                                </div>
                                <div className="pb-8">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Stage 2 — In Progress</p>
                                    <h3 className="font-sans font-bold text-white text-sm">Prototype &amp; Validation</h3>
                                    <p className="font-sans text-xs text-white/40 mt-1">Building the first full prototype to validate the key action, sensors and electronics. Working prototype expected end of July 2026, with video to follow in August.</p>
                                </div>
                            </div>

                            {/* Stage 3 */}
                            <div className="flex gap-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-none border border-white/10 bg-transparent flex items-center justify-center flex-shrink-0">
                                        <span className="w-2 h-2 rounded-full bg-white/20" />
                                    </div>
                                    <div className="w-px h-full bg-white/10 min-h-[48px]" />
                                </div>
                                <div className="pb-8">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/20 mb-1">Stage 3 — Pending · Targeted November 2026</p>
                                    <h3 className="font-sans font-bold text-white/50 text-sm">Manufacturing &amp; Final Assembly</h3>
                                    <p className="font-sans text-xs text-white/30 mt-1">Official manufacturing begins, followed by quality assurance and final instrument assembly.</p>
                                </div>
                            </div>

                            {/* Stage 4 */}
                            <div className="flex gap-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-none border border-white/10 bg-transparent flex items-center justify-center flex-shrink-0">
                                        <span className="w-2 h-2 rounded-full bg-white/20" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-amber-300/60 mb-1">Stage 4 — Estimated: January 2027</p>
                                    <h3 className="font-sans font-bold text-white/50 text-sm">Shipping &amp; Delivery</h3>
                                    <p className="font-sans text-xs text-white/30 mt-1">Your DreamPlay One arrives at your door.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions / Contact nudge */}
                    <div className="border border-white/5 bg-white/[0.02] p-8 text-center mb-8">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Questions?</p>
                        <p className="font-sans text-sm text-white/50 mb-5 max-w-md mx-auto">
                            If you have any questions about your reservation or the options above, please reach out — we&apos;re happy to help.
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-2 border border-white/20 px-8 py-3 font-sans text-xs uppercase tracking-widest text-white/60 hover:text-white hover:border-white/40 transition-colors"
                        >
                            Contact Us
                        </a>
                    </div>

                    {/* Sign Out */}
                    <ReservationPageClient />

                </div>
            </main>

            <Footer />
        </div>
    );
}

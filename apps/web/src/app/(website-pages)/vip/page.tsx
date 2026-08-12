import { redirect } from "next/navigation";
import { getServerDb } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import VIPDashboardClient from "./VIPDashboardClient";
import PromoCodeBox from "./PromoCodeBox";
import { isBuyer } from "@/actions/reservation-actions";
import { WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

export default async function VIPPage() {
    const supabase = await getServerDb();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
        redirect("/login");
    }

    // Buyers belong on /my-reservation — redirect them automatically
    if (user.email && await isBuyer(user.email)) {
        redirect("/my-reservation");
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-32 pb-20">
                <div className="max-w-6xl mx-auto px-6">

                    {/* Header */}
                    <div className="mb-16">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Founder&apos;s Club</p>
                        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white mb-4">
                            Welcome to the Founder&apos;s Club.
                        </h1>
                        <p className="font-sans text-base text-green-400 font-medium mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Your account officially qualifies for the DreamPlay Waitlist credit.
                        </p>
                        <p className="mb-3 max-w-2xl font-sans text-xs leading-relaxed text-white/35">{WAITLIST_OFFER_TERMS}</p>
                        <p className="font-sans text-sm text-white/40">{user.email}</p>
                    </div>

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-2 gap-8">

                        {/* ── Column 1: Code Box + Upsell ── */}
                        <div className="space-y-8">
                            {/* Promo Code Box */}
                            <PromoCodeBox />

                            {/* Future Upsell */}
                            <div className="border border-dashed border-white/10 p-8 text-center">
                                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Member Exclusive</p>
                                <h3 className="font-serif text-lg text-white/50 mb-1">The Lifetime Vault</h3>
                                <p className="font-sans text-xs text-white/30">Coming Soon</p>
                            </div>
                        </div>

                        {/* ── Column 2: Production Tracker ── */}
                        <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6">Production Status</p>
                            <h3 className="font-serif text-2xl text-white mb-10">Your DreamPlay One Timeline</h3>

                            <div className="space-y-0">
                                {/* Stage 1: Completed */}
                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-none border border-white/20 bg-white flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <div className="w-px h-full bg-white/10 min-h-[48px]"></div>
                                    </div>
                                    <div className="pb-8">
                                        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Stage 1 — Complete</p>
                                        <h4 className="font-sans font-bold text-white text-sm">Design &amp; Prototyping</h4>
                                        <p className="font-sans text-xs text-white/40 mt-1">Finalized the patented 7/8 and 15/16 key designs and acoustic profiles.</p>
                                    </div>
                                </div>

                                {/* Stage 2: In Progress */}
                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-none border border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0 relative">
                                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                                        </div>
                                        <div className="w-px h-full bg-white/10 min-h-[48px]"></div>
                                    </div>
                                    <div className="pb-8">
                                        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Stage 2 — In Progress</p>
                                        <h4 className="font-sans font-bold text-white text-sm">Steel Tooling &amp; Molds</h4>
                                        <p className="font-sans text-xs text-white/40 mt-1">Currently casting the custom 15/16th keys.</p>
                                    </div>
                                </div>

                                {/* Stage 3: Pending */}
                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-none border border-white/10 bg-transparent flex items-center justify-center flex-shrink-0">
                                            <span className="w-2 h-2 rounded-full bg-white/20"></span>
                                        </div>
                                        <div className="w-px h-full bg-white/10 min-h-[48px]"></div>
                                    </div>
                                    <div className="pb-8">
                                        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/20 mb-1">Stage 3 — Pending</p>
                                        <h4 className="font-sans font-bold text-white/50 text-sm">Final Assembly</h4>
                                        <p className="font-sans text-xs text-white/30 mt-1">Quality assurance and final instrument assembly.</p>
                                    </div>
                                </div>

                                {/* Stage 4: Target */}
                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-none border border-white/10 bg-transparent flex items-center justify-center flex-shrink-0">
                                            <span className="w-2 h-2 rounded-full bg-white/20"></span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/20 mb-1">Stage 4 — Target: August 2027</p>
                                        <h4 className="font-sans font-bold text-white/50 text-sm">Shipping &amp; Delivery</h4>
                                        <p className="font-sans text-xs text-white/30 mt-1">Your DreamPlay One arrives at your door.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <VIPDashboardClient />

                </div>
            </main>

            <Footer />
        </div>
    );
}

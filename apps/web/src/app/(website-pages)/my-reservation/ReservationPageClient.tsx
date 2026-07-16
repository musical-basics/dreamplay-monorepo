"use client";

import { createBrowserClient } from "@dreamplay/db";
import { useRouter } from "next/navigation";

export default function ReservationPageClient() {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createBrowserClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <div className="pt-4 flex justify-end">
            <button
                onClick={handleSignOut}
                className="text-white/30 hover:text-white/60 font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer"
            >
                Sign Out
            </button>
        </div>
    );
}

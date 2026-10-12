"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { WAITLIST_OFFER_HEADLINE } from "@/lib/waitlist-offer";

const DISMISSED_KEY = "dp_waitlist_announcement_dismissed";
const DISMISSED_EVENT = "dreamplay-waitlist-announcement-dismissed";
const HIDDEN_ROUTES = [
    "/customize",
    "/shop",
    "/checkout",
    "/login",
    "/register",
    "/activate",
    "/forgot-password",
    "/reset-password",
    "/vip",
    "/my-reservation",
];

const WAITLIST_ANNOUNCEMENT_ENABLED = false;

const subscribeToDismissedState = (onStoreChange: () => void) => {
    if (typeof window === "undefined") {
        return () => {};
    }

    window.addEventListener("storage", onStoreChange);
    window.addEventListener(DISMISSED_EVENT, onStoreChange);

    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(DISMISSED_EVENT, onStoreChange);
    };
};

const getDismissedSnapshot = () => (
    typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY) === "true"
);

const getServerDismissedSnapshot = () => false;

export function AnnouncementBanner() {
    const pathname = usePathname();
    const isDismissed = useSyncExternalStore(
        subscribeToDismissedState,
        getDismissedSnapshot,
        getServerDismissedSnapshot,
    );

    const isHiddenRoute = HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

    if (!WAITLIST_ANNOUNCEMENT_ENABLED || isDismissed || isHiddenRoute) {
        return null;
    }

    const handleDismiss = () => {
        localStorage.setItem(DISMISSED_KEY, "true");
        window.dispatchEvent(new Event(DISMISSED_EVENT));
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-white/10 bg-[#050505]/95 px-3 py-3 text-white shadow-2xl backdrop-blur-md md:px-6">
            <div className="mx-auto flex max-w-6xl items-center gap-3">
                <Link
                    href="/information-and-policies/shipping#waitlist-offer"
                    className="flex flex-1 flex-col gap-1 text-left transition-opacity hover:opacity-85 sm:flex-row sm:items-center sm:justify-center sm:text-center"
                >
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#c5a059]">
                        DreamPlay Waitlist
                    </span>
                    <span className="font-sans text-xs font-semibold leading-snug text-white sm:text-sm">
                        {WAITLIST_OFFER_HEADLINE}
                    </span>
                    <span className="hidden font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 sm:inline">
                        Join Waitlist
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss waitlist announcement"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-white/55 transition-colors hover:border-white/30 hover:text-white"
                >
                    <X size={16} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}

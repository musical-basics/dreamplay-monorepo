"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCallRequestStatus } from "@/actions/buyer-research-actions";
import type { BuyerCallStatus } from "@dreamplay/db";

const NEXT: Record<string, BuyerCallStatus[]> = {
    requested: ["scheduled", "completed", "cancelled"],
    scheduled: ["completed", "cancelled"],
    completed: [],
    cancelled: ["requested"],
};

export function CallStatusButtons({ requestId, status }: { requestId: string; status: BuyerCallStatus }) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function move(next: BuyerCallStatus) {
        setError(null);
        startTransition(async () => {
            const result = await setCallRequestStatus(requestId, next);
            if (result.ok) router.refresh();
            else setError(result.error ?? "Failed");
        });
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {NEXT[status]?.map((next) => (
                <button
                    key={next}
                    type="button"
                    disabled={pending}
                    onClick={() => move(next)}
                    className={`border px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40 ${
                        next === "completed"
                            ? "border-emerald-400/50 text-emerald-300 hover:bg-emerald-400/10"
                            : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                    }`}
                >
                    {next === "completed" ? "mark completed ($10)" : next}
                </button>
            ))}
            {error && <span className="text-[10px] text-red-400">{error}</span>}
        </div>
    );
}

import React from 'react';

export function UrgencySubtext({ className = "" }: { className?: string }) {
    return (
        <p className={`text-[10px] text-neutral-500 mt-2 text-center uppercase tracking-widest font-medium ${className}`}>
            MSRP $1,499 — Founder&apos;s pricing available for a limited time.
        </p>
    );
}

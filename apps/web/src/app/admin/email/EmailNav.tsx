import Link from "next/link";

/**
 * Section nav for /admin/email. (The admin shell layout is untouched;
 * /admin/email is reachable by URL per phase-5 scope.)
 */
export function EmailNav({ active }: { active: "campaigns" | "subscribers" | "suppressions" }) {
    const item = (href: string, key: string, label: string) => (
        <Link
            href={href}
            className={`px-3 py-1.5 border text-xs uppercase tracking-widest transition-colors ${
                active === key
                    ? "border-white/60 text-white"
                    : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
            }`}
        >
            {label}
        </Link>
    );
    return (
        <div className="flex items-center gap-2 mb-8 font-sans">
            {item("/admin/email", "campaigns", "Campaigns")}
            {item("/admin/email/subscribers", "subscribers", "Subscribers")}
            {item("/admin/email/suppressions", "suppressions", "Suppressions")}
        </div>
    );
}

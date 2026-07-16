import { redirect } from "next/navigation"

/**
 * Root page — the legacy journey engine rewrote `/` to the active journey's
 * homepage in middleware. All active journeys (and the bot/SEO STANDARD_JOURNEY)
 * pointed at /premium-offer, so `/` now redirects there directly, preserving
 * any query params (sid/cid email-tracking params, utm_*, etc.).
 */

interface PageProps {
    searchParams: Promise<Record<string, string | string[]>>
}

export default async function HomePage({ searchParams }: PageProps) {
    const params = await searchParams
    const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, val]) => {
            acc[key] = (Array.isArray(val) ? val[0] : val) ?? ""
            return acc
        }, {} as Record<string, string>)
    ).toString()

    redirect(queryString ? `/premium-offer?${queryString}` : "/premium-offer")
}

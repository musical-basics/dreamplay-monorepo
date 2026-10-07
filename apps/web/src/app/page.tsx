import { redirect } from "next/navigation"

/**
 * Root page — normally unreachable: the middleware funnel router (D11/D14)
 * redirects `/` to /main (or to /ab while the admin testing toggle is ON)
 * before routing gets here.
 * Kept as a fallback for any request the middleware matcher skips, matching
 * the non-member branch and preserving query params (sid/cid, utm_*, etc.).
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

    redirect(queryString ? `/main?${queryString}` : "/main")
}

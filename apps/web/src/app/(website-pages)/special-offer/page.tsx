import { SpecialOfferPage } from "@/components/special-offer/SpecialOfferPage"

// A/B variant "2a" — served via middleware rewrite from /ab. Not linked from
// nav or sitemap; kept out of search indexes.
export const metadata = {
    title: "DreamPlay — Special Offer",
    robots: { index: false, follow: false },
}

export default function Page() {
    return <SpecialOfferPage />
}

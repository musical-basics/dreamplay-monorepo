import type { Metadata } from "next";
import { ShopClient } from "./ShopClient";

export const metadata: Metadata = {
    title: "Shop DreamPlay",
    description: "Shop DreamPlay keyboards, premium bundles, and piano benches.",
    alternates: {
        canonical: "https://shop.dreamplaypianos.com",
    },
    openGraph: {
        title: "Shop DreamPlay",
        description: "Keyboards, bundles, and benches built around the DreamPlay narrow-key piano ecosystem.",
        url: "https://shop.dreamplaypianos.com",
        images: [{ url: "/images/keyboards/Piano + Bench Frontal + Bundle.png", width: 1200, height: 630 }],
    },
};

export default function ShopPage() {
    return <ShopClient />;
}

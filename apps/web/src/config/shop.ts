import { VARIANT_MAP } from "@/config/variant-map";
export { SHOP_BASE_URL, SHOP_HOME_URL, SHOP_HOST, SHOP_LINKS } from "./shop-links";

export type ShopOptionKey = "size" | "finish";

export type ShopOption = {
    label: string;
    value: string;
    description?: string;
};

export type ShopOptionGroup = {
    key: ShopOptionKey;
    label: string;
    options: ShopOption[];
};

export type ShopVariant = {
    id: string;
    title: string;
    variantId: string;
    options: Partial<Record<ShopOptionKey, string>>;
    available: boolean;
};

export type ShopProduct = {
    id: string;
    anchor: string;
    category: "keyboard" | "bundle" | "bench";
    name: string;
    eyebrow: string;
    subtitle: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    totalPrice?: number;
    pricePrefix?: string;
    paymentNote: string;
    delivery: string;
    badge?: string;
    image: string;
    gallery: string[];
    imageAlt: string;
    includes: string[];
    details: string[];
    optionGroups: ShopOptionGroup[];
    variants: ShopVariant[];
    unavailableMessage?: string;
    purchasedToday?: number;
};

const oneSizes: ShopOption[] = [
    { label: "DS5.5", value: "DS5.5", description: "7/8 key width" },
    { label: "DS6.0", value: "DS6.0", description: "15/16 key width" },
    { label: "DS6.5", value: "DS6.5", description: "Standard width" },
];

const proSizes: ShopOption[] = [
    { label: "DS5.5", value: "DS5.5", description: "7/8 key width" },
    { label: "DS6.0", value: "DS6.0", description: "15/16 key width" },
];

const oneFinishes: ShopOption[] = [
    { label: "Midnight Black", value: "Black" },
    { label: "Pearl White", value: "White" },
];

const proFinishes: ShopOption[] = [
    { label: "Nightmare Black", value: "Nightmare Black" },
    { label: "Aztec Gold", value: "Aztec Gold" },
];

const keyboardImages: [string, string, string] = [
    "/images/keyboards/DS6.0-Black-transparent v2.png",
    "/images/keyboards/ds55-white-narrow-keys-alt.png",
    "/images/keyboards/piano-front-2.jpg",
];

const bundleImages: [string, string, string] = [
    "/images/keyboards/Piano + Bench Frontal + Bundle.png",
    "/images/accessories/piano-bench-bundle.png",
    "/holiday-sale/images/slot-5-x-stand.png",
];

const standardBenchImages: [string, string, string] = [
    "/images/accessories/dreamplay-standard-bench-gpt-image-2-rail-logo.png",
    "/images/accessories/piano-bench-cushioned-black.jpg",
    "/images/accessories/piano-bench-bundle.png",
];

const hydraulicBenchImages: [string, string, string, string, string] = [
    "/images/accessories/dreamplay-hydraulic-bench-gpt-image-2-rail-logo.png",
    "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/images/7a01e084-6c31-4642-9e89-4bcbfa866e76_piano_bench_angle_left.png",
    "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/images/780e4cf8-24b2-45ad-a410-056a8a0793b0_piano_bench_angle_right_low.png",
    "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/images/f2ba4a98-51d9-4354-be00-c785038dcd9b_piano_bench_front.png",
    "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/images/abf3b00e-ef0c-4038-bdf8-7604abe9ad30_piano_bench_angle_right_high.png",
];

const proImages: [string, string, string] = [
    "/images/pro/nightmare-black-angled.png",
    "/images/pro/aztec-gold-full.jpg",
    "/images/pro/built-for-the-player.jpg",
];

const standardBenchVariantId = "53410025865530";
const hydraulicBenchVariantId = "53410025963834";

const benchColorOptions: ShopOptionGroup[] = [
    { key: "finish", label: "Color", options: [{ label: "Black", value: "Black" }] },
];

function buildVariants(
    tier: keyof typeof VARIANT_MAP,
    sizes: ShopOption[],
    finishes: ShopOption[],
): ShopVariant[] {
    return sizes.flatMap((size) => (
        finishes.map((finish) => {
            const variantId = VARIANT_MAP[tier]?.[size.value]?.[finish.value] || "";

            return {
                id: `${tier}-${size.value}-${finish.value}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                title: `${size.value} / ${finish.label}`,
                variantId,
                options: {
                    size: size.value,
                    finish: finish.value,
                },
                available: Boolean(variantId),
            };
        })
    ));
}

export const SHOP_PRODUCTS: ShopProduct[] = [
    {
        id: "dreamplay-one",
        anchor: "dreamplay-one",
        category: "keyboard",
        name: "DreamPlay One",
        eyebrow: "Narrow-key digital piano",
        subtitle: "Keyboard only",
        description: "The core DreamPlay instrument with DS Standard key widths, designed to reduce strain and make larger repertoire feel physically possible.",
        price: 499,
        compareAtPrice: 1499,
        totalPrice: 999,
        pricePrefix: "Deposit today",
        paymentNote: "Pay $499 today, then $500 when your piano is boxed and ready to ship.",
        delivery: "Target delivery: May 2027",
        image: keyboardImages[0],
        gallery: keyboardImages,
        imageAlt: "DreamPlay One keyboard in black",
        includes: ["DreamPlay One keyboard", "Power adapter", "Basic sustain pedal", "Founder price lock"],
        details: ["DS5.5, DS6.0, or DS6.5", "Midnight Black or Pearl White", "50% now, 50% at delivery"],
        optionGroups: [
            { key: "size", label: "Key Width", options: oneSizes },
            { key: "finish", label: "Finish", options: oneFinishes },
        ],
        variants: buildVariants("solo", oneSizes, oneFinishes),
        purchasedToday: 6,
    },
    {
        id: "dreamplay-one-bundle",
        anchor: "dreamplay-one-bundle",
        category: "bundle",
        name: "DreamPlay One Premium Bundle",
        eyebrow: "Complete starter setup",
        subtitle: "Keyboard, stand, pedal, standard bench",
        description: "The easiest complete setup for home practice: DreamPlay One plus the matched essentials, including the $80 standard padded bench.",
        price: 549,
        compareAtPrice: 1499,
        totalPrice: 1099,
        pricePrefix: "Deposit today",
        paymentNote: "Pay $549 today, then $550 when your bundle is boxed and ready to ship.",
        delivery: "Target delivery: May 2027",
        badge: "Most Popular",
        image: bundleImages[0],
        gallery: bundleImages,
        imageAlt: "DreamPlay One with bench and bundle accessories",
        includes: ["DreamPlay One keyboard", "Keyboard stand", "Sustain pedal", "Standard padded bench"],
        details: ["Best value for first setups", "$80 standard bench included", "50% now, 50% at delivery"],
        optionGroups: [
            { key: "size", label: "Key Width", options: oneSizes },
            { key: "finish", label: "Finish", options: oneFinishes },
        ],
        variants: buildVariants("full", oneSizes, oneFinishes),
        purchasedToday: 11,
    },
    {
        id: "dreamplay-one-pro",
        anchor: "dreamplay-one-pro",
        category: "keyboard",
        name: "DreamPlay One Pro",
        eyebrow: "Flagship keyboard",
        subtitle: "Keyboard only",
        description: "The higher-spec DreamPlay tier with elevated finishes, stronger performance hardware, and the same narrow-key philosophy.",
        price: 1899,
        compareAtPrice: 2499,
        paymentNote: "Charged at checkout for preorder.",
        delivery: "Target delivery: May 2027",
        image: proImages[0],
        gallery: proImages,
        imageAlt: "DreamPlay One Pro in Nightmare Black",
        includes: ["DreamPlay One Pro 88-key keyboard", "Sustain pedal", "DreamPlay Learn app lifetime access", "Power adapter and USB-C cable"],
        details: ["DS5.5 or DS6.0", "Nightmare Black or Aztec Gold", "Pro-grade touch and finishes"],
        optionGroups: [
            { key: "size", label: "Key Width", options: proSizes },
            { key: "finish", label: "Finish", options: proFinishes },
        ],
        variants: buildVariants("pro_solo", proSizes, proFinishes),
        purchasedToday: 3,
    },
    {
        id: "dreamplay-one-pro-bundle",
        anchor: "dreamplay-one-pro-bundle",
        category: "bundle",
        name: "DreamPlay One Pro Premium Bundle",
        eyebrow: "Flagship ecosystem",
        subtitle: "Pro keyboard, stand, triple pedal, standard bench",
        description: "DreamPlay One Pro with the matched furniture stand, triple pedal unit, and the $80 standard padded bench included.",
        price: 1999,
        compareAtPrice: 2499,
        paymentNote: "Charged at checkout for preorder.",
        delivery: "Target delivery: May 2027",
        badge: "Flagship",
        image: proImages[1],
        gallery: [proImages[1], proImages[0], bundleImages[1]],
        imageAlt: "DreamPlay One Pro in Aztec Gold",
        includes: ["DreamPlay One Pro 88-key keyboard", "Matched furniture stand", "Triple pedal unit", "Standard padded bench", "DreamPlay Learn app lifetime access"],
        details: ["Complete Pro setup", "$80 standard bench included", "Premium finishes"],
        optionGroups: [
            { key: "size", label: "Key Width", options: proSizes },
            { key: "finish", label: "Finish", options: proFinishes },
        ],
        variants: buildVariants("pro_full", proSizes, proFinishes),
        purchasedToday: 4,
    },
    {
        id: "standard-bench",
        anchor: "standard-bench",
        category: "bench",
        name: "DreamPlay Standard Bench",
        eyebrow: "Regular bench",
        subtitle: "Black padded bench",
        description: "The standard black padded bench used in the Premium Bundles, available as its own preorder accessory.",
        price: 80,
        pricePrefix: "Standalone",
        paymentNote: "Preorder today. Estimated 2-month wait before dispatch.",
        delivery: "Estimated 2-month preorder wait",
        image: standardBenchImages[0],
        gallery: standardBenchImages,
        imageAlt: "Black padded piano bench",
        includes: ["Standard padded seat", "Black studio finish", "Bundle-matched bench design"],
        details: ["Black only", "Included in Premium Bundles", "Estimated 2-month wait"],
        optionGroups: benchColorOptions,
        variants: [
            {
                id: "standard-bench-black",
                title: "Black",
                variantId: standardBenchVariantId,
                options: { finish: "Black" },
                available: true,
            },
        ],
        purchasedToday: 5,
    },
    {
        id: "hydraulic-bench",
        anchor: "hydraulic-bench",
        category: "bench",
        name: "DreamPlay Hydraulic Bench",
        eyebrow: "Standalone bench upgrade",
        subtitle: "Premium adjustable bench",
        description: "A tufted hydraulic adjustable-height bench for players who want finer height control, cleaner posture, and a more permanent studio setup.",
        price: 199,
        pricePrefix: "Standalone",
        paymentNote: "Preorder today. Estimated 2-month wait before dispatch.",
        delivery: "Estimated 2-month preorder wait",
        image: hydraulicBenchImages[0],
        gallery: hydraulicBenchImages,
        imageAlt: "Black tufted hydraulic piano bench",
        includes: ["Hydraulic height adjustment levers", "Tufted padded seat", "Twin-leg studio base", "Black studio finish"],
        details: ["Black only", "Not the $80 standard bundle bench", "Best for posture-sensitive practice"],
        optionGroups: benchColorOptions,
        variants: [
            {
                id: "hydraulic-bench-black",
                title: "Black",
                variantId: hydraulicBenchVariantId,
                options: { finish: "Black" },
                available: true,
            },
        ],
        purchasedToday: 7,
    },
];

export function formatShopPrice(price: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(price);
}

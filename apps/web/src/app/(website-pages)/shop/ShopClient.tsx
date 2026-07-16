"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Check,
    ChevronDown,
    Maximize2,
    Minus,
    PackageCheck,
    Plus,
    ShoppingBag,
    Trash2,
    Truck,
    X,
} from "lucide-react";
import {
    formatShopPrice,
    SHOP_PRODUCTS,
    type ShopOptionKey,
    type ShopProduct,
    type ShopVariant,
} from "@/config/shop";

type CartItem = {
    key: string;
    productId: string;
    name: string;
    subtitle: string;
    variantTitle: string;
    variantId: string;
    price: number;
    quantity: number;
    image: string;
    paymentNote: string;
    attributes: Array<{ key: string; value: string }>;
};

type CheckoutResponse = {
    checkoutUrl?: string;
    error?: string;
};

const CART_STORAGE_KEY = "dreamplay_shop_cart_v1";

function getDefaultSelections(product: ShopProduct): Partial<Record<ShopOptionKey, string>> {
    return Object.fromEntries(
        product.optionGroups.map((group) => [group.key, group.options[0]?.value]),
    ) as Partial<Record<ShopOptionKey, string>>;
}

function getSelectedVariant(
    product: ShopProduct,
    selections: Partial<Record<ShopOptionKey, string>>,
): ShopVariant | undefined {
    return product.variants.find((variant) => (
        product.optionGroups.every((group) => variant.options[group.key] === selections[group.key])
    )) || product.variants[0];
}

function makeCartKey(product: ShopProduct, variant: ShopVariant) {
    return `${product.id}:${variant.variantId || variant.id}`;
}

function makeAttributes(product: ShopProduct, variant: ShopVariant) {
    const optionAttributes = Object.entries(variant.options).map(([key, value]) => ({
        key,
        value: String(value),
    }));

    return [
        { key: "checkout_source", value: "shop" },
        { key: "product_id", value: product.id },
        ...optionAttributes,
    ];
}

export function ShopClient() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const [discountCodes, setDiscountCodes] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(CART_STORAGE_KEY);
            // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
            if (stored) setCartItems(JSON.parse(stored));

            const urlParams = new URLSearchParams(window.location.search);
            const discount = urlParams.get("discount") || window.sessionStorage.getItem("dp_vip_discount");
            if (discount) {
                setDiscountCodes([discount]);
                window.sessionStorage.setItem("dp_vip_discount", discount);
            }
        } catch {
            setCartItems([]);
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems, hydrated]);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addToCart = (product: ShopProduct, variant: ShopVariant) => {
        if (!variant.variantId) return;

        const key = makeCartKey(product, variant);
        const item: CartItem = {
            key,
            productId: product.id,
            name: product.name,
            subtitle: product.subtitle,
            variantTitle: variant.title,
            variantId: variant.variantId,
            price: product.price,
            quantity: 1,
            image: product.image,
            paymentNote: product.paymentNote,
            attributes: makeAttributes(product, variant),
        };

        setCartItems((items) => {
            const existing = items.find((cartItem) => cartItem.key === key);
            if (!existing) return [...items, item];

            return items.map((cartItem) => (
                cartItem.key === key
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        });
        setCheckoutError("");
        setCartOpen(true);
    };

    const updateQuantity = (key: string, quantity: number) => {
        setCartItems((items) => (
            items
                .map((item) => item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item)
                .filter((item) => item.quantity > 0)
        ));
    };

    const handleCheckout = async () => {
        if (!cartItems.length) return;

        setIsCheckingOut(true);
        setCheckoutError("");

        try {
            const response = await fetch("/api/shopify/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    note: "checkout_source:shop",
                    discountCodes,
                    attributes: [
                        { key: "checkout_source", value: "shop" },
                        { key: "cart_surface", value: "shop.dreamplaypianos.com" },
                    ],
                    lines: cartItems.map((item) => ({
                        variantId: item.variantId,
                        quantity: item.quantity,
                        attributes: item.attributes,
                    })),
                }),
            });

            const payload = await response.json() as CheckoutResponse;

            if (!response.ok || !payload.checkoutUrl) {
                throw new Error(payload.error || "Unable to start checkout.");
            }

            window.location.href = payload.checkoutUrl;
        } catch (error) {
            setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout.");
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-neutral-950">
            <ShopHeader cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

            <main>
                <Hero onCartClick={() => setCartOpen(true)} />

                <section id="keyboards" className="border-t border-neutral-200 bg-white px-4 py-14 md:px-8 md:py-20">
                    <div className="mx-auto max-w-[1500px]">
                        <SectionIntro
                            eyebrow="Keyboards"
                            title="Choose the instrument first."
                            body="Each keyboard option maps to the correct checkout variant behind the scenes, while the cart stays here on DreamPlay until checkout."
                        />
                        <div className="grid gap-5 lg:grid-cols-2">
                            {SHOP_PRODUCTS.filter((product) => product.category === "keyboard").map((product) => (
                                <ProductPanel key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="bundles" className="border-t border-neutral-200 bg-[#f7f4ee] px-4 py-14 md:px-8 md:py-20">
                    <div className="mx-auto max-w-[1500px]">
                        <SectionIntro
                            eyebrow="Bundles"
                            title="The standard bench lives inside the bundles."
                            body="Premium Bundles include the $80 standard padded bench, plus the matched stand and pedal setup."
                        />
                        <div className="grid gap-5 lg:grid-cols-2">
                            {SHOP_PRODUCTS.filter((product) => product.category === "bundle").map((product) => (
                                <ProductPanel key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="benches" className="border-t border-neutral-200 bg-white px-4 py-14 md:px-8 md:py-20">
                    <div className="mx-auto max-w-[1500px]">
                        <SectionIntro
                            eyebrow="Benches"
                            title="Two black bench options."
                            body="Choose the $80 regular padded bench or the $199 hydraulic upgrade. Both are preorder accessories with an estimated 2-month wait."
                        />
                        <div className="mb-5 grid gap-6 border border-neutral-200 bg-neutral-950 p-8 text-white md:grid-cols-[0.9fr_1.1fr] md:p-10">
                            <div>
                                <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c5a059]">
                                    Two-bench logic
                                </p>
                                <h2 className="font-serif text-4xl leading-tight md:text-5xl">
                                    Regular bench for value. Hydraulic bench for posture.
                                </h2>
                            </div>
                            <p className="font-sans text-sm leading-7 text-white/70 md:self-end md:text-base md:leading-8">
                                The Premium Bundle includes the standard $80 padded bench. The hydraulic bench is the standalone $199 upgrade for players who want a more adjustable studio seat.
                            </p>
                        </div>
                        <div className="grid gap-5 lg:grid-cols-2">
                            {SHOP_PRODUCTS.filter((product) => product.category === "bench").map((product) => (
                                <ProductPanel key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </div>
                    </div>
                </section>

                <TrustBand />
            </main>

            <CartDrawer
                cartOpen={cartOpen}
                items={cartItems}
                subtotal={subtotal}
                discountCodes={discountCodes}
                checkoutError={checkoutError}
                isCheckingOut={isCheckingOut}
                onClose={() => setCartOpen(false)}
                onQuantityChange={updateQuantity}
                onCheckout={handleCheckout}
            />
        </div>
    );
}

function ShopHeader({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
                <Link href="/" className="flex items-center gap-3" aria-label="DreamPlay home">
                    <Image
                        src="/images/logos/Logo.svg"
                        alt="DreamPlay"
                        width={132}
                        height={32}
                        className="h-7 w-auto brightness-0"
                        priority
                    />
                </Link>
                <nav className="hidden items-center gap-7 font-sans text-sm text-neutral-600 md:flex">
                    <a href="#keyboards" className="transition-colors hover:text-black">Keyboards</a>
                    <a href="#bundles" className="transition-colors hover:text-black">Bundles</a>
                    <a href="#benches" className="transition-colors hover:text-black">Benches</a>
                    <Link href="/how-it-works" className="transition-colors hover:text-black">Fit Guide</Link>
                </nav>
                <button
                    type="button"
                    onClick={onCartClick}
                    className="relative flex h-10 w-10 items-center justify-center border border-neutral-300 text-neutral-950 transition-colors hover:border-neutral-950"
                    aria-label={`Open cart with ${cartCount} items`}
                >
                    <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
                    {cartCount > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center bg-[#c5a059] px-1 font-sans text-[10px] font-bold text-black">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
}

function Hero({ onCartClick }: { onCartClick: () => void }) {
    return (
        <section className="bg-neutral-950 px-4 pb-10 pt-5 text-white md:px-8 md:pb-16">
            <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[520px] overflow-hidden border border-white/10 bg-neutral-900">
                    <Image
                        src="/images/keyboards/Piano + Bench Frontal + Bundle.png"
                        alt="DreamPlay keyboard and bench bundle"
                        fill
                        className="object-cover object-center opacity-90"
                        priority
                        sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 max-w-3xl p-6 md:p-10">
                        <p className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-[#c5a059]">
                            Shop DreamPlay
                        </p>
                        <h1 className="font-serif text-5xl leading-[0.98] tracking-tight md:text-7xl">
                            Keyboards, bundles, and the right bench.
                        </h1>
                    </div>
                </div>
                <div className="grid gap-5">
                    <div className="border border-white/10 bg-white p-6 text-neutral-950 md:p-8">
                        <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                            Built for checkout
                        </p>
                        <h2 className="mb-5 font-serif text-4xl leading-tight">
                            Here is your cart
                        </h2>
                        <p className="mb-8 font-sans text-sm leading-7 text-neutral-600">
                            The shop cart keeps the buying experience on DreamPlay. When you are ready, checkout opens with your selected variants.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#keyboards"
                                className="inline-flex items-center gap-2 bg-neutral-950 px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
                            >
                                Shop Keyboards
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <button
                                type="button"
                                onClick={onCartClick}
                                className="inline-flex items-center gap-2 border border-neutral-300 px-5 py-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950 transition-colors hover:border-neutral-950"
                            >
                                View Cart
                                <ShoppingBag className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 border border-white/10 bg-neutral-900 text-white">
                        {[
                            ["$499", "DreamPlay One deposit"],
                            ["$549", "Premium Bundle deposit"],
                            ["$80-$199", "Bench options"],
                        ].map(([value, label]) => (
                            <div key={label} className="border-r border-white/10 p-5 last:border-r-0">
                                <p className="font-serif text-3xl">{value}</p>
                                <p className="mt-2 font-sans text-[11px] leading-5 text-white/50">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
    return (
        <div className="mb-9 grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
                <p className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#9a6b12]">
                    {eyebrow}
                </p>
                <h2 className="font-serif text-4xl leading-tight text-neutral-950 md:text-5xl">
                    {title}
                </h2>
            </div>
            <p className="max-w-2xl font-sans text-sm leading-7 text-neutral-600 md:ml-auto">
                {body}
            </p>
        </div>
    );
}

function ProductPanel({ product, onAdd }: { product: ShopProduct; onAdd: (product: ShopProduct, variant: ShopVariant) => void }) {
    const [selections, setSelections] = useState<Partial<Record<ShopOptionKey, string>>>(() => getDefaultSelections(product));
    const [activeImage, setActiveImage] = useState(product.image);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const selectedVariant = useMemo(() => getSelectedVariant(product, selections), [product, selections]);
    const canAdd = Boolean(selectedVariant?.variantId);

    const setOption = (key: ShopOptionKey, value: string) => {
        setSelections((current) => ({ ...current, [key]: value }));
    };

    return (
        <>
        <article id={product.anchor} className="relative scroll-mt-24 border border-neutral-200 bg-white">
            {product.purchasedToday && product.purchasedToday > 0 ? (
                <span className="absolute -top-3 right-6 z-10 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 font-sans text-[11px] font-semibold text-neutral-700 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    {product.purchasedToday} purchased today
                </span>
            ) : null}
            <div className="grid min-h-full lg:grid-cols-[0.95fr_1.05fr]">
                <div className="border-b border-neutral-200 bg-[#f6f6f4] p-5 lg:border-b-0 lg:border-r">
                    <button
                        type="button"
                        onClick={() => setLightboxImage(activeImage)}
                        className="group relative block aspect-[4/3] w-full overflow-hidden bg-white text-left"
                        aria-label={`Enlarge ${product.name} image`}
                    >
                        <Image
                            src={activeImage}
                            alt={product.imageAlt}
                            fill
                            className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width: 1024px) 100vw, 38vw"
                        />
                        <span
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white/90 text-neutral-950 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                            aria-hidden="true"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </span>
                    </button>
                    {product.gallery.length > 1 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {product.gallery.map((image) => (
                                <button
                                    key={image}
                                    type="button"
                                    onClick={() => setActiveImage(image)}
                                    className={`relative aspect-[4/3] border bg-white transition-colors ${activeImage === image ? "border-neutral-950" : "border-neutral-200 hover:border-neutral-500"}`}
                                    aria-label={`View ${product.name} image`}
                                >
                                    <Image src={image} alt="" fill className="object-contain p-2" sizes="120px" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col p-6 md:p-8">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500">
                                {product.eyebrow}
                            </p>
                            <h3 className="font-serif text-3xl leading-tight text-neutral-950 md:text-4xl">
                                {product.name}
                            </h3>
                            <p className="mt-2 font-sans text-sm text-neutral-500">{product.subtitle}</p>
                        </div>
                        {product.badge && (
                            <span className="shrink-0 bg-[#c5a059] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                                {product.badge}
                            </span>
                        )}
                    </div>

                    <p className="mb-6 font-sans text-sm leading-7 text-neutral-600">
                        {product.description}
                    </p>

                    <div className="mb-6 flex flex-wrap items-end gap-3 border-y border-neutral-200 py-5">
                        <div>
                            {product.pricePrefix && (
                                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                    {product.pricePrefix}
                                </p>
                            )}
                            <p className="font-serif text-5xl leading-none">{formatShopPrice(product.price)}</p>
                        </div>
                        <div className="pb-1 font-sans text-xs leading-5 text-neutral-500">
                            {product.totalPrice && <p>Total {formatShopPrice(product.totalPrice)}</p>}
                            {product.compareAtPrice && <p>Compare at {formatShopPrice(product.compareAtPrice)}</p>}
                        </div>
                    </div>

                    {product.optionGroups.length > 0 && (
                        <div className="mb-6 space-y-5">
                            {product.optionGroups.map((group) => (
                                <div key={group.key}>
                                    <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                                        {group.label}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {group.options.map((option) => {
                                            const isSelected = selections[group.key] === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setOption(group.key, option.value)}
                                                    className={`min-h-11 border px-4 py-2 text-left font-sans text-sm transition-colors ${isSelected
                                                        ? "border-neutral-950 bg-neutral-950 text-white"
                                                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950"
                                                        }`}
                                                >
                                                    <span className="block leading-5">{option.label}</span>
                                                    {option.description && (
                                                        <span className={`block text-[11px] ${isSelected ? "text-white/55" : "text-neutral-500"}`}>
                                                            {option.description}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mb-7 grid gap-2 font-sans text-sm text-neutral-600">
                        {product.includes.map((item) => (
                            <div key={item} className="flex items-start gap-2">
                                <Check className="mt-0.5 h-4 w-4 text-[#9a6b12]" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto">
                        <button
                            type="button"
                            disabled={!canAdd}
                            onClick={() => selectedVariant && onAdd(product, selectedVariant)}
                            className="flex w-full items-center justify-center gap-2 bg-neutral-950 px-5 py-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                        >
                            {canAdd ? "Add to Cart" : "Variant Needed"}
                            {canAdd ? <Plus className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <p className="mt-3 min-h-5 font-sans text-xs leading-5 text-neutral-500">
                            {canAdd ? product.paymentNote : product.unavailableMessage}
                        </p>
                    </div>
                </div>
            </div>
        </article>
        <ImageLightbox image={lightboxImage} alt={product.imageAlt} onClose={() => setLightboxImage(null)} />
        </>
    );
}

function ImageLightbox({ image, alt, onClose }: { image: string | null; alt: string; onClose: () => void }) {
    useEffect(() => {
        if (!image) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [image, onClose]);

    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded product image"
        >
            <button
                type="button"
                className="absolute inset-0 cursor-zoom-out"
                aria-label="Close expanded image"
                onClick={onClose}
            />
            <div className="relative z-10 h-full w-full max-w-6xl">
                <Image
                    src={image}
                    alt={alt}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                />
            </div>
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center bg-white text-neutral-950 shadow-lg transition-colors hover:bg-neutral-200 md:right-8 md:top-8"
                aria-label="Close expanded image"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function TrustBand() {
    const items = [
        { icon: PackageCheck, title: "Variant-accurate", body: "Every selectable keyboard maps to the correct checkout variant." },
        { icon: Truck, title: "Delivery clarity", body: "Deposits and preorder timing are shown before checkout." },
        { icon: ShoppingBag, title: "DreamPlay cart", body: "Cart stays on DreamPlay until checkout." },
    ];

    return (
        <section className="border-t border-neutral-200 bg-neutral-950 px-4 py-12 text-white md:px-8">
            <div className="mx-auto grid max-w-[1500px] gap-4 md:grid-cols-3">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                    <div key={item.title} className="border border-white/10 p-6">
                        <Icon className="mb-5 h-6 w-6 text-[#c5a059]" />
                        <h3 className="mb-2 font-serif text-2xl">{item.title}</h3>
                        <p className="font-sans text-sm leading-6 text-white/55">{item.body}</p>
                    </div>
                    );
                })}
            </div>
        </section>
    );
}

function CartDrawer({
    cartOpen,
    items,
    subtotal,
    discountCodes,
    checkoutError,
    isCheckingOut,
    onClose,
    onQuantityChange,
    onCheckout,
}: {
    cartOpen: boolean;
    items: CartItem[];
    subtotal: number;
    discountCodes: string[];
    checkoutError: string;
    isCheckingOut: boolean;
    onClose: () => void;
    onQuantityChange: (key: string, quantity: number) => void;
    onCheckout: () => void;
}) {
    return (
        <>
            <div
                className={`fixed inset-0 z-[90] bg-black/40 transition-opacity ${cartOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed right-0 top-0 z-[100] flex h-dvh w-full max-w-[460px] flex-col bg-white shadow-2xl transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
                aria-label="Shopping cart"
            >
                <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5">
                    <div>
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">DreamPlay Cart</p>
                        <p className="font-sans text-sm text-neutral-950">{items.length ? `${items.length} line item${items.length === 1 ? "" : "s"}` : "Empty cart"}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center border border-neutral-200 transition-colors hover:border-neutral-950"
                        aria-label="Close cart"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <ShoppingBag className="mb-4 h-10 w-10 text-neutral-300" />
                            <h2 className="font-serif text-3xl text-neutral-950">Your cart is ready.</h2>
                            <p className="mt-3 max-w-xs font-sans text-sm leading-6 text-neutral-500">
                                Add a keyboard, bundle, or bench and check out when you are done.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {items.map((item) => (
                                <div key={item.key} className="grid grid-cols-[96px_1fr] gap-4 border-b border-neutral-200 pb-5">
                                    <div className="relative aspect-square bg-neutral-100">
                                        <Image src={item.image} alt="" fill className="object-contain p-3" sizes="96px" />
                                    </div>
                                    <div>
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-sans text-sm font-semibold text-neutral-950">{item.name}</h3>
                                                <p className="font-sans text-xs leading-5 text-neutral-500">{item.variantTitle}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onQuantityChange(item.key, 0)}
                                                className="text-neutral-400 transition-colors hover:text-neutral-950"
                                                aria-label={`Remove ${item.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex h-9 items-center border border-neutral-200">
                                                <button
                                                    type="button"
                                                    onClick={() => onQuantityChange(item.key, item.quantity - 1)}
                                                    className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100"
                                                    aria-label={`Decrease quantity for ${item.name}`}
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="w-8 text-center font-sans text-sm">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onQuantityChange(item.key, item.quantity + 1)}
                                                    className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100"
                                                    aria-label={`Increase quantity for ${item.name}`}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <p className="font-sans text-sm font-semibold text-neutral-950">
                                                {formatShopPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                        <p className="mt-3 font-sans text-[11px] leading-5 text-neutral-500">{item.paymentNote}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-neutral-200 p-5">
                    <div className="mb-4 flex items-center justify-between font-sans">
                        <span className="text-sm text-neutral-500">Subtotal</span>
                        <span className="text-xl font-semibold text-neutral-950">{formatShopPrice(subtotal)}</span>
                    </div>
                    <p className="mb-4 font-sans text-xs leading-5 text-neutral-500">
                        Taxes, shipping, and any remaining preorder balances are handled at checkout or before dispatch.
                    </p>
                    {discountCodes.length > 0 && (
                        <p className="mb-4 border border-[#c5a059]/40 bg-[#fff8e6] px-3 py-2 font-sans text-xs leading-5 text-neutral-700">
                            Discount code ready for checkout: <span className="font-semibold">{discountCodes[0]}</span>
                        </p>
                    )}
                    {checkoutError && (
                        <p className="mb-3 border border-red-200 bg-red-50 px-3 py-2 font-sans text-xs leading-5 text-red-700">
                            {checkoutError}
                        </p>
                    )}
                    <button
                        type="button"
                        disabled={!items.length || isCheckingOut}
                        onClick={onCheckout}
                        className="flex w-full items-center justify-center gap-2 bg-neutral-950 px-5 py-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                    >
                        {isCheckingOut ? "Starting Checkout..." : "Checkout"}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </aside>
        </>
    );
}

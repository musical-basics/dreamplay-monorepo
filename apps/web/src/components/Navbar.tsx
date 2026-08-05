"use client"

import Link from "next/link"
import { ArrowRight, Menu, X, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@dreamplay/db"
import { RegisterModal } from "./RegisterModal"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { SHOP_LINKS } from "@/config/shop-links"

interface NavbarProps {
    forceOpaque?: boolean;
    darkMode?: boolean;
    className?: string;
}

// --- Desktop Dropdown ---
function NavDropdown({ label, items, useDarkText }: { label: string; items: { label: string; href: string }[]; useDarkText: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                className={`flex items-center gap-1 text-sm transition-colors cursor-pointer ${useDarkText ? "text-neutral-700 hover:text-neutral-900" : "text-white/70 hover:text-white"}`}
            >
                {label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            <div
                className={cn(
                    "absolute top-full right-0 mt-1 min-w-[180px] rounded-lg shadow-xl overflow-hidden transition-all duration-200 border",
                    useDarkText
                        ? "bg-white border-black/5 ring-1 ring-black/5"
                        : "bg-[#0a0a0f] border-white/10",
                    open ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-2 invisible"
                )}
                style={{ zIndex: 100 }}
            >
                {items.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`block px-4 py-3 text-sm transition-colors ${useDarkText
                            ? "text-gray-600 hover:text-black hover:bg-black/5"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function Navbar({ forceOpaque = false, darkMode = false, className = "" }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [hideNav, setHideNav] = useState(false)
    const lastScrollY = useRef(0)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)

    useEffect(() => {
        const supabase = createBrowserClient()
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        const handleScroll = (e?: Event) => {
            // Support both window scroll and container scroll (e.g. snap-scroll divs)
            let currentY = window.scrollY;
            if (currentY === 0 && e?.target && e.target !== document) {
                currentY = (e.target as HTMLElement).scrollTop || 0;
            }
            setScrolled(currentY > 100);

            // Hide/show on mobile based on scroll direction
            if (currentY > lastScrollY.current && currentY > 80) {
                setHideNav(true);  // scrolling down
            } else if (currentY < lastScrollY.current - 10) {
                setHideNav(false); // scrolling up (with 10px threshold to avoid jitter)
            }
            lastScrollY.current = currentY;
        }
        // capture: true catches scroll events from nested scrollable containers
        document.addEventListener("scroll", handleScroll, { capture: true, passive: true })
        return () => document.removeEventListener("scroll", handleScroll, { capture: true } as EventListenerOptions)
    }, [])

    const isScrolled = forceOpaque || scrolled || isMobileMenuOpen;
    const useDarkText = isScrolled && !darkMode;

    const linkClass = (useDarkText: boolean) =>
        `text-sm transition-colors ${useDarkText ? "text-neutral-700 hover:text-neutral-900" : "text-white/70 hover:text-white"}`;

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 flex flex-col",
                    hideNav && !isMobileMenuOpen ? "max-lg:-translate-y-full" : "translate-y-0",
                    className
                )}
            >
                {/* Countdown Banner */}

                <div className={cn(
                    "w-full transition-all duration-300",
                    darkMode
                        ? "bg-[#050505]/95 backdrop-blur-md"
                        : isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
                )}>
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <img
                                src={useDarkText ? "/images/logos/Logo.svg" : "/images/logos/DreamPlay Logo White.png"}
                                alt="DreamPlay Pianos"
                                className={`h-8 transition-all ${useDarkText ? "brightness-0" : ""}`}
                            />
                        </Link>

                        {/* Main navigation */}
                        <nav className="hidden md:flex items-center gap-6 h-full">
                            <NavDropdown
                                label="DreamPlay Keyboards"
                                useDarkText={useDarkText}
                                items={[
                                    { label: "Our Product", href: "/premium-offer" },
                                    { label: "DreamPlay One Pro", href: "/dreamplay-pro" },
                                    { label: "Discover", href: "/intro-offer" },
                                    { label: "Explore", href: "/extended-offer" },
                                ]}
                            />

                            <NavDropdown
                                label="Why Narrow?"
                                useDarkText={useDarkText}
                                items={[
                                    { label: "How It Works", href: "/how-it-works" },
                                    { label: "The Benefits", href: "/better-practice" },
                                ]}
                            />

                            <NavDropdown
                                label="Features"
                                useDarkText={useDarkText}
                                items={[
                                    { label: "Product Info", href: "/product-information" },
                                    { label: "Buyer's Guide", href: "/buyers-guide" },
                                    { label: "DreamPlay Learn", href: "/learn" },
                                    { label: "For Parents", href: "/parents-guide" },
                                ]}
                            />

                            <NavDropdown
                                label="About Us"
                                useDarkText={useDarkText}
                                items={[
                                    { label: "Our Story", href: "/our-story" },
                                    { label: "The DS Standard", href: "/about-us/ds-standard" },
                                    { label: "Historical Facts", href: "/historical-facts" },
                                ]}
                            />

                            <NavDropdown
                                label="Manufacturing & Shipping"
                                useDarkText={useDarkText}
                                items={[
                                    { label: "July 2026 Update", href: "/july-update" },
                                    { label: "June 2026 Update", href: "/june-update" },
                                    { label: "Production Timeline", href: "/production-timeline" },
                                    { label: "Shipping", href: "/information-and-policies/shipping" },
                                ]}
                            />

                            <Link href="/information-and-policies/faq" className={linkClass(useDarkText)}>FAQ</Link>
                            <Link href="https://blog.dreamplaypianos.com/blog" className={linkClass(useDarkText)}>Blog</Link>

                        </nav>

                        {/* CTA + Auth */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={SHOP_LINKS.home}
                                className={`hidden md:flex items-center gap-2 rounded-none px-5 py-2.5 text-sm font-medium transition-all duration-300 ${useDarkText
                                    ? "bg-black border border-black text-white hover:bg-neutral-800"
                                    : "bg-white/5 backdrop-blur-sm border border-white/30 text-white hover:bg-white/15"
                                    }`}
                            >
                                Reserve Now
                                <span className="w-6 h-6 rounded-none flex items-center justify-center bg-white">
                                    <ArrowRight className="w-3 h-3 text-black" />
                                </span>
                            </Link>

                            {user ? (
                                <Link href="/vip" className={`hidden md:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${useDarkText ? "text-neutral-500 hover:text-black" : "text-white/50 hover:text-white"}`}>
                                    <User className="w-3.5 h-3.5" /> Account
                                </Link>
                            ) : (
                                <div className={`hidden md:flex items-center gap-0 text-[10px] uppercase tracking-[0.15em] font-medium ${useDarkText ? "text-neutral-500" : "text-white/50"}`}>
                                    <button onClick={() => setIsRegisterOpen(true)} className={`uppercase transition-colors cursor-pointer ${useDarkText ? "hover:text-black" : "hover:text-white"}`}>
                                        Register
                                    </button>
                                    <span className="mx-1.5 opacity-30">|</span>
                                    <Link href="/login" className={`transition-colors ${useDarkText ? "hover:text-black" : "hover:text-white"}`}>
                                        Login
                                    </Link>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                className={`md:hidden ${useDarkText ? "text-neutral-900" : "text-white"}`}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Menu className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {
                    isMobileMenuOpen && (
                        <div className="md:hidden absolute top-[100px] left-0 right-0 bg-white border-b border-gray-100 shadow-xl animate-in slide-in-from-top-2 duration-200">
                            <nav className="flex flex-col p-4">
                                <div className="px-1 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">DreamPlay Keyboards</div>
                                <Link href="/premium-offer" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Our Product</Link>
                                <Link href="/dreamplay-pro" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>DreamPlay One Pro</Link>
                                <Link href={SHOP_LINKS.keyboards} className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
                                <Link href="/extended-offer" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Explore</Link>

                                <div className="border-t border-gray-200 my-2" />
                                <div className="px-1 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Why Narrow?</div>
                                <Link href="/how-it-works" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>How It Works</Link>
                                <Link href="/better-practice" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>The Benefits</Link>

                                <div className="border-t border-gray-200 my-2" />
                                <div className="px-1 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Features</div>
                                <Link href="/product-information" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Product Info</Link>
                                <Link href="/buyers-guide" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Buyer&apos;s Guide</Link>
                                <Link href="/learn" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>DreamPlay Learn</Link>
                                <Link href="/parents-guide" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>For Parents</Link>

                                <div className="border-t border-gray-200 my-2" />
                                <div className="px-1 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">About Us</div>
                                <Link href="/our-story" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Our Story</Link>
                                <Link href="/about-us/ds-standard" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>The DS Standard</Link>
                                <Link href="/historical-facts" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Historical Facts</Link>

                                <div className="border-t border-gray-200 my-2" />
                                <div className="px-1 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manufacturing & Shipping</div>
                                <Link href="/july-update" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>July 2026 Update</Link>
                                <Link href="/june-update" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>June 2026 Update</Link>
                                <Link href="/production-timeline" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Production Timeline</Link>
                                <Link href="/information-and-policies/shipping" className="py-3 pl-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Shipping</Link>

                                <div className="border-t border-gray-200 my-2" />
                                <Link href="/information-and-policies/faq" className="py-3 text-neutral-600 hover:text-black font-medium border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
                                <Link href="https://blog.dreamplaypianos.com/blog" className="py-3 text-neutral-600 hover:text-black font-medium" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>


                                {!user && (
                                    <div className="py-2 flex items-center gap-3 border-t border-gray-100">
                                        <button
                                            onClick={() => { setIsRegisterOpen(true); setIsMobileMenuOpen(false); }}
                                            className="py-3 text-sm font-medium text-neutral-600 hover:text-black cursor-pointer"
                                        >
                                            Register
                                        </button>
                                        <span className="text-neutral-300">|</span>
                                        <Link
                                            href="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="py-3 text-sm font-medium text-neutral-600 hover:text-black"
                                        >
                                            Login
                                        </Link>
                                    </div>
                                )}
                                {user && (
                                    <Link
                                        href="/vip"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-3 text-sm font-bold text-neutral-600 hover:text-black flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" /> My Account
                                    </Link>
                                )}
                                <Link
                                    href={SHOP_LINKS.home}
                                    className="mt-4 flex items-center justify-center gap-2 w-full bg-black text-white rounded-none py-3 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Reserve Now
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </nav>
                        </div>
                    )
                }
            </header>

            <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
        </>
    )
}

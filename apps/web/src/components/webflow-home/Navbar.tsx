"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { AbCtaLink } from "@/components/ab/AbCtaLink";

/** Webflow navbar as of dreamplay-website@1d47b9f; the two CTAs are AbCtaLinks. */
export default function Navbar() {
    const rawPathname = usePathname();
    // /main is a middleware rewrite to /webflow-home — both are "home" here.
    const pathname = rawPathname === "/main" || rawPathname === "/webflow-home" ? "/" : rawPathname;

    const getLinkClass = (path: string) => {
        const baseClass = "navigation5_link-wrfrm w-nav-link";
        return pathname === path ? `${baseClass} w--current` : baseClass;
    };

    const getBrandClass = (path: string) => {
        const baseClass = "navigation5_logo-link w-nav-brand";
        return pathname === path ? `${baseClass} w--current` : baseClass;
    };

    return (
        <div
            data-animation="default"
            className="section_navigation5-wrfrm w-nav"
            data-wf--navbar--variant="base"
            data-easing2="ease"
            fs-scrolldisable-element="smart-nav"
            data-easing="ease"
            data-collapse="medium"
            role="banner"
            data-duration="400"
        >
            <div className="navigation5_container">
                <Link
                    href="/"
                    aria-current="page"
                    className={getBrandClass("/")}
                >
                    <img
                        loading="lazy"
                        src="/images/logos/Logo.svg"
                        alt=""
                        className="navigation_logo"
                    />
                </Link>
                <nav
                    role="navigation"
                    className="navigation5_menu-wrfrm is-page-height-tablet w-nav-menu"
                >
                    <div className="navigation5_menu-links">
                        <Link
                            href="/"
                            aria-current="page"
                            className={getLinkClass("/")}
                        >
                            DreamPlay One
                        </Link>
                        <div className="nav-divider"></div>
                        <Link
                            href="/why-narrow"
                            className={getLinkClass("/why-narrow")}
                        >
                            Why Narrow?
                        </Link>
                        <div className="nav-divider"></div>
                        <Link
                            href="/how-it-works"
                            className={getLinkClass("/how-it-works")}
                        >
                            How It Works
                        </Link>
                        <div className="nav-divider"></div>
                        <Link
                            href="/our-story"
                            className={getLinkClass("/our-story")}
                        >
                            Our Story
                        </Link>
                        <div className="nav-divider"></div>
                        <Link
                            href="/information-and-policies/faq"
                            className={getLinkClass("/information-and-policies/faq")}
                        >
                            FAQ
                        </Link>
                    </div>
                    <div className="navigation5_button-wrapper button-show-on-landscape">
                        <div>
                            <AbCtaLink cta="webflow_home_nav_reserve"
                                data-wf--button-primary--variant="secondary"
                                
                                className="button w-variant-1ae2a9c7-3071-e35e-921a-e41dc6d6ad44 w-inline-block"
                            >
                                <div className="button_text">
                                    <div>Reserve Now</div>
                                </div>
                                <div className="button_icon">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        viewBox="0 0 18 10"
                                        fill="none"
                                        className="button_icon-svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z"
                                            fill="currentColor"
                                        ></path>
                                        <path
                                            d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z"
                                            fill="currentColor"
                                        ></path>
                                    </svg>
                                </div>
                            </AbCtaLink>
                        </div>
                    </div>
                </nav>
                <div className="navigation5_buttons-wrfrm">
                    <div className="navigation5_button-wrapper">
                        <AbCtaLink cta="webflow_home_nav_preorder"
                            data-wf--button-primary--variant="base"
                            
                            className="button w-inline-block"
                        >
                            <div className="button_text">
                                <div>Pre-Order Now</div>
                            </div>
                            <div className="button_icon">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="100%"
                                    viewBox="0 0 18 10"
                                    fill="none"
                                    className="button_icon-svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z"
                                        fill="currentColor"
                                    ></path>
                                    <path
                                        d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z"
                                        fill="currentColor"
                                    ></path>
                                </svg>
                            </div>
                        </AbCtaLink>
                    </div>
                    <div className="navigation5_menu-button w-nav-button">
                        <div className="navigation5_menu-icon">
                            <div className="navigation_menu_line-top navigation-menu-line-background-wrfrm"></div>
                            <div className="navigation_menu_line-middle navigation-menu-line-background-wrfrm">
                                <div className="navigation_menu_line-middle-inner"></div>
                            </div>
                            <div className="navigation_menu_line-bottom navigation-menu-line-background-wrfrm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

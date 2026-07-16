# Phase 2 Port Manifest — website-2 → apps/web (2026-07-16)

Work breakdown from exhaustive exploration of `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-website-2`. Paths relative to that repo. Alias `@/*` → `src/*`. Port order: **A+E → (B ∥ C ∥ D) → F → G-cleanup**.

## Global changes applying to every package
- Every `@/lib/supabase/{client,server,middleware}` import → `@dreamplay/db` (`createBrowserClient`, `createServerClient` + cookie adapter, `createAdminClient`). Inline `createClient(supabase-js)` service-role instantiations too.
- DELETE all usage of: `AnalyticsTracker`, `ABTracker`, `useABAnalytics` (`@/hooks/use-ab-analytics`), `@/lib/homepage-ab`, `@/lib/analytics` (`logEvent`), journey engine (`@/config/journeys`, `use-journey-checkout`), `api/track-ab`, `api/popup-ab`, `ab-actions`.
- KEEP: `EmailTracker.tsx` + `trackEmailConversion` + middleware dp_sid/dp_cid capture (D10). KEEP shop-subdomain rewrite + supabase session refresh in middleware. Middleware A/B `?test=&variant=` section and journey engine sections: DELETE.
- Table renames: `buyer_emails`→`buyers`, `Customer`→`customers`, `Waitlist`→`waitlist` (see packages/db/src/types.ts for new column shapes).
- OPENAI_API_KEY: unused in src — drop.

## next.config.ts to port
- images.remotePatterns: dreamplaypianos.com, pub-ae162277c7104eb2b558af08104deafc.r2.dev; formats avif/webp; qualities [75,85,90,95,100]
- redirects: /shipping → /information-and-policies/shipping; /special-offer → /intro-offer (permanent)
- rewrites: /buy-product{,2,3} → /checkout-pages/buy-product{,2,3}

## tailwind theme to merge (Package A)
shadcn HSL-var set + custom: `accent.dim #2563eb33`, `brand #2563eb/#fff`, `dark-section #0c0a09`, `dark-text #f5f5f4`, `midnight-box #080a0f`, `glass-card rgba(30,41,59,0.4)`, `zone-a #f43f5e`, `zone-b #f59e0b`, `zone-c #2dd4bf`; fonts sans Manrope/Inter, serif var(--font-playfair)/Lora/Georgia; accordion keyframes + fadeInUp; borderRadius off --radius. Fonts: layout loads Inter + Playfair_Display via next/font; extended-offer & premium-offer pages load their own instances.

## Package A — Foundation
layout.tsx (strip AnalyticsTracker/ABTracker; keep EmailTracker/NewsletterPopup/AnnouncementBanner), globals.css (aurora animations + shadcn vars), robots.ts, sitemap.ts, favicon, root page.tsx (currently redirect() — becomes real homepage target; verify where journey engine pointed), middleware.ts (keep §1 session/§2 shop-rewrite/§4 dp_sid-dp_cid; delete §3 A/B/§5-6 journey), components/ui/* (5 files: accordion,button,input,label,slider), Navbar (strip use-ab-analytics + homepage-ab), Footer, AnnouncementBanner, NewsletterPopup, SurveyPopup, RegisterModal, EmailTracker (KEEP), icons/Logo, UrgencySubtext, DonutChart, animated-section (x2: components/ + learn-page-components/), lib/utils (cn), lib/waitlist-offer, lib/one-pro-delivery, config/shop-links.
Assets: cp public/ minus: `images/factory-pictures/other pictures (no need to use)/` (363MB junk), starter svgs (file/globe/next/vercel/window.svg), and public/js+public/css if grep confirms no references.

## Package B — Marketing pages
Routes under (website-pages): our-story, better-practice, production-timeline, historical-facts, june-update, about-us/ds-standard (+content.tsx), why-narrow, how-it-works, hidden-barrier, learn, dreamplay-pro, product-information, buyers-guide, parents-guide, extended-offer, premium-offer, intro-offer (strip useABAnalytics), accessories, faq (redirect), information-and-policies/{faq,shipping}, privacy, terms.
Component dirs: extended-offer/ (~30), premium-offer/ (~20), intro-offer/ (strip useABAnalytics in IntroOfferPage + check cta-section/hero-section), how-it-works/ (6), buyers-guide/ (9), learn-page-components/, InlineHandGuide, FoundersBatchCapture, ProductJsonLd, FaqJsonLd, faq-list, checkout/{TestimonialsSection,OldTestimonialsSection} (shared with C).
Depends on: A + E (admin-actions getHiddenProducts/getCountdownDate, faq-actions, email-actions).

## Package C — Commerce
config/shop.ts, customize/variant-map.ts (RELOCATE to src/config/variant-map.ts — imported by shop.ts/checkout/CustomizeClient), shop/{page,ShopClient}, customize/{page,CustomizeClient (strip useABAnalytics; supabase→db)}, components/customize/DynamicProductionTimeline, checkout/{page,layout}, checkout-pages/buy-product{,2,3}, components/checkout/{ProductSelectionForm,ProductSelectionFormLegacy}, components/campaign/RisksSection, components/social-proof/JoinUsers, api/shopify/cart (Storefront cartCreate + permalink fallback).

## Package D — Auth + buyer portal
login, register, forgot-password, reset-password, activate, api/auth/callback, my-reservation/{page,ReservationPageClient,ReservationDecisionModule}, vip/{page,VIPDashboardClient,PromoCodeBox}, actions/reservation-actions.ts (service-role→db admin; buyers table rename; Resend emails), lib/shopify/admin.ts (client-credentials, getLatestOrderForEmail, sizeLabel).

## Package E — Supporting API/actions
api/subscribe (customers table + resend welcome), api/waitlist, actions/email-actions.ts (KEEP external webhook POST email.dreamplaypianos.com/api/webhooks/subscribe — env-driven), contact page, actions/admin-actions.ts (admin_variables; shared owner for B/C/D), actions/faq-actions.ts + faq-data.ts, api/chat + chat-session + chat-suggestions + chatbot-models, components/chatbot/{Chatbot.tsx,system-prompt.ts} (Chatbot unrendered but ported).

## Package F — Shopify webhook + scripts
api/webhooks/shopify/orders (HMAC; upsert buyers), lib/shopify/verify-webhook.ts, scripts/{shopify-edit-order-variant,shopify-register-order-webhook,shopify-token-scopes,update-variant-map}.mjs → monorepo scripts/shopify/, scripts/*.sql (reference only — superseded by migrations), scripts/*.md docs.

## Package G — DO NOT PORT
AnalyticsTracker, lib/analytics.ts, use-ab-analytics, features/analytics/ABTracker, api/track-ab, api/popup-ab, ab-actions, config/journeys, use-journey-checkout, homepage-ab, GlobalStyleOverride, WebflowBackgroundVideo, FoundersClosingBlock, _backup-email-actions, repomix files, subscribers CSV (PII), root loose images, docs/*.MOV, .shopify/.aidesigner/.mcp.json.

## Env vars apps/web needs (Phase 2 additions to .env.example)
RESEND_API_KEY, SHOPIFY_STORE_DOMAIN, NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN, NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN, SHOPIFY_STOREFRONT_API_VERSION, SHOPIFY_API_VERSION, SHOPIFY_ADMIN_CLIENT_ID, SHOPIFY_ADMIN_CLIENT_SECRET, SHOPIFY_WEBHOOK_SECRET, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, NEXT_PUBLIC_EMAIL_TRACK_URL, INTERNAL_API_SECRET (verify usage).

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@dreamplay/db";
import { AB_COOKIE, resolveFunnel, type FunnelResolution } from "@dreamplay/ab";
import { AB_TESTING_SETTING_KEY, abFunnel } from "@/config/ab";

/**
 * The admin "testing" toggle (settings key `ab_testing_mode`, set from
 * /admin/ab-tests): when enabled, /main and / funnel ALL traffic into /ab.
 * Read via plain REST (edge-safe) and cached per isolate for 30s — a toggle
 * flip reaches every visitor within ~30s. Fails closed (normal /main
 * behavior) if the DB is unreachable.
 */
const TESTING_MODE_CACHE_MS = 30_000;
let testingModeCache: { value: boolean; expires: number } | null = null;

async function getAbTestingMode(): Promise<boolean> {
    const now = Date.now();
    if (testingModeCache && testingModeCache.expires > now) return testingModeCache.value;

    let enabled = false;
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (url && key) {
            const res = await fetch(
                `${url}/rest/v1/settings?key=eq.${AB_TESTING_SETTING_KEY}&select=value`,
                { headers: { apikey: key, authorization: `Bearer ${key}` } }
            );
            if (res.ok) {
                const rows = (await res.json()) as Array<{ value?: { enabled?: unknown } }>;
                enabled = rows?.[0]?.value?.enabled === true;
            }
        }
    } catch {
        // Unreachable DB must never break routing — fall back to disabled.
    }
    testingModeCache = { value: enabled, expires: now + TESTING_MODE_CACHE_MS };
    return enabled;
}

/**
 * Refresh the Supabase auth session on every request.
 * Mirrors the @supabase/ssr middleware recipe, using the shared
 * @dreamplay/db server client factory with a request/response cookie adapter.
 */
async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient({
        getAll() {
            return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
            );
        },
    });

    // Refresh the session — this is the key call
    await supabase.auth.getUser();

    return supabaseResponse;
}

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    const isApiOrAdmin = pathname.startsWith("/api") || pathname.startsWith("/admin");
    const isStaticFile = /\.(.*)$/.test(pathname);

    const hostname = request.headers.get("host")?.split(":")[0] || "";
    const isShopHost = hostname === "shop.dreamplaypianos.com";

    // ========================================================================
    // A/B FUNNEL ROUTING (Decision D11; must resolve BEFORE session refresh)
    //   /      → redirect to /main (everyone; D14), or /ab when the admin
    //            testing toggle is ON
    //   /main  → rewrite to the manually-pinned layout (never tagged/scored)
    //   /ab    → sticky dp_ab cookie or CSPRNG assignment → rewrite to the
    //            variation's layout route; /ab/<key> forces a variation.
    // Stamping the resolved cookie onto the REQUEST here means the server
    // render of this same request already sees it (no flash on first visit);
    // updateSession() forwards the mutated request via
    // NextResponse.next({ request }).
    // ========================================================================
    let funnel: FunnelResolution = { type: "none" };
    if (!isApiOrAdmin && !isStaticFile && !isShopHost) {
        // The toggle only changes / and /main — skip the settings read elsewhere.
        const testingMode =
            pathname === "/" || pathname === "/main" ? await getAbTestingMode() : false;
        funnel = resolveFunnel(
            abFunnel,
            pathname,
            url.searchParams,
            request.cookies.get(AB_COOKIE)?.value,
            { testingMode }
        );

        if (funnel.type === "redirect") {
            const redirectUrl = url.clone();
            redirectUrl.pathname = funnel.to;
            // 307 keeps the query string (sid/cid/utm survive to /main | /ab).
            return NextResponse.redirect(redirectUrl);
        }
        if (funnel.type === "rewrite" && funnel.setCookie) {
            request.cookies.set(funnel.setCookie.name, funnel.setCookie.value);
        }
    }

    const applyFunnelCookie = <T extends NextResponse>(response: T): T => {
        if (funnel.type === "rewrite" && funnel.setCookie) {
            const { name, value, ...options } = funnel.setCookie;
            response.cookies.set(name, value, options);
        }
        return response;
    };

    // ========================================================================
    // REFRESH SUPABASE AUTH SESSION (must run on every request)
    // Guarded: a missing Supabase env (local dev without .env.local) or a
    // transient auth failure must never 500 the whole site from middleware —
    // auth-dependent pages handle their own signed-out state.
    // ========================================================================
    let sessionResponse: NextResponse;
    try {
        sessionResponse = await updateSession(request);
    } catch {
        sessionResponse = NextResponse.next({ request });
    }

    // Skip rewrites for API routes, admin, and auth paths
    if (isApiOrAdmin) {
        return sessionResponse;
    }

    // Skip static files
    if (isStaticFile) {
        return sessionResponse;
    }

    // Serve the shop subdomain from the internal /shop route.
    if (isShopHost) {
        if (pathname === "/") {
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = "/shop";
            const response = NextResponse.rewrite(rewriteUrl, { request });
            sessionResponse.cookies.getAll().forEach(c => response.cookies.set(c.name, c.value));
            return response;
        }

        return sessionResponse;
    }

    // /main and /ab are virtual: the resolved layout is served via rewrite,
    // URL unchanged, so analytics `path` cleanly separates the two funnels.
    const funnelRewritePath =
        funnel.type === "rewrite" && funnel.to !== pathname ? funnel.to : undefined;

    const searchParams = url.searchParams;

    // ========================================================================
    // SID/CID COOKIE CAPTURE (params stay in URL)
    // Reads subscriber/campaign IDs from email links, saves to root-domain
    // cookies for cross-subdomain tracking. URL params are NOT stripped.
    // ========================================================================
    const sid = searchParams.get("sid");
    const cid = searchParams.get("cid");

    if (sid) {
        // Set root-domain cookies so all subdomains can read them
        const cookieOpts: {
            maxAge: number;
            path: string;
            domain?: string;
            sameSite: "lax";
        } = {
            maxAge: 60 * 60 * 24 * 90, // 90 days
            path: "/",
            domain: ".dreamplaypianos.com",
            sameSite: "lax",
        };

        // For localhost dev, don't set domain (browsers reject dotted localhost)
        const isLocal = request.headers.get("host")?.includes("localhost");
        if (isLocal) delete cookieOpts.domain;

        // Continue without redirect — keep sid/cid in URL
        let passthrough: NextResponse;
        if (funnelRewritePath) {
            const rewriteUrl = url.clone();
            rewriteUrl.pathname = funnelRewritePath;
            passthrough = NextResponse.rewrite(rewriteUrl, { request });
        } else {
            passthrough = NextResponse.next({ request });
        }

        passthrough.cookies.set("dp_sid", sid, cookieOpts);
        if (cid) passthrough.cookies.set("dp_cid", cid, cookieOpts);

        // Safety net: store the full original URL (only on first touch)
        if (!request.cookies.get("dp_first_touch_url")) {
            passthrough.cookies.set(
                "dp_first_touch_url",
                url.pathname + url.search,
                cookieOpts
            );
        }

        // Attach auth cookies from session
        sessionResponse.cookies.getAll().forEach(c =>
            passthrough.cookies.set(c.name, c.value)
        );

        return applyFunnelCookie(passthrough);
    }

    if (funnelRewritePath) {
        const rewriteUrl = url.clone();
        rewriteUrl.pathname = funnelRewritePath;
        const response = NextResponse.rewrite(rewriteUrl, { request });
        sessionResponse.cookies.getAll().forEach(c => response.cookies.set(c.name, c.value));
        return applyFunnelCookie(response);
    }

    return applyFunnelCookie(sessionResponse);
}

export const config = {
    matcher: [
        // Exclude Next Static files AND media folders to save processing time
        "/((?!_next/static|_next/image|images|videos|favicon.ico).*)",
    ],
};

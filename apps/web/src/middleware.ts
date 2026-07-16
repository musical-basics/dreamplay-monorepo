import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@dreamplay/db";

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
    // ========================================================================
    // REFRESH SUPABASE AUTH SESSION (must run on every request)
    // ========================================================================
    const sessionResponse = await updateSession(request);

    const url = request.nextUrl;
    const pathname = url.pathname;
    const hostname = request.headers.get("host")?.split(":")[0] || "";
    const isShopHost = hostname === "shop.dreamplaypianos.com";

    // Skip rewrites for API routes, admin, and auth paths
    if (pathname.startsWith('/api') || pathname.startsWith('/admin') || pathname.startsWith('/api/auth')) {
        return sessionResponse;
    }

    // Skip static files
    if (pathname.match(/\.(.*)$/)) {
        return sessionResponse;
    }

    // Serve the shop subdomain from the internal /shop route.
    if (isShopHost) {
        if (pathname === "/") {
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = "/shop";
            const response = NextResponse.rewrite(rewriteUrl);
            sessionResponse.cookies.getAll().forEach(c => response.cookies.set(c.name, c.value));
            return response;
        }

        return sessionResponse;
    }

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
        const passthrough = NextResponse.next();

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

        return passthrough;
    }

    return sessionResponse;
}

export const config = {
    matcher: [
        // Exclude Next Static files AND media folders to save processing time
        "/((?!_next/static|_next/image|images|videos|favicon.ico).*)",
    ],
};

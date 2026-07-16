"use client"

import { useEffect, useRef, Suspense } from "react"
import { useSearchParams, usePathname } from "next/navigation"

const EMAIL_TRACK_URL = process.env.NEXT_PUBLIC_EMAIL_TRACK_URL || "https://email.dreamplaypianos.com/api/track"

function sendEvent(sid: string | null, type: string, urlPath: string, duration?: number, tempSession?: string | null) {
    const payload = {
        subscriber_id: sid,
        campaign_id: localStorage.getItem("dp_campaign_id"),
        type: type,
        url: window.location.origin + urlPath,
        duration: duration,
        temp_session_id: tempSession || undefined,
    }

    // Send to your Email App API (The "Receiver")
    // Use keepalive: true to ensure the request finishes even if the tab is closing
    fetch(EMAIL_TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
    }).catch(err => console.error("Tracking error", err))
}

function EmailTrackerContent() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    // Track when the user lands on a specific page (set on mount by the effect below)
    const startTime = useRef(0)

    // 1. IDENTIFY: Check for Subscriber ID in cookies (set by middleware) + generate temp session
    useEffect(() => {
        // Generate a persistent temp session for anonymous identity stitching
        if (!localStorage.getItem("dp_temp_session")) {
            localStorage.setItem("dp_temp_session", crypto.randomUUID())
        }

        // Read sid/cid from root-domain cookies (set by middleware from URL params)
        const sidMatch = document.cookie.match(/(^| )dp_sid=([^;]+)/)
        const cidMatch = document.cookie.match(/(^| )dp_cid=([^;]+)/)
        const sid = sidMatch ? sidMatch[2] : null
        const cid = cidMatch ? cidMatch[2] : null

        if (sid) {
            // Sync to localStorage for components that read from there
            localStorage.setItem("dp_subscriber_id", sid)
            if (cid) localStorage.setItem("dp_campaign_id", cid)

            // Safe click tracking: fire once per session when both sid and cid exist
            if (cid && !sessionStorage.getItem("dp_click_tracked")) {
                sessionStorage.setItem("dp_click_tracked", "1")
                fetch(EMAIL_TRACK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subscriber_id: sid,
                        campaign_id: cid,
                        type: "click",
                        url: window.location.origin + pathname,
                    }),
                    keepalive: true
                }).catch(err => console.error("Click tracking error", err))
            }
        }

        // Read email from em cookie or URL fallback
        const emMatch = document.cookie.match(/(^| )dp_em=([^;]+)/)
        const em = emMatch ? emMatch[2] : searchParams.get("em")
        if (em) {
            localStorage.setItem("dp_user_email", em)
        }
    }, [searchParams])

    // 2. REPORT: Track Page Views & Duration
    useEffect(() => {
        const sid = localStorage.getItem("dp_subscriber_id")
        const tempSession = localStorage.getItem("dp_temp_session")
        if (!sid && !tempSession) return // Track if we have either identifier

        // A. Send "Page View" immediately
        sendEvent(sid, "page_view", pathname, undefined, tempSession)

        // Reset timer for the new page
        startTime.current = Date.now()

        // B. Send "Session End" when they leave the page
        return () => {
            const duration = Math.round((Date.now() - startTime.current) / 1000)
            if (duration > 1) { // Only track if they stayed > 1 second
                sendEvent(sid, "session_end", pathname, duration, tempSession)
            }
        }
    }, [pathname])

    return null
}

// 3. WRAP: Use Suspense to prevent Next.js de-opt
export function EmailTracker() {
    return (
        <Suspense fallback={null}>
            <EmailTrackerContent />
        </Suspense>
    )
}

// Global conversion helper — importable from any component
export function trackEmailConversion(type: 'conversion_t1' | 'conversion_t2' | 'conversion_t3', path: string) {
    if (typeof window === 'undefined') return;
    const sid = localStorage.getItem("dp_subscriber_id");
    const cid = localStorage.getItem("dp_campaign_id");

    if (!sid) return; // Only track conversions for known email subscribers

    const emailTrackUrl = process.env.NEXT_PUBLIC_EMAIL_TRACK_URL || "https://email.dreamplaypianos.com/api/track";
    fetch(emailTrackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            subscriber_id: sid,
            campaign_id: cid,
            type: type,
            url: window.location.origin + path,
        }),
        keepalive: true
    }).catch(console.error);
}

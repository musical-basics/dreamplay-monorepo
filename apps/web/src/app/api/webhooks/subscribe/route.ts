import { NextResponse } from 'next/server';
import { workspaceSchema } from '@/app/api/agent/lib/schemas';
import { saveSubscriber } from '@/lib/subscriber-capture-db';

/**
 * Legacy subscribe webhook, absorbed from dreamplay-email-2 (D7, D20).
 *
 * Other properties still POST captures to
 * https://email.dreamplaypianos.com/api/webhooks/subscribe (the blog's
 * newsletter form, older landing pages). That host has pointed at this app
 * since cutover, and this route did not exist until 2026-10-23, so those
 * captures 404'd. Same body as before: { email, first_name?, tags?,
 * country?, workspace? }; extra legacy fields (city, ip_address,
 * temp_session_id, gdpr_consent) are accepted and ignored. No support
 * notification here; the site's own forms send theirs from the server action.
 */

const DEFAULT_ORIGIN = 'https://dreamplaypianos.com';
const ALLOWED_ORIGINS = [
    DEFAULT_ORIGIN,
    'https://www.dreamplaypianos.com',
    'https://blog.dreamplaypianos.com',
    'https://belgium-concert-landing-page.vercel.app',
];

function corsHeaders(request: Request) {
    const origin = request.headers.get('origin');
    return {
        'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : DEFAULT_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS(request: Request) {
    return NextResponse.json({}, { headers: corsHeaders(request) });
}

export async function POST(request: Request) {
    const headers = corsHeaders(request);
    try {
        const body = await request.json().catch(() => null);
        const email = typeof body?.email === 'string' ? body.email.trim() : '';
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400, headers });
        }

        const workspace = workspaceSchema.safeParse(body.workspace);
        const country = typeof body.country === 'string' ? body.country : null;
        const id = await saveSubscriber({
            email,
            firstName: typeof body.first_name === 'string' ? body.first_name : '',
            tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown): t is string => typeof t === 'string') : undefined,
            // Legacy callers sent Vercel's 2-letter country header value here.
            countryCode: country && /^[A-Z]{2}$/.test(country) ? country : null,
            workspace: workspace.success ? workspace.data : undefined,
        });

        return NextResponse.json({ success: true, id }, { headers });
    } catch (err: unknown) {
        console.error('SUBSCRIBE_WEBHOOK: capture failed:', err);
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500, headers });
    }
}

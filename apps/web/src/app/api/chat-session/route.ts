import { NextResponse } from 'next/server';
import type { Json } from '@dreamplay/db';
import { getAdminDb } from '@/lib/db';

// The new chat_sessions schema keeps request context (page_url, ip_address,
// email) inside the `metadata` jsonb column instead of dedicated columns.

async function mergeSessionMetadata(
    supabase: ReturnType<typeof getAdminDb>,
    sessionId: string,
    patch: Record<string, Json>
) {
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('metadata')
        .eq('id', sessionId)
        .single();

    const existing =
        session?.metadata && typeof session.metadata === 'object' && !Array.isArray(session.metadata)
            ? (session.metadata as Record<string, Json>)
            : {};

    await supabase
        .from('chat_sessions')
        .update({
            metadata: { ...existing, ...patch },
            updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
}

// POST: Create session or add a message
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { session_id, role, content, email, page_url } = body;

        const supabase = getAdminDb();

        // Create new session
        if (!session_id) {
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                    metadata: {
                        page_url: page_url || null,
                        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                    },
                })
                .select('id')
                .single();

            if (error) throw error;
            return NextResponse.json({ session_id: data.id });
        }

        // Add message to existing session
        if (role && content) {
            const { error: msgError } = await supabase
                .from('chat_messages')
                .insert({ session_id, role, content });

            if (msgError) throw msgError;

            // Increment message count
            const { data: session } = await supabase
                .from('chat_sessions')
                .select('message_count')
                .eq('id', session_id)
                .single();

            await supabase
                .from('chat_sessions')
                .update({
                    message_count: (session?.message_count || 0) + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', session_id);
        }

        // Save email if provided (stored in metadata)
        if (email) {
            await mergeSessionMetadata(supabase, session_id, { email });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Chat session error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET: Check session status (for admin takeover detection)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const session_id = url.searchParams.get('session_id');

    if (!session_id) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    const supabase = getAdminDb();

    const { data, error } = await supabase
        .from('chat_sessions')
        .select('status, admin_takeover_at')
        .eq('id', session_id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if admin took over within last 24 hours
    let adminActive = false;
    if (data?.admin_takeover_at) {
        const takeoverTime = new Date(data.admin_takeover_at).getTime();
        const now = Date.now();
        adminActive = (now - takeoverTime) < 24 * 60 * 60 * 1000;
    }

    return NextResponse.json({ status: data?.status, adminActive });
}

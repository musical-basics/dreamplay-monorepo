import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/db';
import { buildSystemPrompt } from '@/components/chatbot/system-prompt';

// Allow your blog to call this API
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://blog.dreamplaypianos.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle Preflight requests for CORS
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

function getModel(modelString: string) {
    const [provider, ...rest] = modelString.split(':');
    const modelId = rest.join(':');

    switch (provider) {
        case 'anthropic':
            return anthropic(modelId);
        case 'google':
        default:
            return google(modelId || 'gemini-2.5-flash');
    }
}

export async function POST(req: Request) {
    const { messages, session_id } = await req.json();

    const supabase = getAdminDb();

    // Check if admin has taken over this session (within last 24h)
    if (session_id) {
        try {
            const { data: session } = await supabase
                .from('chat_sessions')
                .select('admin_takeover_at')
                .eq('id', session_id)
                .single();

            if (session?.admin_takeover_at) {
                const takeoverTime = new Date(session.admin_takeover_at).getTime();
                const hoursSince = (Date.now() - takeoverTime) / (1000 * 60 * 60);
                if (hoursSince < 24) {
                    return new Response(
                        "Our team has seen your message and will respond shortly! 🙋‍♂️ Check back soon.",
                        { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
                    );
                }
            }
        } catch {
            // continue with AI response if check fails
        }
    }

    // Read settings from admin panel
    let modelString = 'google:gemini-2.5-flash';
    let knowledge = '';

    try {
        const { data } = await supabase
            .from('admin_variables')
            .select('key, value')
            .in('key', ['chatbot_model', 'chatbot_knowledge']);

        data?.forEach((row: { key: string; value: string | null }) => {
            if (row.key === 'chatbot_model' && row.value) modelString = row.value;
            if (row.key === 'chatbot_knowledge' && row.value) knowledge = row.value;
        });
    } catch {
        // fallback to defaults
    }

    const model = getModel(modelString);

    const result = streamText({
        model,
        system: buildSystemPrompt(knowledge),
        messages: await convertToModelMessages(messages),
    });

    return result.toTextStreamResponse({ headers: corsHeaders });
}

import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ModelEntry {
    id: string;        // e.g. "google:gemini-2.5-flash"
    provider: string;  // "Google" or "Anthropic"
    name: string;      // human-readable display name
}

interface GoogleModel {
    name?: string;
    displayName?: string;
    supportedGenerationMethods?: string[];
}

interface AnthropicModel {
    id: string;
    display_name?: string;
}

async function fetchGoogleModels(): Promise<ModelEntry[]> {
    if (!GOOGLE_API_KEY) return [];
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`,
            { next: { revalidate: 3600 } } // cache 1 hour
        );
        if (!res.ok) return [];
        const data = await res.json();

        return ((data.models || []) as GoogleModel[])
            .filter((m) =>
                m.supportedGenerationMethods?.includes('generateContent') &&
                m.name?.startsWith('models/')
            )
            .map((m) => {
                const modelId = (m.name as string).replace('models/', '');
                return {
                    id: `google:${modelId}`,
                    provider: 'Google',
                    name: m.displayName || modelId,
                };
            })
            .sort((a: ModelEntry, b: ModelEntry) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
}

async function fetchAnthropicModels(): Promise<ModelEntry[]> {
    if (!ANTHROPIC_API_KEY) return [];
    try {
        const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();

        return ((data.data || []) as AnthropicModel[])
            .map((m) => ({
                id: `anthropic:${m.id}`,
                provider: 'Anthropic',
                name: m.display_name || m.id,
            }))
            .sort((a: ModelEntry, b: ModelEntry) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
}

export async function GET() {
    const [googleModels, anthropicModels] = await Promise.all([
        fetchGoogleModels(),
        fetchAnthropicModels(),
    ]);

    return NextResponse.json({ models: [...googleModels, ...anthropicModels] });
}

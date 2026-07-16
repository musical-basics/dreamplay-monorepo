import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/db';

// GET: Return chatbot suggested questions
export async function GET() {
    try {
        const supabase = getAdminDb();

        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'chatbot_suggestions')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return NextResponse.json({ suggestions: [] });
            throw error;
        }

        const suggestions = JSON.parse(data?.value || '[]');
        return NextResponse.json({ suggestions });
    } catch {
        return NextResponse.json({ suggestions: [] });
    }
}

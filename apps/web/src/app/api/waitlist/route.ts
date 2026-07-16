import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { fullName, email } = await request.json();

        if (!fullName || !email) {
            console.error("WAITLIST_API: Missing name or email");
            return NextResponse.json({ error: 'Full name and Email are required' }, { status: 400 });
        }

        // Service-role Supabase client (throws a descriptive error if env is missing)
        const supabase = getAdminDb();

        // Insert into waitlist table
        const { error } = await supabase
            .from('waitlist')
            .insert({
                full_name: fullName,
                email: email,
            });

        if (error) {
            console.error('WAITLIST_API: Supabase insert error:', error);
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        console.error('WAITLIST_API: Uncaught API Error:', err);
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

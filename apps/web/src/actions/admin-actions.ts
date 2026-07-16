'use server'

import { revalidatePath } from 'next/cache'
import { getAdminDb } from '@/lib/db'

// Server actions for reading/writing site configuration stored in the
// `admin_variables` key/value table. Uses the service-role client — these
// only ever run server-side.
//
// NOTE: the legacy popup A/B config, homepage A/B version, and journey engine
// functions were intentionally NOT ported (A/B + journey systems are replaced
// by @dreamplay/ab in Phase 3+).

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

export async function getCountdownDate() {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'countdown_end_date')
            .single()

        if (error) {
            console.error('Error fetching countdown date:', error)
            return null
        }

        return data?.value || null
    } catch (error) {
        console.error('Failed to get countdown date:', error)
        return null
    }
}

export async function updateCountdownDate(date: string) {
    try {
        // Simple validation for ISO string
        const d = new Date(date)
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date format')
        }

        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'countdown_end_date',
                value: date,
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating countdown date:', error)
            throw new Error(error.message)
        }

        return { success: true }
    } catch (error: unknown) {
        console.error('Failed to update countdown date:', error)
        return { success: false, error: errorMessage(error) }
    }
}

export async function getDiscountPopupStatus() {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'show_discount_popup')
            .single()

        if (error) {
            // If key doesn't exist, default to true
            if (error.code === 'PGRST116') return 'true'
            console.error('Error fetching discount status:', error)
            return 'true'
        }

        return data?.value || 'true'
    } catch (error) {
        console.error('Failed to get discount status:', error)
        return 'true'
    }
}

export async function updateDiscountPopupStatus(enabled: boolean) {
    try {
        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'show_discount_popup',
                value: String(enabled),
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating discount status:', error)
            throw new Error(error.message)
        }

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

export async function loginAdmin(password: string) {
    if (password === 'sorenkier') {
        // In a real app we'd use cookies() from next/headers to set a session
        // For this simple request, we'll verify and return success, letting client handle persistence
        return { success: true }
    }
    return { success: false, error: 'Invalid password' }
}

export async function getCustomizePageUrls() {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('key, value')
            .in('key', ['customize_url_bundle', 'customize_url_solo', 'customize_url_reservation'])

        if (error) {
            console.error('Error fetching customize URLs:', error)
            return {
                bundle: '',
                solo: '',
                reservation: ''
            }
        }

        // Initialize with emptiness
        const urlMap: Record<string, string> = {
            'customize_url_bundle': '',
            'customize_url_solo': '',
            'customize_url_reservation': ''
        }

        data?.forEach((row: { key: string, value: string | null }) => {
            urlMap[row.key] = row.value ?? ''
        })

        return {
            bundle: urlMap['customize_url_bundle'],
            solo: urlMap['customize_url_solo'],
            reservation: urlMap['customize_url_reservation']
        }
    } catch (error) {
        console.error('Failed to get customize URLs:', error)
        return {
            bundle: '',
            solo: '',
            reservation: ''
        }
    }
}

export async function updateCustomizePageUrls(urls: { bundle: string, solo: string, reservation: string }) {
    try {
        const updates = [
            { key: 'customize_url_bundle', value: urls.bundle, updated_at: new Date().toISOString() },
            { key: 'customize_url_solo', value: urls.solo, updated_at: new Date().toISOString() },
            { key: 'customize_url_reservation', value: urls.reservation, updated_at: new Date().toISOString() }
        ]

        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert(updates)

        if (error) {
            console.error('Error updating customize URLs:', error)
            throw new Error(error.message)
        }

        revalidatePath('/customize')
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

export async function getHiddenProducts(): Promise<string[]> {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'hidden_products')
            .single()

        if (error) {
            if (error.code === 'PGRST116') return ['reservation'] // default: reservation hidden
            console.error('Error fetching hidden products:', error)
            return ['reservation']
        }

        return JSON.parse(data?.value || '["reservation"]')
    } catch (error) {
        console.error('Failed to get hidden products:', error)
        return ['reservation']
    }
}

export async function updateHiddenProducts(hiddenIds: string[]) {
    try {
        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'hidden_products',
                value: JSON.stringify(hiddenIds),
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating hidden products:', error)
            throw new Error(error.message)
        }

        revalidatePath('/customize')
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

export async function getChatbotEnabled(): Promise<boolean> {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'show_chatbot')
            .single()

        if (error) {
            if (error.code === 'PGRST116') return true // default on
            console.error('Error fetching chatbot enabled status:', error)
            return true
        }

        return data?.value === 'true'
    } catch (error) {
        console.error('Failed to get chatbot enabled status:', error)
        return true
    }
}

export async function updateChatbotEnabled(enabled: boolean) {
    try {
        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'show_chatbot',
                value: String(enabled),
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating chatbot enabled status:', error)
            throw new Error(error.message)
        }

        revalidatePath('/')
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

export async function getChatModel(): Promise<string> {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'chatbot_model')
            .single()

        if (error) {
            if (error.code === 'PGRST116') return 'google:gemini-2.5-flash'
            console.error('Error fetching chat model:', error)
            return 'google:gemini-2.5-flash'
        }

        return data?.value || 'google:gemini-2.5-flash'
    } catch (error) {
        console.error('Failed to get chat model:', error)
        return 'google:gemini-2.5-flash'
    }
}

export async function updateChatModel(model: string) {
    try {
        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'chatbot_model',
                value: model,
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating chat model:', error)
            throw new Error(error.message)
        }

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

export async function getChatKnowledge(): Promise<string> {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'chatbot_knowledge')
            .single()

        if (error) {
            if (error.code === 'PGRST116') return ''
            console.error('Error fetching chat knowledge:', error)
            return ''
        }

        return data?.value || ''
    } catch (error) {
        console.error('Failed to get chat knowledge:', error)
        return ''
    }
}

export async function updateChatKnowledge(knowledge: string) {
    try {
        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'chatbot_knowledge',
                value: knowledge,
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating chat knowledge:', error)
            throw new Error(error.message)
        }

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

export async function getChatSuggestions(): Promise<string[]> {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('admin_variables')
            .select('value')
            .eq('key', 'chatbot_suggestions')
            .single()

        if (error) {
            if (error.code === 'PGRST116') return []
            console.error('Error fetching chat suggestions:', error)
            return []
        }

        try {
            return JSON.parse(data?.value || '[]')
        } catch {
            return []
        }
    } catch (error) {
        console.error('Failed to get chat suggestions:', error)
        return []
    }
}

export async function updateChatSuggestions(suggestions: string[]) {
    try {
        const supabase = getAdminDb()
        const { error } = await supabase
            .from('admin_variables')
            .upsert({
                key: 'chatbot_suggestions',
                value: JSON.stringify(suggestions),
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating chat suggestions:', error)
            throw new Error(error.message)
        }

        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: errorMessage(error) }
    }
}

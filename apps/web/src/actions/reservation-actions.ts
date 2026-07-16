'use server'

/**
 * reservation-actions.ts
 * Server-side actions for buyer portal: decision persistence + buyer routing.
 * All reads/writes use the service-role client (server-side only).
 *
 * ─── EMAIL TEMPLATES ────────────────────────────────────────────────────────
 * Two emails are sent on decision submission:
 *   1. Team notification  → lionel@musicalbasics.com  (see: sendTeamNotification)
 *   2. Buyer confirmation → buyer's email             (see: sendBuyerConfirmation)
 *
 * To edit copy/styling, find the function by name below and update the `html`
 * string inside the resend.emails.send() call.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Resend } from 'resend'
import type { Json, ReservationDecision, Tables } from '@dreamplay/db'
import { getAdminDb } from '@/lib/db'

export type { ReservationDecision } from '@dreamplay/db'

const DECISION_LABELS: Record<ReservationDecision, string> = {
    refund_requested: 'Request Full Refund',
    keep_reservation: 'Keep My Reservation',
    upgrade_to_pro: 'Upgrade to DreamPlay One Pro',
}

const DECISION_EMOJI: Record<ReservationDecision, string> = {
    refund_requested: '🔴',
    keep_reservation: '🟢',
    upgrade_to_pro: '⭐',
}

// ─── Buyer Allowlist ───

export async function isBuyer(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim()
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('buyers')
            .select('email')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (error) {
            console.error('[isBuyer] DB error:', error.code, error.message)
            return false
        }

        return !!data
    } catch (err: unknown) {
        console.error('[isBuyer] Unexpected error:', err instanceof Error ? err.message : err)
        return false
    }
}

// ─── Decision Records ───

export type DecisionRecord = Tables<'reservation_decisions'>

export async function getReservationDecision(userId: string): Promise<DecisionRecord | null> {
    try {
        const supabase = getAdminDb()
        const { data, error } = await supabase
            .from('reservation_decisions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('[getReservationDecision] DB error:', error.message)
            return null
        }

        return data
    } catch (err) {
        console.error('[getReservationDecision] Unexpected error:', err)
        return null
    }
}

export async function saveReservationDecision(
    userId: string,
    email: string,
    decision: ReservationDecision,
    orderMetadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getAdminDb()
        const { data: existing } = await supabase
            .from('reservation_decisions')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        const now = new Date().toISOString()

        if (existing?.id) {
            const { error } = await supabase
                .from('reservation_decisions')
                .update({
                    decision,
                    email,
                    selected_at: now,
                    order_metadata: (orderMetadata ?? {}) as Json,
                    updated_at: now,
                })
                .eq('id', existing.id)

            if (error) {
                console.error('[saveReservationDecision] Update error:', error.message)
                return { success: false, error: error.message }
            }
        } else {
            const { error } = await supabase
                .from('reservation_decisions')
                .insert({
                    user_id: userId,
                    email,
                    decision,
                    selected_at: now,
                    order_metadata: (orderMetadata ?? {}) as Json,
                    created_at: now,
                    updated_at: now,
                })

            if (error) {
                console.error('[saveReservationDecision] Insert error:', error.message)
                return { success: false, error: error.message }
            }
        }

        // Fire-and-forget both emails — failures don't block buyer confirmation
        if (email) {
            Promise.all([
                sendTeamNotification(email, decision, orderMetadata),
                sendBuyerConfirmation(email, decision),
            ]).catch((err) =>
                console.error('[saveReservationDecision] Email error (non-blocking):', err)
            )
        }

        return { success: true }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[saveReservationDecision] Unexpected error:', message)
        return { success: false, error: message }
    }
}

// ─── Email Templates ──────────────────────────────────────────────────────────
//
// EDIT YOUR EMAIL TEMPLATES BELOW.
// • sendTeamNotification  → internal alert to your team
// • sendBuyerConfirmation → confirmation sent to the buyer
//
// Both use Resend. To change copy, update the `html` string in each function.
// To change the from address, update the `from` field (must be a verified Resend domain).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TEMPLATE 1: Team notification
 * Sent to: lionel@musicalbasics.com
 * Triggered: every time a buyer submits or changes their decision
 */
async function sendTeamNotification(
    buyerEmail: string,
    decision: ReservationDecision,
    metadata?: Record<string, unknown>
): Promise<void> {
    if (!process.env.RESEND_API_KEY) return

    const resend = new Resend(process.env.RESEND_API_KEY)
    const label = DECISION_LABELS[decision]
    const emoji = DECISION_EMOJI[decision]
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    const previousLabel = metadata?.previous_decision
        ? ` (changed from: ${DECISION_LABELS[metadata.previous_decision as ReservationDecision]})`
        : ''

    await resend.emails.send({
        from: 'DreamPlay Pianos <support@dreamplaypianos.com>',
        to: ['lionel@musicalbasics.com'],
        subject: `${emoji} Reservation Decision: ${label}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
                <h2 style="margin: 0 0 16px; font-size: 20px;">Reservation Decision Submitted</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; width: 140px; vertical-align: top;">Buyer Email</td>
                        <td style="padding: 8px 0; font-weight: bold;">${buyerEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; vertical-align: top;">Decision</td>
                        <td style="padding: 8px 0; font-weight: bold;">${emoji} ${label}${previousLabel}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; vertical-align: top;">Submitted At</td>
                        <td style="padding: 8px 0;">${timestamp} PT</td>
                    </tr>
                </table>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #999; font-size: 12px; margin: 0;">
                    View all decisions in Supabase → reservation_decisions table.
                </p>
            </div>
        `,
    })
}

/**
 * TEMPLATE 2: Buyer confirmation
 * Sent to: the buyer's email address
 * Triggered: every time a buyer submits or changes their decision
 *
 * ── TO EDIT THIS EMAIL ──
 * The copy for each option is in the CONFIRMATION_COPY object below.
 * The shared header/footer HTML is in the template string at the bottom.
 */
const CONFIRMATION_COPY: Record<ReservationDecision, { subject: string; headline: string; body: string; nextStep: string }> = {
    refund_requested: {
        subject: 'Your DreamPlay Refund Request: Received',
        headline: "We've received your refund request.",
        body: `
            <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                We understand, and we appreciate everything. Building a brand-new piano keyboard from scratch
                takes time, and we respect your decision completely.
            </p>
            <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                Our team will process your full refund and reach out to you within
                <strong>2–3 business days</strong> to confirm the details. No fees, no questions asked.
            </p>
        `,
        nextStep: 'Expect an email from our team within 2–3 business days.',
    },
    keep_reservation: {
        subject: 'Your DreamPlay Reservation is Confirmed',
        headline: 'You\'re still on the list.',
        body: `
            <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                Your reservation is locked in. Your Founder's pricing is protected, and your spot in
                the first production run is secure. We're grateful for your continued trust.
            </p>
                Your reservation is locked in. Your Founder\'s pricing is protected, and your spot in
                the first production run is secure. We\'re grateful for your continued trust.
            </p>
            <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                DreamPlay One is on track for <strong>January 2027</strong> delivery. We\'ll keep you updated
                as we hit major milestones: tooling, assembly, and delivery.
            </p>
        `,
        nextStep: "We'll be in touch as production progresses.",
    },
    upgrade_to_pro: {
        subject: 'Your DreamPlay One Pro Upgrade Request: Received',
        headline: "Welcome to DreamPlay One Pro.",
        body: `
            <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                As one of our earliest supporters, you've earned this. Your upgrade request to
                <strong>DreamPlay One Pro</strong> has been received.
            </p>
            <p style="margin: 0 0 16px; color: #444; line-height: 1.6;">
                Our team will reach out shortly to confirm your finish preference
                (Aztec Gold or Nightmare Black) and process the $200 difference.
                Your existing reservation deposit counts toward the full Pro price.
            </p>
        `,
        nextStep: 'Our team will reach out to confirm your finish and complete the upgrade.',
    },
}

async function sendBuyerConfirmation(
    buyerEmail: string,
    decision: ReservationDecision
): Promise<void> {
    if (!process.env.RESEND_API_KEY) return

    const resend = new Resend(process.env.RESEND_API_KEY)
    const copy = CONFIRMATION_COPY[decision]
    const emoji = DECISION_EMOJI[decision]

    await resend.emails.send({
        from: 'Lionel at DreamPlay <support@dreamplaypianos.com>',
        to: [buyerEmail],
        subject: copy.subject,
        html: `
            <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 40px 24px; color: #111; background: #fff;">

                <!-- Logo / Brand -->
                <p style="font-family: sans-serif; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #999; margin: 0 0 40px;">
                    DreamPlay Pianos
                </p>

                <!-- Headline -->
                <h1 style="font-size: 26px; font-weight: normal; margin: 0 0 24px; line-height: 1.3; color: #111;">
                    ${emoji} ${copy.headline}
                </h1>

                <!-- Body copy (decision-specific) -->
                ${copy.body}

                <!-- Next step callout -->
                <div style="background: #f7f7f7; border-left: 3px solid #111; padding: 16px 20px; margin: 32px 0;">
                    <p style="font-family: sans-serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin: 0 0 6px;">Next Step</p>
                    <p style="margin: 0; font-size: 15px; color: #333;">${copy.nextStep}</p>
                </div>

                <!-- Signature -->
                <p style="color: #444; line-height: 1.6; margin: 32px 0 8px;">
                    Thank you again for being part of this from the beginning.
                </p>
                <p style="color: #444; margin: 0;">Lionel Yu, Founder</p>

                <!-- Footer -->
                <hr style="margin: 40px 0 24px; border: none; border-top: 1px solid #eee;" />
                <p style="font-family: sans-serif; font-size: 11px; color: #aaa; margin: 0; line-height: 1.6;">
                    DreamPlay Pianos · dreamplaypianos.com<br />
                    You're receiving this because you have an active reservation with us.
                    To update your decision, visit your
                    <a href="https://dreamplaypianos.com/my-reservation" style="color: #666;">reservation portal</a>.
                </p>
            </div>
        `,
    })
}

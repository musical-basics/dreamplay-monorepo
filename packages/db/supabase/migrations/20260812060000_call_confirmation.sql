-- Two-step call booking: propose a time, buyer confirms, THEN they get the
-- Zoom link.
--
-- The first email no longer carries a join URL. It links to
-- /confirm-call?t=<signed token>, where the buyer accepts the proposed slot
-- or asks for a different one. Only on acceptance is a Zoom meeting created
-- and the link email sent, so we never mint meetings nobody attends and a
-- forwarded invite cannot leak a live room.

alter table public.buyer_call_requests
    -- When the buyer accepted the proposed time. NULL = not confirmed yet.
    add column if not exists confirmed_at timestamptz,
    -- Set when the buyer uses "none of these work". Their reply text, if any,
    -- lands in reschedule_note so Lionel can pick a better slot by hand.
    add column if not exists declined_at timestamptz,
    add column if not exists reschedule_note text,
    -- When the second email (the one carrying the Zoom link) went out, so it
    -- can never be sent twice.
    add column if not exists link_sent_at timestamptz;

comment on column public.buyer_call_requests.confirmed_at is
    'Buyer accepted the proposed slot. Gates creating the Zoom meeting.';
comment on column public.buyer_call_requests.declined_at is
    'Buyer asked for a different time; see reschedule_note.';
comment on column public.buyer_call_requests.link_sent_at is
    'When the Zoom-link email went out. NULL = confirmed but link not sent.';

-- The confirm page and the link sender both filter on these.
create index if not exists buyer_call_requests_confirmed_at_idx
    on public.buyer_call_requests (confirmed_at)
    where confirmed_at is not null;

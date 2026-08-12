-- Founder call scheduling (AB Test August 10 follow-up).
--
-- Lionel proposes a slot per call request on /admin/founder-calls, confirms
-- it, then a send script emails the buyer the time + Zoom link. Everything
-- here is nullable: a row with scheduled_at NULL is simply unscheduled.

alter table public.buyer_call_requests
    -- The agreed start time, stored as UTC. Rendered per-buyer in their own
    -- timezone (buyer_call_requests.timezone) and in ET for Lionel.
    add column if not exists scheduled_at timestamptz,
    -- Meeting duration; 15 minutes is what the emails promised.
    add column if not exists scheduled_minutes integer not null default 15,
    -- Join URL. Zoom credentials are Server-to-Server OAuth, so this is
    -- created per meeting rather than being one static personal room.
    add column if not exists meeting_url text,
    -- Zoom's own meeting id, kept so a meeting can be updated or deleted.
    add column if not exists meeting_provider_id text,
    -- Set when the "here is your time" email actually goes out, so the
    -- scheduling email is never sent twice.
    add column if not exists invite_sent_at timestamptz;

comment on column public.buyer_call_requests.scheduled_at is
    'Agreed call start (UTC). NULL = not scheduled yet.';
comment on column public.buyer_call_requests.invite_sent_at is
    'When the scheduling email went out. NULL = drafted but not sent.';

-- Scheduled calls are read in time order on the admin page.
create index if not exists buyer_call_requests_scheduled_at_idx
    on public.buyer_call_requests (scheduled_at)
    where scheduled_at is not null;

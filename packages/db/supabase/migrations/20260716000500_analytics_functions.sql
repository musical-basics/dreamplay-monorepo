-- ============================================================================
-- 20260716000500_analytics_functions.sql
-- Phase 1, task 5 — server-side aggregation.
--
-- Port of the legacy dreamplay-analytics RPC get_analytics_summary
-- (supabase/get_analytics_summary.sql) with two intentional changes:
--   1. Admin/bot IP lists are read from public.settings ('admin_ips',
--      'bot_ips') instead of being hardcoded in the function body — the legacy
--      setup had them duplicated in the RPC and in src/lib/adminIPs.ts.
--   2. Reads the unified public.events table; A/B results group on
--      metadata->>'ab_variant' (falling back to legacy 'variant' for rows
--      imported in Phase 6).
--
-- Execution is restricted to service_role: the dashboard calls it through the
-- admin client, never from the browser.
-- ============================================================================

-- Helper: read a text[] out of a jsonb-array settings row. Returns '{}' when
-- the key is missing or not an array.
create or replace function public.get_setting_text_array(p_key text)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(elem)
      from public.settings s,
           jsonb_array_elements_text(s.value) as elem
      where s.key = p_key
        and jsonb_typeof(s.value) = 'array'
    ),
    '{}'::text[]
  );
$$;

comment on function public.get_setting_text_array(text) is
  'Reads settings.value (jsonb array of strings) for a key as text[]; empty array when absent.';

create or replace function public.get_analytics_summary(
  p_range text default '7d',
  p_exclude_admin boolean default false,
  p_exclude_bots boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start_time   timestamptz;
  v_now          timestamptz := now();
  v_live_users     integer;
  v_total_pageviews integer;
  v_unique_visitors integer;
  v_unique_pages    integer;
  v_chart_data   jsonb;
  v_ab_results   jsonb;
  v_bucket       text;
  v_bucket_fmt   text;
  v_excluded_ips text[] := '{}';
begin
  -- 1. Time range
  case p_range
    when '24h' then v_start_time := v_now - interval '24 hours';
    when '7d'  then v_start_time := v_now - interval '7 days';
    when '30d' then v_start_time := v_now - interval '30 days';
    when 'all' then v_start_time := '1970-01-01'::timestamptz;
    else            v_start_time := v_now - interval '7 days';
  end case;

  -- 2. Excluded IPs come from the settings table, not hardcoded lists.
  if p_exclude_admin then
    v_excluded_ips := v_excluded_ips || public.get_setting_text_array('admin_ips');
  end if;
  if p_exclude_bots then
    v_excluded_ips := v_excluded_ips || public.get_setting_text_array('bot_ips');
  end if;

  -- 3. Live users (distinct sessions in the last 5 minutes)
  select count(distinct session_id)
    into v_live_users
    from public.events
   where created_at > v_now - interval '5 minutes'
     and (cardinality(v_excluded_ips) = 0
          or ip_address is null
          or not (host(ip_address) = any (v_excluded_ips)));

  -- 4. Summary counts
  select count(distinct coalesce(host(ip_address), session_id)),
         count(*) filter (where event_name = 'pageview'),
         count(distinct path)
    into v_unique_visitors, v_total_pageviews, v_unique_pages
    from public.events
   where created_at > v_start_time
     and (cardinality(v_excluded_ips) = 0
          or ip_address is null
          or not (host(ip_address) = any (v_excluded_ips)));

  -- 5. Chart series (hourly buckets for 24h, daily otherwise)
  if p_range = '24h' then
    v_bucket := 'hour';
    v_bucket_fmt := 'FMHH AM';
  else
    v_bucket := 'day';
    v_bucket_fmt := 'Mon DD';
  end if;

  select coalesce(jsonb_agg(row_data order by bucket), '[]'::jsonb)
    into v_chart_data
    from (
      select date_trunc(v_bucket, created_at) as bucket,
             jsonb_build_object(
               'name', to_char(date_trunc(v_bucket, created_at), v_bucket_fmt),
               'visitors', count(distinct coalesce(session_id, host(ip_address))),
               'pageviews', count(*) filter (where event_name = 'pageview'),
               'unique_pages', count(distinct path),
               'avg_per_user', case
                 when count(distinct coalesce(session_id, host(ip_address))) > 0
                 then round(
                   (count(*) filter (where event_name = 'pageview'))::numeric
                     / count(distinct coalesce(session_id, host(ip_address))),
                   1)
                 else 0
               end
             ) as row_data
        from public.events
       where created_at > v_start_time
         and (cardinality(v_excluded_ips) = 0
              or ip_address is null
              or not (host(ip_address) = any (v_excluded_ips)))
       group by date_trunc(v_bucket, created_at)
    ) sub;

  -- 6. A/B results, keyed on metadata->>'ab_variant' (the stable contract key;
  --    coalesce covers legacy rows imported with the old 'variant' key).
  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
    into v_ab_results
    from (
      select jsonb_build_object(
               'variant', coalesce(metadata ->> 'ab_variant', metadata ->> 'variant'),
               'visitors', count(distinct session_id)
                 filter (where event_name in ('pageview', 'experiment_view')),
               'conversions', count(distinct session_id)
                 filter (where event_name in ('conversion', 'click_preorder', 'begin_checkout')),
               'conversion_rate', case
                 when count(distinct session_id)
                        filter (where event_name in ('pageview', 'experiment_view')) > 0
                 then round(
                   (count(distinct session_id)
                      filter (where event_name in ('conversion', 'click_preorder', 'begin_checkout')))::numeric
                     / (count(distinct session_id)
                          filter (where event_name in ('pageview', 'experiment_view')))
                     * 100,
                   1)
                 else 0
               end
             ) as row_data
        from public.events
       where created_at > v_start_time
         and coalesce(metadata ->> 'ab_variant', metadata ->> 'variant') is not null
         and (cardinality(v_excluded_ips) = 0
              or ip_address is null
              or not (host(ip_address) = any (v_excluded_ips)))
       group by coalesce(metadata ->> 'ab_variant', metadata ->> 'variant')
    ) sub;

  -- 7. Assemble
  return jsonb_build_object(
    'live_users', v_live_users,
    'total_pageviews', v_total_pageviews,
    'unique_visitors', v_unique_visitors,
    'unique_pages', v_unique_pages,
    'chart_data', v_chart_data,
    'ab_results', v_ab_results
  );
end;
$$;

comment on function public.get_analytics_summary(text, boolean, boolean) is
  'Server-side analytics aggregation (live users, pageviews, uniques, chart series, A/B results). Admin/bot IP exclusion lists come from public.settings.';

-- Dashboard calls this via the service-role client only.
revoke execute on function public.get_analytics_summary(text, boolean, boolean)
  from public, anon, authenticated;
revoke execute on function public.get_setting_text_array(text)
  from public, anon, authenticated;
grant execute on function public.get_analytics_summary(text, boolean, boolean)
  to service_role;
grant execute on function public.get_setting_text_array(text)
  to service_role;

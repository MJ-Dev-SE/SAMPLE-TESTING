-- =============================================================================
-- PAGE VISITS — RETENTION. Run once in Supabase Dashboard → SQL Editor → Run.
-- Requires page_visits.sql to already exist.
--
-- Auto-deletes page_visits rows older than 30 days, every day, via pg_cron
-- (a Postgres extension Supabase runs on every project, no separate service
-- needed). This keeps the table from growing forever while still giving a full
-- month of history for the admin console's KPIs/top-pages/recent-visits list.
-- Applies equally to logged-in and anonymous rows — it's a browsing log either
-- way, not a permanent record.
--
-- Runs as the job owner (not through PostgREST), so it bypasses RLS the same
-- way the track-visit Edge Function's service-role writes do — this is the
-- ONLY thing, besides an admin manually running SQL, that can delete rows here.
-- Safe to re-run this file any time (re-scheduling replaces the old job).
-- =============================================================================

create extension if not exists pg_cron with schema extensions;

-- Re-running this file shouldn't create duplicate jobs.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-old-page-visits') then
    perform cron.unschedule('purge-old-page-visits');
  end if;
end $$;

-- 18:00 UTC = 02:00 Manila time — a low-traffic hour.
select cron.schedule(
  'purge-old-page-visits',
  '0 18 * * *',
  $$ delete from public.page_visits where created_at < now() - interval '30 days' $$
);

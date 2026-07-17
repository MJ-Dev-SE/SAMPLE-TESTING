-- =============================================================================
-- PAGE VISITS — run once in Supabase Dashboard → SQL Editor → Run.
-- Requires admin.sql (public.is_admin()) to already exist.
--
-- Tracks every page view, logged-in or not:
--   - Logged-in visitors  → user_id (references profiles, so the admin console
--     can show their real name + picture, same as everywhere else on the site).
--   - Anonymous visitors  → visitor_id, a random UUID the client generates once
--     and keeps in localStorage (src/lib/visitorId.ts). No login required, no
--     personal info collected — it's just "this browser came back".
--   - ip_masked is a PRIVACY-REDUCED IP (last IPv4 octet / last 4 IPv6 groups
--     zeroed) captured server-side by the track-visit Edge Function — good
--     enough to say "same ISP / area", not precise enough to pin an address.
--
-- Rows are written ONLY by the track-visit Edge Function (service role) — there
-- is no insert policy here, so a client can never write an arbitrary row (fake
-- IP, fake page, spoofed user_id) directly against PostgREST.
-- =============================================================================

create table if not exists public.page_visits (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  text not null,
  user_id     uuid references public.profiles (id) on delete set null,
  path        text not null,
  referrer    text,
  user_agent  text,
  ip_masked   text,
  created_at  timestamptz not null default now()
);

alter table public.page_visits enable row level security;

-- Admins only — mirrors the login-audit table's "read-only, admin-gated" shape.
-- No insert/update/delete policy at all: the Edge Function writes via the
-- service-role key, which bypasses RLS entirely, so this table is effectively
-- append-only-by-the-server and read-only-by-admins.
drop policy if exists "admins read page visits" on public.page_visits;
create policy "admins read page visits" on public.page_visits
  for select using (public.is_admin());
grant select on public.page_visits to authenticated;

create index if not exists page_visits_created_at_idx on public.page_visits (created_at desc);
create index if not exists page_visits_visitor_idx on public.page_visits (visitor_id, created_at desc);
create index if not exists page_visits_user_idx on public.page_visits (user_id) where user_id is not null;
create index if not exists page_visits_path_idx on public.page_visits (path);

-- =============================================================================
-- Aggregates — SECURITY DEFINER so the KPI cards run as one fast round trip
-- instead of the admin console pulling every row to count them client-side.
-- =============================================================================

drop function if exists public.admin_visit_stats();

create or replace function public.admin_visit_stats()
returns table (
  total_visits     bigint,
  unique_visitors  bigint,
  visits_today     bigint,
  logged_in_visits bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select
      count(*) as total_visits,
      count(distinct coalesce(user_id::text, visitor_id)) as unique_visitors,
      count(*) filter (where created_at >= date_trunc('day', now())) as visits_today,
      count(*) filter (where user_id is not null) as logged_in_visits
    from public.page_visits;
end;
$$;

grant execute on function public.admin_visit_stats() to authenticated;

drop function if exists public.admin_top_pages(int);

create or replace function public.admin_top_pages(p_limit int default 5)
returns table (path text, visits bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select p.path, count(*) as visits
    from public.page_visits p
    group by p.path
    order by visits desc
    limit greatest(1, least(p_limit, 20));
end;
$$;

grant execute on function public.admin_top_pages(int) to authenticated;

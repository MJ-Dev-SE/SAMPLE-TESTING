-- =============================================================================
-- ADMIN DBMS ACCESS — run once in Supabase Dashboard → SQL Editor → Run.
--
-- Creates the `admins` table + policies so members listed in it get FULL CRUD
-- on every content table through the /admin page. Everyone else keeps exactly
-- the access they have today (public read, own-row write).
-- =============================================================================

-- 1) Who is an admin.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- A member may check ONLY their own admin status (the app's useIsAdmin hook).
drop policy if exists "users can see their own admin row" on public.admins;
create policy "users can see their own admin row"
  on public.admins for select using (auth.uid() = user_id);
grant select on public.admins to authenticated;

-- 2) Helper used by every policy below. SECURITY DEFINER so it can read admins
--    regardless of the caller's own RLS visibility.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- 3) Content tables: keep public read, add admin full CRUD.
--    (The select-policies are re-asserted so enabling RLS can never break the site.)

-- photos → homepage photo banner, Recent Photos widget, /photo/view pages
alter table public.photos enable row level security;
drop policy if exists "photos readable by everyone" on public.photos;
create policy "photos readable by everyone" on public.photos for select using (true);
drop policy if exists "admins manage photos" on public.photos;
create policy "admins manage photos" on public.photos
  for all using (public.is_admin()) with check (public.is_admin());
grant select on public.photos to anon;
grant select, insert, update, delete on public.photos to authenticated;

-- ads → header top banner, homepage mid carousel, left/right wing banners
alter table public.ads enable row level security;
drop policy if exists "ads readable by everyone" on public.ads;
create policy "ads readable by everyone" on public.ads for select using (true);
drop policy if exists "admins manage ads" on public.ads;
create policy "admins manage ads" on public.ads
  for all using (public.is_admin()) with check (public.is_admin());
grant select on public.ads to anon;
grant select, insert, update, delete on public.ads to authenticated;

-- news_items → homepage News tabs
alter table public.news_items enable row level security;
drop policy if exists "news readable by everyone" on public.news_items;
create policy "news readable by everyone" on public.news_items for select using (true);
drop policy if exists "admins manage news" on public.news_items;
create policy "admins manage news" on public.news_items
  for all using (public.is_admin()) with check (public.is_admin());
grant select on public.news_items to anon;
grant select, insert, update, delete on public.news_items to authenticated;

-- travel_info → sidebar Travel Information card
alter table public.travel_info enable row level security;
drop policy if exists "travel info readable by everyone" on public.travel_info;
create policy "travel info readable by everyone" on public.travel_info for select using (true);
drop policy if exists "admins manage travel info" on public.travel_info;
create policy "admins manage travel info" on public.travel_info
  for all using (public.is_admin()) with check (public.is_admin());
grant select on public.travel_info to anon;
grant select, insert, update, delete on public.travel_info to authenticated;

-- businesses → /company directory + sidebar widgets (owners keep their own access)
alter table public.businesses enable row level security;
drop policy if exists "businesses readable by everyone" on public.businesses;
create policy "businesses readable by everyone" on public.businesses for select using (true);
drop policy if exists "admins manage businesses" on public.businesses;
create policy "admins manage businesses" on public.businesses
  for all using (public.is_admin()) with check (public.is_admin());
grant select on public.businesses to anon;
grant select, insert, update, delete on public.businesses to authenticated;

-- posts & comments → boards, post pages, category feeds, sidebar widgets.
-- Members already manage their OWN rows (schema.sql); admins may manage ANY row
-- (spam moderation, guest-post cleanup — dating kaya lang sa SQL editor).
drop policy if exists "admins manage posts" on public.posts;
create policy "admins manage posts" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage comments" on public.comments;
create policy "admins manage comments" on public.comments
  for all using (public.is_admin()) with check (public.is_admin());

-- 4) Make YOURSELF the admin (change the email if you use a different account).
insert into public.admins (user_id)
select id from auth.users where email = 'markjerohm@gmail.com'
on conflict (user_id) do nothing;

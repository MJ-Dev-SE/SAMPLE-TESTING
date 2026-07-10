-- =============================================================================
-- 88 Hotspring Resort — CONTENT + MEDIA schema (run once, after schema.sql)
--   Dashboard → SQL Editor → New query → paste → Run
--
-- This moves the last hardcoded sections (photos, businesses, ads, news tabs,
-- travel info) into the database. Editorial text that must show in both English
-- and Korean is stored as jsonb `{ "en": …, "ko": … }` so it maps 1:1 to the
-- app's `Localized` type. Free-text user posts/comments stay plain text.
--
-- Board-id note: this site shares the Supabase project with the PhilGo clone and
-- stores rows under a "resort-" board prefix (see src/lib/posts.ts). Popular Posts
-- therefore filter board_id like 'resort-%'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Posts: allow attaching photos (array of public Storage URLs; [] = text-only)
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists images jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 1) BUSINESSES — Business Directory records + "Recently updated" widget.
--    Members register and manage their OWN listing (owner_id = auth uid).
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- brand/proper noun (same in both locales)
  category    text,                          -- matches the category-bar slugs (food, hotel, …)
  location    text,                          -- e.g. "Angeles", "Manila"
  excerpt     jsonb not null default '{}'::jsonb,   -- { en, ko } short line for the cards
  description jsonb not null default '{}'::jsonb,   -- { en, ko } full text (optional)
  thumb_url   text,                          -- public URL in the `media` bucket
  owner_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists businesses_updated_idx  on public.businesses (updated_at desc);
create index if not exists businesses_category_idx  on public.businesses (category);
create index if not exists businesses_owner_idx     on public.businesses (owner_id);

-- keep updated_at fresh on every UPDATE
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists businesses_touch on public.businesses;
create trigger businesses_touch before update on public.businesses
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2) PHOTOS — banner row, Recent Photos grid, and /photo/view pages.
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- used in /photo/view?id=<slug>
  src         text not null,                 -- public URL in the `media` bucket
  section     text not null,                 -- 'banner' | 'recent'
  tag         jsonb not null default '{}'::jsonb,   -- { en, ko } small chip
  title       jsonb not null default '{}'::jsonb,   -- { en, ko }
  description jsonb not null default '{}'::jsonb,   -- { en, ko }
  details     jsonb not null default '[]'::jsonb,   -- [{ en, ko }, …] caption lines
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists photos_section_sort_idx on public.photos (section, sort);

-- ---------------------------------------------------------------------------
-- 3) ADS — mid ad cards + left/right wing banners + top strip.
-- ---------------------------------------------------------------------------
create table if not exists public.ads (
  id         uuid primary key default gen_random_uuid(),
  slot       text not null,                  -- 'mid' | 'wing-left' | 'wing-right' | 'top'
  image_url  text not null,                  -- public URL in the `media` bucket
  href       text not null default '#',
  alt        text not null default '',
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists ads_slot_sort_idx on public.ads (slot, sort) where active;

-- ---------------------------------------------------------------------------
-- 4) NEWS_ITEMS — the homepage News-tab block (featured thumbs + headline list).
-- ---------------------------------------------------------------------------
create table if not exists public.news_items (
  id            uuid primary key default gen_random_uuid(),
  tab           text not null,               -- 'news' | 'travel' | 'information' | 'mustread' | 'lifetips'
  kind          text not null,               -- 'featured' | 'headline'
  title         jsonb not null default '{}'::jsonb,   -- { en, ko }
  thumb_url     text,                        -- featured items only
  href          text not null default '#',
  comment_count integer not null default 0,
  sort          integer not null default 0
);
create index if not exists news_tab_kind_sort_idx on public.news_items (tab, kind, sort);

-- ---------------------------------------------------------------------------
-- 5) TRAVEL_INFO — NEW "Travel Information" card (right sidebar).
-- ---------------------------------------------------------------------------
create table if not exists public.travel_info (
  id    uuid primary key default gen_random_uuid(),
  title jsonb not null default '{}'::jsonb,  -- { en, ko }
  blurb jsonb not null default '{}'::jsonb,  -- { en, ko }
  icon  text not null default 'fa-circle-info',
  href  text not null default '#',
  sort  integer not null default 0
);
create index if not exists travel_sort_idx on public.travel_info (sort);

-- ---------------------------------------------------------------------------
-- 6) POPULAR POSTS — derived from real traffic, no table needed.
--    A view so the client can `select * from popular_posts`.
-- ---------------------------------------------------------------------------
create or replace view public.popular_posts as
  select p.*,
         (select count(*) from public.comments c where c.post_id = p.id) as comment_total
  from public.posts p
  where p.board_id like 'resort-%'
    and p.board_id <> 'resort-photos'         -- exclude hidden photo-comment anchors
    and p.created_at > now() - interval '30 days'
  order by p.views desc, p.created_at desc
  limit 20;

-- =============================================================================
-- ROW-LEVEL SECURITY
--   Read: everyone. Writes: members own their businesses; the seed/admin tables
--   (photos, ads, news_items, travel_info) are writable only by authenticated
--   users (in practice you seed them via the service-role upload script).
-- =============================================================================
alter table public.businesses  enable row level security;
alter table public.photos      enable row level security;
alter table public.ads         enable row level security;
alter table public.news_items  enable row level security;
alter table public.travel_info enable row level security;

-- Public read on everything
drop policy if exists "businesses readable"  on public.businesses;
create policy "businesses readable"  on public.businesses  for select using (true);
drop policy if exists "photos readable"      on public.photos;
create policy "photos readable"      on public.photos      for select using (true);
drop policy if exists "ads readable"         on public.ads;
create policy "ads readable"         on public.ads         for select using (true);
drop policy if exists "news readable"        on public.news_items;
create policy "news readable"        on public.news_items  for select using (true);
drop policy if exists "travel readable"      on public.travel_info;
create policy "travel readable"      on public.travel_info for select using (true);

-- Businesses: a member may create a listing they own, and edit/delete only their own.
drop policy if exists "members create own business" on public.businesses;
create policy "members create own business" on public.businesses for insert
  with check (owner_id = auth.uid());
drop policy if exists "members update own business" on public.businesses;
create policy "members update own business" on public.businesses for update
  using (owner_id = auth.uid());
drop policy if exists "members delete own business" on public.businesses;
create policy "members delete own business" on public.businesses for delete
  using (owner_id = auth.uid());

-- Seed/admin tables: only authenticated users may write (service role bypasses RLS).
drop policy if exists "auth writes photos" on public.photos;
create policy "auth writes photos" on public.photos for all
  to authenticated using (true) with check (true);
drop policy if exists "auth writes ads" on public.ads;
create policy "auth writes ads" on public.ads for all
  to authenticated using (true) with check (true);
drop policy if exists "auth writes news" on public.news_items;
create policy "auth writes news" on public.news_items for all
  to authenticated using (true) with check (true);
drop policy if exists "auth writes travel" on public.travel_info;
create policy "auth writes travel" on public.travel_info for all
  to authenticated using (true) with check (true);

-- Explicit grants (anon = guests, authenticated = members).
grant select on public.businesses, public.photos, public.ads, public.news_items,
  public.travel_info, public.popular_posts to anon, authenticated;
grant insert, update, delete on public.businesses to authenticated;
grant insert, update, delete on public.photos, public.ads, public.news_items,
  public.travel_info to authenticated;

-- =============================================================================
-- STORAGE — one public `media` bucket with folders photos/ ads/ avatars/ posts/ businesses/
--   (Creating the bucket via SQL; you can also click "New bucket" → media → Public.)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Public read of any object in the bucket.
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');

-- Logged-in users may upload / change objects in the media bucket
-- (avatars, post photos, business thumbnails). Seed uploads use the service key.
drop policy if exists "media auth write" on storage.objects;
create policy "media auth write" on storage.objects for insert
  to authenticated with check (bucket_id = 'media');
drop policy if exists "media auth update" on storage.objects;
create policy "media auth update" on storage.objects for update
  to authenticated using (bucket_id = 'media');

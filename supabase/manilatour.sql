-- =============================================================================
-- Manila Tour — ALIGNMENT MIGRATION (run once, AFTER schema.sql + content.sql
-- and, if it was ever run, site_content.sql).  Dashboard → SQL Editor → Run.
--
-- This migration finishes the move off the 88 Hot Spring / PhilGo shape:
--   * business directory becomes a real parent/child CATEGORY model with a
--     dedicated gallery table (business_images);
--   * advertisements / links / policies become their own tables (replacing the
--     interim site_content table), each driving a content-type-specific page;
--   * news_items gains an article body so a news/information item opens an
--     article page instead of a resort photo;
--   * the community board prefix moves resort- → mt-.
--
-- It is additive-then-migrate: new tables are created, existing rows are copied
-- / back-filled, and site_content is dropped LAST. No member data (profiles,
-- member posts/comments, member-registered businesses) is destroyed.
--
-- Editorial text shown in both languages is jsonb { "en": …, "ko": … } to match
-- the app's Localized type. Seed the visible content afterwards with:
--   $env:SUPABASE_URL=…; $env:SUPABASE_SERVICE_ROLE_KEY=…; node scripts/seed.mjs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) CATEGORIES — parent "Business Directory" + its child categories.
--    Shared source for the directory filter, posting form, admin form and cards.
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,           -- e.g. 'food', 'hotel' (used in /company?category=slug)
  parent_slug text,                           -- 'business-directory' for the directory children; null for a root
  name        jsonb not null default '{}'::jsonb,  -- { en, ko }
  icon        text not null default 'fa-tag', -- Font Awesome class for cards / chips
  sort        integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists categories_parent_sort_idx on public.categories (parent_slug, sort) where active;

-- ---------------------------------------------------------------------------
-- 2) BUSINESSES — extend the existing table into a full business profile.
--    Old columns (category text, excerpt, description, location, thumb_url) stay
--    for back-compat and are back-filled into the new ones below.
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists category_id    uuid references public.categories (id) on delete set null,
  add column if not exists short_intro    jsonb not null default '{}'::jsonb,   -- { en, ko } one-liner
  add column if not exists detailed_intro jsonb not null default '{}'::jsonb,   -- { en, ko } full text
  add column if not exists region         text,
  add column if not exists address        text,
  add column if not exists phone          text,
  add column if not exists logo_url       text,
  add column if not exists main_image_url text,
  add column if not exists status         text not null default 'active',       -- 'active' | 'inactive'
  add column if not exists display_order  integer not null default 0;

-- Back-fill the new columns from whatever the old ones hold (idempotent-ish:
-- only fills when the new column is still empty/default).
update public.businesses b
   set category_id    = c.id
  from public.categories c
 where b.category_id is null and b.category = c.slug;
update public.businesses
   set short_intro    = coalesce(nullif(short_intro, '{}'::jsonb), excerpt),
       detailed_intro = coalesce(nullif(detailed_intro, '{}'::jsonb), description),
       region         = coalesce(region, location),
       main_image_url = coalesce(main_image_url, thumb_url);

create index if not exists businesses_category_id_idx on public.businesses (category_id);
create index if not exists businesses_status_order_idx on public.businesses (status, display_order);
create index if not exists businesses_created_idx      on public.businesses (created_at desc);

-- Keep the denormalized `category` slug in sync with category_id so the
-- /company?category=<slug> filter works no matter who writes the row (admin
-- console sets category_id; the public form sets both).
create or replace function public.sync_business_category_slug()
returns trigger language plpgsql as $$
begin
  if new.category_id is not null then
    select slug into new.category from public.categories where id = new.category_id;
  end if;
  return new;
end;
$$;
drop trigger if exists businesses_category_slug on public.businesses;
create trigger businesses_category_slug before insert or update on public.businesses
  for each row execute procedure public.sync_business_category_slug();

-- ---------------------------------------------------------------------------
-- 3) BUSINESS_IMAGES — logo / main / gallery photos for a listing.
-- ---------------------------------------------------------------------------
create table if not exists public.business_images (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  image_url     text not null,                -- media-bucket path or full URL
  image_type    text not null default 'gallery', -- 'logo' | 'main' | 'gallery'
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists business_images_biz_idx on public.business_images (business_id, image_type, display_order);

-- ---------------------------------------------------------------------------
-- 4) ADVERTISEMENTS — header banner + homepage cards + wing rails + footer-info
--    program pages. Replaces the old `ads` table (migrated below).
-- ---------------------------------------------------------------------------
create table if not exists public.advertisements (
  id          uuid primary key default gen_random_uuid(),
  title       jsonb not null default '{}'::jsonb,  -- { en, ko }
  description jsonb not null default '{}'::jsonb,  -- { en, ko } short blurb
  body        jsonb not null default '{}'::jsonb,  -- { en, ko } full detail page text
  image_url   text,                                -- media-bucket path or full URL
  url         text,                                -- click / destination target
  position    text not null default 'homepage',   -- header | homepage | wing-left | wing-right | footer-info
  sort        integer not null default 0,
  active      boolean not null default true,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists advertisements_pos_sort_idx on public.advertisements (position, sort) where active;
drop trigger if exists advertisements_touch on public.advertisements;
create trigger advertisements_touch before update on public.advertisements
  for each row execute procedure public.touch_updated_at();

-- Migrate the existing `ads` rows (slot → position) if that table exists.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'ads') then
    insert into public.advertisements (title, description, image_url, url, position, sort, active)
    select jsonb_build_object('en', coalesce(alt, ''), 'ko', coalesce(alt, '')),
           '{}'::jsonb,
           image_url,
           nullif(href, '#'),
           case slot when 'top' then 'header' when 'mid' then 'homepage' else slot end,
           coalesce(sort, 0),
           coalesce(active, true)
      from public.ads
     on conflict do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5) LINKS — partner websites / tourism resources / recommended references.
-- ---------------------------------------------------------------------------
create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  title       jsonb not null default '{}'::jsonb,  -- { en, ko }
  description jsonb not null default '{}'::jsonb,  -- { en, ko }
  body        jsonb not null default '{}'::jsonb,  -- { en, ko } full page text
  url         text,
  image_url   text,
  category    text,
  section     text not null default 'footer-link',
  sort        integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists links_section_sort_idx on public.links (section, sort) where active;

-- ---------------------------------------------------------------------------
-- 6) POLICIES — Terms of Use, Privacy Policy, Child Safety Standards, …
-- ---------------------------------------------------------------------------
create table if not exists public.policies (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      jsonb not null default '{}'::jsonb,   -- { en, ko }
  summary    jsonb not null default '{}'::jsonb,   -- { en, ko }
  body       jsonb not null default '{}'::jsonb,   -- { en, ko } "## " headings, "- " bullets
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists policies_sort_idx on public.policies (sort) where active;

-- Advertisements / links / policies were previously interim rows in site_content.
-- Copy anything present there into the new tables before dropping it.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'site_content') then
    insert into public.advertisements (title, description, body, image_url, url, position, sort, active)
    select title, coalesce(summary, '{}'::jsonb), coalesce(body, '{}'::jsonb), image_url, url, 'footer-info', sort, active
      from public.site_content where content_type = 'advertisement'
     on conflict do nothing;

    insert into public.links (slug, title, description, body, url, image_url, section, sort, active)
    select slug, title, coalesce(summary, '{}'::jsonb), coalesce(body, '{}'::jsonb),
           url, image_url, 'footer-link', sort, active
      from public.site_content where content_type = 'link'
     on conflict (slug) do nothing;

    insert into public.policies (slug, title, summary, body, sort, active)
    select slug, title, coalesce(summary, '{}'::jsonb), coalesce(body, '{}'::jsonb), sort, active
      from public.site_content where content_type = 'policy'
     on conflict (slug) do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7) NEWS_ITEMS — add an article body + image so News/Information items open a
--    proper article page instead of a resort photo.
-- ---------------------------------------------------------------------------
alter table public.news_items
  add column if not exists body         jsonb not null default '{}'::jsonb,  -- { en, ko }
  add column if not exists image_url    text,
  add column if not exists article_slug text;

-- ---------------------------------------------------------------------------
-- 8) COMMUNITY BOARD PREFIX — resort- → mt-  (posts + comments + popular view).
-- ---------------------------------------------------------------------------
update public.posts    set board_id = 'mt-' || substring(board_id from 8) where board_id like 'resort-%';
update public.comments set board_id = 'mt-' || substring(board_id from 8) where board_id like 'resort-%';

create or replace view public.popular_posts as
  select p.*,
         (select count(*) from public.comments c where c.post_id = p.id) as comment_total
  from public.posts p
  where p.board_id like 'mt-%'
    and p.board_id <> 'mt-photos'
    and p.created_at > now() - interval '30 days'
  order by p.views desc, p.created_at desc
  limit 20;

-- =============================================================================
-- ROW-LEVEL SECURITY — public read (active), authenticated write (admin console).
-- Businesses keep their existing owner-scoped member policies from content.sql;
-- we only ADD an authenticated-write policy so the admin can moderate any row.
-- =============================================================================
alter table public.categories      enable row level security;
alter table public.business_images enable row level security;
alter table public.advertisements  enable row level security;
alter table public.links           enable row level security;
alter table public.policies        enable row level security;

drop policy if exists "categories readable" on public.categories;
create policy "categories readable" on public.categories for select using (true);
drop policy if exists "auth writes categories" on public.categories;
create policy "auth writes categories" on public.categories for all
  to authenticated using (true) with check (true);

drop policy if exists "business_images readable" on public.business_images;
create policy "business_images readable" on public.business_images for select using (true);
drop policy if exists "auth writes business_images" on public.business_images;
create policy "auth writes business_images" on public.business_images for all
  to authenticated using (true) with check (true);

drop policy if exists "advertisements readable" on public.advertisements;
create policy "advertisements readable" on public.advertisements for select using (true);
drop policy if exists "auth writes advertisements" on public.advertisements;
create policy "auth writes advertisements" on public.advertisements for all
  to authenticated using (true) with check (true);

drop policy if exists "links readable" on public.links;
create policy "links readable" on public.links for select using (true);
drop policy if exists "auth writes links" on public.links;
create policy "auth writes links" on public.links for all
  to authenticated using (true) with check (true);

drop policy if exists "policies readable" on public.policies;
create policy "policies readable" on public.policies for select using (true);
drop policy if exists "auth writes policies" on public.policies;
create policy "auth writes policies" on public.policies for all
  to authenticated using (true) with check (true);

-- Let the admin console (authenticated) moderate ANY business row, on top of the
-- existing member owner-scoped insert/update/delete policies.
drop policy if exists "auth moderates businesses" on public.businesses;
create policy "auth moderates businesses" on public.businesses for all
  to authenticated using (true) with check (true);

grant select on public.categories, public.business_images, public.advertisements,
  public.links, public.policies to anon, authenticated;
grant insert, update, delete on public.categories, public.business_images,
  public.advertisements, public.links, public.policies to authenticated;

-- =============================================================================
-- 9) RETIRE site_content (its rows were copied into links/policies/advertisements).
--    Drop LAST so a re-run that failed midway can still read it. Comment this out
--    if you want to keep the old table around for a while.
-- =============================================================================
drop table if exists public.site_content;

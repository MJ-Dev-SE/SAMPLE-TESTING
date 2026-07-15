-- =============================================================================
-- Manila Tour — SEO migration (run once, AFTER manilatour.sql + community.sql).
--   Dashboard → SQL Editor → New query → paste → Run
--
-- Adds, without touching any existing behavior:
--   1) public.slugify(text) + unaccent — shared slug generator (mirrors
--      src/lib/seo/slug.ts: lowercase, Latin accents stripped, Korean kept,
--      symbols → hyphens, deduped/trimmed).
--   2) SEO columns on posts / businesses / news_items / categories:
--      slug (posts+businesses; news_items already has article_slug, categories
--      already has slug), meta_title, meta_description, og_image_url,
--      canonical_url, is_indexable (default true).
--   3) Slug triggers: auto-generate a unique slug ON INSERT when absent
--      (never regenerate on later edits — slugs stay stable after publish),
--      and log every manual slug CHANGE into public.slug_redirects so the
--      frontend can 301-style redirect old URLs (see lib/posts.ts /
--      lib/content.ts resolveSlugRedirect).
--   4) public.slug_redirects — old-slug → new-slug map, public read.
--   5) Supporting indexes: unique partial indexes on valid slugs, plus
--      sitemap/list covering indexes.
--   6) Recreates public.popular_posts (same definition as manilatour.sql §8)
--      so the view exposes the NEW posts columns (p.* is frozen at creation).
--
-- Everything is idempotent (if not exists / or replace / drop-then-create
-- for policies+triggers), matching this project's other migrations. RLS is
-- untouched except for the new slug_redirects table (public read only).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) SLUGIFY — shared generator. `unaccent` strips Latin diacritics; Korean
--    syllables (가-힣) pass through untouched, mirroring the client util.
-- ---------------------------------------------------------------------------
create extension if not exists unaccent;

create or replace function public.slugify(p_input text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select left(
    trim(both '-' from
      regexp_replace(
        lower(unaccent(coalesce(p_input, ''))),
        '[^a-z0-9가-힣]+', '-', 'g'
      )
    ),
    80
  )
$$;

-- ---------------------------------------------------------------------------
-- 2) SEO COLUMNS
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists slug             text,
  add column if not exists meta_title       text,
  add column if not exists meta_description text,
  add column if not exists og_image_url     text,
  add column if not exists canonical_url    text,
  add column if not exists is_indexable     boolean not null default true;

alter table public.businesses
  add column if not exists slug             text,
  add column if not exists meta_title       text,
  add column if not exists meta_description text,
  add column if not exists og_image_url     text,
  add column if not exists canonical_url    text,
  add column if not exists is_indexable     boolean not null default true;

-- news_items keeps using article_slug as its slug (already wired through the
-- app at /news/view?slug= and now /news/article/<slug>). updated_at is added
-- so the sitemap has a real <lastmod>.
alter table public.news_items
  add column if not exists meta_title       text,
  add column if not exists meta_description text,
  add column if not exists og_image_url     text,
  add column if not exists canonical_url    text,
  add column if not exists is_indexable     boolean not null default true,
  add column if not exists updated_at       timestamptz not null default now();
drop trigger if exists news_items_touch on public.news_items;
create trigger news_items_touch before update on public.news_items
  for each row execute procedure public.touch_updated_at();

-- Category landing pages (/information, /information/weather, /business-directory/…)
alter table public.categories
  add column if not exists meta_title       text,
  add column if not exists meta_description text,
  add column if not exists og_image_url     text,
  add column if not exists is_indexable     boolean not null default true;

-- ---------------------------------------------------------------------------
-- 3) SLUG REDIRECTS — written by the triggers below whenever a slug CHANGES,
--    so old URLs keep resolving. Public read; no client writes (triggers only).
-- ---------------------------------------------------------------------------
create table if not exists public.slug_redirects (
  id         uuid primary key default gen_random_uuid(),
  entity     text not null,            -- 'post' | 'business' | 'news'
  old_slug   text not null,
  new_slug   text not null,
  created_at timestamptz not null default now(),
  unique (entity, old_slug)
);
create index if not exists slug_redirects_lookup_idx on public.slug_redirects (entity, old_slug);

alter table public.slug_redirects enable row level security;
drop policy if exists "slug redirects readable" on public.slug_redirects;
create policy "slug redirects readable" on public.slug_redirects for select using (true);
grant select on public.slug_redirects to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) SLUG TRIGGERS
--    INSERT: slug missing → slugify(title/name), fall back to the row id's
--            first 8 chars, then suffix -2, -3… until unique.
--    UPDATE: slug changed manually → keep it (stable slugs are the caller's
--            choice), normalize it, and log old → new in slug_redirects.
-- ---------------------------------------------------------------------------
create or replace function public.unique_slug(p_table text, p_col text, p_base text, p_self uuid)
returns text
language plpgsql
as $$
declare
  v_slug  text := p_base;
  v_n     integer := 1;
  v_taken boolean;
begin
  loop
    execute format(
      'select exists (select 1 from public.%I where %I = $1 and id <> $2)',
      p_table, p_col
    ) into v_taken using v_slug, p_self;
    exit when not v_taken;
    v_n := v_n + 1;
    v_slug := left(p_base, 80 - (length(v_n::text) + 1)) || '-' || v_n::text;
  end loop;
  return v_slug;
end;
$$;

-- SECURITY DEFINER: the redirect-log INSERT below must work for whoever is
-- legitimately updating the row (admin console / owner) even though
-- slug_redirects itself accepts no client writes.
create or replace function public.ensure_post_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
begin
  if tg_op = 'INSERT' then
    if new.slug is null or new.slug = '' then
      v_base := public.slugify(new.title);
      if v_base = '' then v_base := 'post-' || left(new.id::text, 8); end if;
      new.slug := public.unique_slug('posts', 'slug', v_base, new.id);
    else
      new.slug := public.unique_slug('posts', 'slug', public.slugify(new.slug), new.id);
    end if;
  elsif tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    if new.slug is null or new.slug = '' then
      new.slug := old.slug;  -- a slug can be changed but never removed
    else
      new.slug := public.unique_slug('posts', 'slug', public.slugify(new.slug), new.id);
      if old.slug is not null and old.slug <> new.slug then
        insert into public.slug_redirects (entity, old_slug, new_slug)
        values ('post', old.slug, new.slug)
        on conflict (entity, old_slug) do update set new_slug = excluded.new_slug, created_at = now();
        -- Old slugs that later become someone's NEW slug shouldn't redirect away.
        delete from public.slug_redirects where entity = 'post' and old_slug = new.slug;
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists posts_ensure_slug on public.posts;
create trigger posts_ensure_slug before insert or update on public.posts
  for each row execute procedure public.ensure_post_slug();

create or replace function public.ensure_business_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
begin
  if tg_op = 'INSERT' then
    if new.slug is null or new.slug = '' then
      v_base := public.slugify(new.name);
      if v_base = '' then v_base := 'business-' || left(new.id::text, 8); end if;
      new.slug := public.unique_slug('businesses', 'slug', v_base, new.id);
    else
      new.slug := public.unique_slug('businesses', 'slug', public.slugify(new.slug), new.id);
    end if;
  elsif tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    if new.slug is null or new.slug = '' then
      new.slug := old.slug;
    else
      new.slug := public.unique_slug('businesses', 'slug', public.slugify(new.slug), new.id);
      if old.slug is not null and old.slug <> new.slug then
        insert into public.slug_redirects (entity, old_slug, new_slug)
        values ('business', old.slug, new.slug)
        on conflict (entity, old_slug) do update set new_slug = excluded.new_slug, created_at = now();
        delete from public.slug_redirects where entity = 'business' and old_slug = new.slug;
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists businesses_ensure_slug on public.businesses;
create trigger businesses_ensure_slug before insert or update on public.businesses
  for each row execute procedure public.ensure_business_slug();

-- Back-fill slugs for existing rows (only rows that don't have one yet;
-- the UPDATE fires the trigger's INSERT branch? No — UPDATE branch keeps old
-- slug when set; we set it explicitly here through the same helpers).
update public.posts p
   set slug = public.unique_slug(
     'posts', 'slug',
     case when public.slugify(p.title) = '' then 'post-' || left(p.id::text, 8)
          else public.slugify(p.title) end,
     p.id)
 where p.slug is null
   and p.board_id like 'mt-%'
   and p.board_id <> 'mt-photos';   -- photo comment anchors never get public URLs

update public.businesses b
   set slug = public.unique_slug(
     'businesses', 'slug',
     case when public.slugify(b.name) = '' then 'business-' || left(b.id::text, 8)
          else public.slugify(b.name) end,
     b.id)
 where b.slug is null;

-- Normalize any pre-existing article_slug values on news_items.
update public.news_items
   set article_slug = public.slugify(article_slug)
 where article_slug is not null and article_slug <> public.slugify(article_slug);

-- ---------------------------------------------------------------------------
-- 5) INDEXES — unique partial indexes on VALID slugs + sitemap covers.
-- ---------------------------------------------------------------------------
create unique index if not exists posts_slug_unique_idx
  on public.posts (slug) where slug is not null and slug <> '';
create unique index if not exists businesses_slug_unique_idx
  on public.businesses (slug) where slug is not null and slug <> '';
create unique index if not exists news_items_article_slug_unique_idx
  on public.news_items (article_slug) where article_slug is not null and article_slug <> '';

-- Sitemap / feed covers (posts_category_id_idx, posts_board_created_idx,
-- businesses_status_order_idx, businesses_updated_idx already exist).
create index if not exists posts_indexable_created_idx
  on public.posts (created_at desc) where is_indexable;
create index if not exists businesses_indexable_updated_idx
  on public.businesses (updated_at desc) where is_indexable and status = 'active';
create index if not exists news_items_updated_idx
  on public.news_items (updated_at desc);

-- ---------------------------------------------------------------------------
-- 6) POPULAR_POSTS — recreate (unchanged definition, from manilatour.sql §8)
--    so `select p.*` now includes slug + SEO columns.
-- ---------------------------------------------------------------------------
drop view if exists public.popular_posts;
create view public.popular_posts as
  select p.*,
         (select count(*) from public.comments c where c.post_id = p.id) as comment_total
  from public.posts p
  where p.board_id like 'mt-%'
    and p.board_id <> 'mt-photos'
    and p.created_at > now() - interval '30 days'
  order by p.views desc, p.created_at desc
  limit 20;
grant select on public.popular_posts to anon, authenticated;

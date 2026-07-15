-- =============================================================================
-- Manila Tour — POLYMORPHIC COMMENTS / REVIEWS migration
--   Run once, AFTER schema.sql + content.sql (+ community.sql / manilatour.sql).
--   Dashboard → SQL Editor → New query → paste → Run.
--
-- Extends the EXISTING public.comments table so any center-displayed record type
-- (post, business, advertisement, news) can carry comments — and star reviews
-- where appropriate — instead of only posts. NOTHING is dropped and NO row is
-- deleted; the change is purely additive + a backfill.
--
-- IMPORTANT — the comments table is SHARED with the PhilGo clone (rows separated
-- by the "mt-" board prefix). PhilGo inserts only set post_id, so a BEFORE INSERT
-- trigger tags those rows content_type='post' automatically. PhilGo keeps working
-- with zero changes.
--
-- Reuses this project's conventions: touch_updated_at() (content.sql), is_admin()
-- (admin.sql), delete_guest_comment() (content.sql) — none redefined here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) New columns (all nullable / defaulted so existing + PhilGo rows are valid).
-- ---------------------------------------------------------------------------
alter table public.comments
  add column if not exists content_type text,
  add column if not exists content_id   text,
  add column if not exists rating       smallint,
  add column if not exists status       text not null default 'active',   -- 'active' | 'hidden'
  add column if not exists updated_at    timestamptz not null default now();

-- Ratings are 1..5 or absent (comment-only). Enforced at the DB, not just the UI.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'comments_rating_range') then
    alter table public.comments
      add constraint comments_rating_range check (rating is null or (rating between 1 and 5));
  end if;
end $$;

-- Non-post comments (business/advertisement/news) have no parent post.
alter table public.comments alter column post_id drop not null;

-- ---------------------------------------------------------------------------
-- 2) Backfill existing rows → they are all post comments.
-- ---------------------------------------------------------------------------
update public.comments
   set content_type = 'post',
       content_id   = post_id::text
 where content_type is null
   and post_id is not null;

update public.comments set status = 'active' where status is null;

-- ---------------------------------------------------------------------------
-- 3) Auto-tag + touch triggers.
--    * PhilGo (and legacy) inserts set only post_id → fill content_type/id here,
--      so every row is polymorphic-addressable without changing that app.
--    * keep updated_at fresh on edits (reuse public.touch_updated_at()).
-- ---------------------------------------------------------------------------
create or replace function public.comments_fill_polymorphic()
returns trigger language plpgsql as $$
begin
  if new.content_type is null and new.post_id is not null then
    new.content_type := 'post';
    new.content_id   := new.post_id::text;
  end if;
  if new.status is null then
    new.status := 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_fill_polymorphic on public.comments;
create trigger comments_fill_polymorphic
  before insert on public.comments
  for each row execute procedure public.comments_fill_polymorphic();

drop trigger if exists comments_touch on public.comments;
create trigger comments_touch
  before update on public.comments
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Indexes for efficient retrieval.
-- ---------------------------------------------------------------------------
create index if not exists comments_content_idx  on public.comments (content_type, content_id, created_at desc);
create index if not exists comments_author_ts_idx on public.comments (author_id, created_at desc);
create index if not exists comments_status_ts_idx on public.comments (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 5) RLS — hidden/soft-deleted comments must not appear publicly.
--    Re-assert insert/update/delete so nothing regresses; only the READ policy
--    gains a status gate (all current rows are 'active', so no visible change).
-- ---------------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists "comments readable by everyone" on public.comments;
create policy "comments readable by everyone" on public.comments for select
  using (status = 'active' or author_id = auth.uid() or public.is_admin());

drop policy if exists "anyone can create a comment" on public.comments;
create policy "anyone can create a comment" on public.comments for insert
  with check (author_id is null or author_id = auth.uid());

drop policy if exists "members update own comments" on public.comments;
create policy "members update own comments" on public.comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "members delete own comments" on public.comments;
create policy "members delete own comments" on public.comments for delete
  using (author_id = auth.uid());

-- Admin moderation (mirrors admin.sql) — may hide/edit/delete ANY comment.
drop policy if exists "admins manage comments" on public.comments;
create policy "admins manage comments" on public.comments for all
  using (public.is_admin()) with check (public.is_admin());

grant select, insert on public.comments to anon, authenticated;
grant update, delete on public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Recent-comments view — unified, title-resolved, route-ready.
--    Only this site's comments: post-type scoped to the "mt-" boards, plus every
--    business/advertisement/news comment (those tables are Manila-Tour-only).
--    Resolves a display title + a routing target per content_type. Photo pages
--    are post anchors on board 'mt-photos' whose category holds the photo slug.
-- ---------------------------------------------------------------------------
create or replace view public.recent_comments_mt as
  select
    c.id,
    c.content_type,
    c.content_id,
    c.body,
    c.rating,
    c.created_at,
    c.author_id,
    c.guest_name,
    p_prof.username,
    p_prof.display_name,
    p_prof.avatar_url,
    -- Resolved record title (falls back to a generic label if the row vanished).
    coalesce(
      case c.content_type
        when 'post'          then po.title
        when 'business'      then b.name
        when 'advertisement' then a.title ->> 'en'
        when 'news'          then n.title ->> 'en'
      end,
      initcap(c.content_type)
    ) as resolved_title,
    -- Pretty-route slug where the type has one (business.slug / news.article_slug).
    case c.content_type
      when 'business' then b.slug
      when 'news'     then n.article_slug
      else null
    end as target_slug,
    -- Photo comments are post anchors on the 'mt-photos' board; category = photo slug.
    (c.content_type = 'post' and po.board_id = 'mt-photos') as is_photo,
    case when c.content_type = 'post' and po.board_id = 'mt-photos' then po.category else null end as photo_slug
  from public.comments c
  left join public.profiles       p_prof on p_prof.id = c.author_id
  left join public.posts          po on c.content_type = 'post'          and po.id::text = c.content_id
  left join public.businesses     b  on c.content_type = 'business'      and b.id::text  = c.content_id
  left join public.advertisements a  on c.content_type = 'advertisement' and a.id::text  = c.content_id
  left join public.news_items     n  on c.content_type = 'news'          and n.id::text  = c.content_id
  where c.status = 'active'
    and c.body <> ''
    and (
      (c.content_type = 'post' and po.board_id like 'mt-%')
      or c.content_type in ('business', 'advertisement', 'news')
    )
  order by c.created_at desc;

grant select on public.recent_comments_mt to anon, authenticated;

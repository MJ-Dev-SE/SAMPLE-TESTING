-- =============================================================================
-- Manila Tour — COMMUNITY FEATURES migration (run once, AFTER manilatour.sql).
--   Dashboard → SQL Editor → New query → paste → Run
--
-- Adds:
--   1) A `kind` discriminator on public.categories so the existing Business
--      Directory tree ('business') and a NEW community/maroon-bar tree
--      ('community') can share the same table without colliding, then seeds
--      the 8 maroon parents + 16 children (Information, News, Q&A, Community,
--      Members' Marketplace, Travel, Jobs, Immigration). "Business Directory"
--      and "Real estate" maroon groups are intentionally NOT touched here —
--      they keep linking straight into the Business Directory.
--   2) posts.category_id — a nullable tag, independent of board_id, that the
--      maroon parent/child feeds are computed from. Nothing about board_id or
--      the free-text `category` column (still used by the photo-anchor system)
--      changes.
--   3) post_views + record_post_view() — a dedup'd, RPC-gated view counter that
--      keeps maintaining posts.views (so popular_posts needs no changes).
--   4) conversations / conversation_members / messages — 1:1 chat, with a
--      security-definer RPC that finds-or-creates a direct conversation
--      server-side (prevents duplicate DMs even if two tabs race), Realtime
--      enabled on messages.
--
-- Mirrors this project's existing conventions throughout: touch_updated_at()
-- (content.sql) and is_admin() (admin.sql) are reused, not redefined; RLS
-- follows the same "public read / owner or admin write" shape as posts/comments
-- in schema.sql and admin.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) CATEGORY KIND + community (maroon-bar) tree
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists kind text not null default 'business'; -- 'business' | 'community'
create index if not exists categories_kind_parent_sort_idx
  on public.categories (kind, parent_slug, sort) where active;

-- Parents (parent_slug null). Sort mirrors their order in the maroon bar
-- (src/data/categoryBar.ts), skipping the untouched Business Directory / Real
-- estate groups.
insert into public.categories (slug, parent_slug, kind, name, icon, sort, active) values
  ('information', null, 'community', '{"en":"Information","ko":"정보"}', 'fa-circle-info', 0, true),
  ('news',        null, 'community', '{"en":"News","ko":"뉴스"}', 'fa-newspaper', 1, true),
  ('qna',         null, 'community', '{"en":"Q&A","ko":"질문답변"}', 'fa-circle-question', 2, true),
  ('community',   null, 'community', '{"en":"Community","ko":"커뮤니티"}', 'fa-users', 3, true),
  ('marketplace', null, 'community', '{"en":"Members'' Marketplace","ko":"회원장터"}', 'fa-store', 4, true),
  ('travel',      null, 'community', '{"en":"Travel","ko":"여행"}', 'fa-plane', 5, true),
  ('jobs',        null, 'community', '{"en":"Jobs","ko":"구인구직"}', 'fa-briefcase', 6, true),
  ('immigration', null, 'community', '{"en":"Immigration","ko":"이민"}', 'fa-passport', 7, true)
on conflict (slug) do update set kind = excluded.kind, parent_slug = excluded.parent_slug;

-- Children (2 per parent), labels matching the maroon bar exactly.
insert into public.categories (slug, parent_slug, kind, name, icon, sort, active) values
  ('weather',                  'information', 'community', '{"en":"Weather","ko":"날씨"}', 'fa-cloud-sun', 0, true),
  ('experiences',              'information', 'community', '{"en":"Experiences","ko":"경험담"}', 'fa-comment-dots', 1, true),
  ('notices',                  'news',        'community', '{"en":"Notices","ko":"공지사항"}', 'fa-bullhorn', 0, true),
  ('life-tips',                'news',        'community', '{"en":"Life Tips","ko":"생활의 팁"}', 'fa-lightbulb', 1, true),
  ('free-discussion',          'qna',         'community', '{"en":"Free discussion","ko":"자유게시판"}', 'fa-comments', 0, true),
  ('chit-chat',                'qna',         'community', '{"en":"Chit-chat","ko":"잡담"}', 'fa-face-smile', 1, true),
  ('manila',                   'community',   'community', '{"en":"Manila","ko":"마닐라"}', 'fa-location-dot', 0, true),
  ('angeles',                  'community',   'community', '{"en":"Angeles","ko":"앙헬레스"}', 'fa-location-dot', 1, true),
  ('cell-phone',                'marketplace', 'community', '{"en":"Cell phone","ko":"핸드폰"}', 'fa-mobile-screen', 0, true),
  ('peso-exchange',            'marketplace', 'community', '{"en":"Peso exchange","ko":"페소환전"}', 'fa-money-bill-transfer', 1, true),
  ('tours-itineraries',        'travel',      'community', '{"en":"Tours & itineraries","ko":"투어·일정"}', 'fa-map', 0, true),
  ('food-trips',               'travel',      'community', '{"en":"Food trips","ko":"먹방"}', 'fa-utensils', 1, true),
  ('new-member-greetings',     'jobs',        'community', '{"en":"New member greetings","ko":"신입인사"}', 'fa-handshake', 0, true),
  ('people-search',            'jobs',        'community', '{"en":"People search","ko":"사람찾기"}', 'fa-magnifying-glass', 1, true),
  ('passport-visa',            'immigration', 'community', '{"en":"Passport / Visa","ko":"여권/비자"}', 'fa-passport', 0, true),
  ('boarding-house',           'immigration', 'community', '{"en":"Boarding house","ko":"하숙집"}', 'fa-house', 1, true)
on conflict (slug) do update set kind = excluded.kind, parent_slug = excluded.parent_slug;

-- ---------------------------------------------------------------------------
-- 2) POSTS — new, independent category tag (board_id/category untouched).
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists category_id uuid references public.categories (id) on delete set null;
create index if not exists posts_category_id_idx on public.posts (category_id);

-- ---------------------------------------------------------------------------
-- 3) POST VIEWS — deduplicated per user/anonymous-session within 24h.
-- ---------------------------------------------------------------------------
create table if not exists public.post_views (
  id                    uuid primary key default gen_random_uuid(),
  post_id               uuid not null references public.posts (id) on delete cascade,
  user_id               uuid references public.profiles (id) on delete cascade,
  anonymous_session_id  text,
  viewed_at             timestamptz not null default now()
);
create index if not exists post_views_post_user_idx on public.post_views (post_id, user_id, viewed_at desc);
create index if not exists post_views_post_anon_idx on public.post_views (post_id, anonymous_session_id, viewed_at desc);

alter table public.post_views enable row level security;
-- No direct client select/insert — only through the RPC below (security definer).
drop policy if exists "no direct access to post_views" on public.post_views;
create policy "no direct access to post_views" on public.post_views for all using (false) with check (false);

-- Records a view (once per viewer per post per 24h) and returns the live count.
create or replace function public.record_post_view(p_post_id uuid, p_anon_id text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_exists boolean;
  v_views  integer;
begin
  if v_uid is not null then
    select exists (
      select 1 from public.post_views
      where post_id = p_post_id and user_id = v_uid and viewed_at > now() - interval '24 hours'
    ) into v_exists;
  else
    select exists (
      select 1 from public.post_views
      where post_id = p_post_id and anonymous_session_id = p_anon_id and viewed_at > now() - interval '24 hours'
    ) into v_exists;
  end if;

  if not v_exists then
    insert into public.post_views (post_id, user_id, anonymous_session_id)
    values (p_post_id, v_uid, case when v_uid is null then p_anon_id else null end);
    update public.posts set views = views + 1 where id = p_post_id returning views into v_views;
  else
    select views into v_views from public.posts where id = p_post_id;
  end if;

  return coalesce(v_views, 0);
end;
$$;

grant execute on function public.record_post_view(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) CHAT — 1:1 conversations, members, messages.
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  conversation_type text not null default 'direct',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists conversations_touch on public.conversations;
create trigger conversations_touch before update on public.conversations
  for each row execute procedure public.touch_updated_at();

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  joined_at       timestamptz not null default now(),
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  message_body    text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
drop trigger if exists messages_touch on public.messages;
create trigger messages_touch before update on public.messages
  for each row execute procedure public.touch_updated_at();

-- Bump the parent conversation's updated_at whenever a message lands, so the
-- conversation list can sort by "most recently active" with one indexed column.
create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute procedure public.touch_conversation_on_message();

-- SECURITY DEFINER helper — every chat RLS policy below uses this instead of a
-- self-referential subquery on conversation_members (which would recurse).
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  )
$$;

-- Finds an existing 1:1 "direct" conversation between the caller and
-- p_other_user_id, or creates one. Server-side dedup — the actual guarantee
-- against duplicate DMs, not just a frontend check.
create or replace function public.start_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me   uuid := auth.uid();
  v_conv uuid;
begin
  if v_me is null then
    raise exception 'not authenticated';
  end if;
  if v_me = p_other_user_id then
    raise exception 'cannot start a conversation with yourself';
  end if;

  select cm.conversation_id into v_conv
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id and c.conversation_type = 'direct'
  where cm.conversation_id in (
    select conversation_id from public.conversation_members where user_id = v_me
    intersect
    select conversation_id from public.conversation_members where user_id = p_other_user_id
  )
  group by cm.conversation_id
  having count(*) = 2
  limit 1;

  if v_conv is not null then
    return v_conv;
  end if;

  insert into public.conversations (conversation_type) values ('direct') returning id into v_conv;
  insert into public.conversation_members (conversation_id, user_id) values
    (v_conv, v_me),
    (v_conv, p_other_user_id);
  return v_conv;
end;
$$;

grant execute on function public.start_direct_conversation(uuid) to authenticated;

alter table public.conversations       enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages            enable row level security;

drop policy if exists "members read their conversations" on public.conversations;
create policy "members read their conversations" on public.conversations
  for select using (public.is_conversation_member(id));

drop policy if exists "members read their membership rows" on public.conversation_members;
create policy "members read their membership rows" on public.conversation_members
  for select using (public.is_conversation_member(conversation_id));
-- Only last_read_at is ever updated by the client, and only on one's own row
-- (see lib/chat.ts markConversationRead). Row creation itself only happens via
-- start_direct_conversation() (security definer), never a direct client insert.
drop policy if exists "members update their own read state" on public.conversation_members;
create policy "members update their own read state" on public.conversation_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "members read their messages" on public.messages;
create policy "members read their messages" on public.messages
  for select using (public.is_conversation_member(conversation_id));
drop policy if exists "members send messages to their conversations" on public.messages;
create policy "members send messages to their conversations" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- Admin moderation (mirrors "admins manage posts/comments" in admin.sql).
drop policy if exists "admins manage conversations" on public.conversations;
create policy "admins manage conversations" on public.conversations
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage conversation_members" on public.conversation_members;
create policy "admins manage conversation_members" on public.conversation_members
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage messages" on public.messages;
create policy "admins manage messages" on public.messages
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.conversations, public.conversation_members to authenticated;
grant select, update on public.conversation_members to authenticated;
grant select, insert on public.messages to authenticated;

-- Realtime — net new for this project; enables live INSERT delivery on messages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

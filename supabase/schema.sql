-- =============================================================================
-- PhilGo clone — auth schema for Supabase
-- Run this once in your Supabase project:  Dashboard → SQL Editor → New query → Run
--
-- Supabase already manages accounts (email + password) in the built-in auth.users
-- table, so you do NOT create that. This adds a public `profiles` table (1:1 with
-- auth.users) to hold the extra data your app shows (username, display name, avatar),
-- with Row-Level Security + a trigger that auto-creates a profile row on sign-up.
-- =============================================================================

-- 1) Profile table — one row per account, keyed by the auth user id.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- 2) Row-Level Security: nobody reads/writes rows unless a policy allows it.
alter table public.profiles enable row level security;

-- Anyone may read profiles (public usernames). Tighten later if you want.
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- A user may create their own profile row (id must equal their auth uid).
drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- A user may update only their own profile.
drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3) Trigger: when a new auth user is created, populate public.profiles.
--    Handles BOTH sign-up styles:
--      * email/password → we pass `username` in user metadata
--      * Google OAuth   → Google provides `full_name` / `name` / `avatar_url`, no username
--    Falls back to the email's local part so `username` is never null.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text := coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  dname text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', uname);
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, uname, dname, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
exception
  -- If the username is already taken, retry once with a short unique suffix so
  -- sign-up never fails on a name collision (e.g. two "John Smith" Google accounts).
  when unique_violation then
    insert into public.profiles (id, username, display_name, avatar_url)
    values (new.id, uname || '_' || substr(new.id::text, 1, 4), dname,
            new.raw_user_meta_data ->> 'avatar_url')
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================================================
-- POSTS + COMMENTS  (guest-or-member posting)
--   * member post  → author_id set (username shown), guest_name null
--   * guest  post  → author_id null, guest_name = a random name from the app
-- author_id references profiles(id) so PostgREST can embed the author in one query.
-- =============================================================================

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  board_id   text not null,            -- e.g. 'freetalk', 'qna', 'buyandsell', 'wanted'
  category   text,                     -- optional sub-category (from the category bar)
  title      text not null,
  body       text not null default '',
  author_id  uuid references public.profiles (id) on delete set null,
  guest_name text,
  views      integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_board_created_idx on public.posts (board_id, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  board_id   text not null,            -- denormalized so "commented in X" is one query
  author_id  uuid references public.profiles (id) on delete set null,
  guest_name text,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists comments_author_idx on public.comments (author_id);

alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Read: public.
drop policy if exists "posts readable by everyone" on public.posts;
create policy "posts readable by everyone" on public.posts for select using (true);
drop policy if exists "comments readable by everyone" on public.comments;
create policy "comments readable by everyone" on public.comments for select using (true);

-- Insert: a guest (auth.uid() is null) may only post as a guest (author_id null);
--         a member may only post as themselves (author_id = their uid).
drop policy if exists "anyone can create a post" on public.posts;
create policy "anyone can create a post" on public.posts for insert
  with check (author_id is null or author_id = auth.uid());
drop policy if exists "anyone can create a comment" on public.comments;
create policy "anyone can create a comment" on public.comments for insert
  with check (author_id is null or author_id = auth.uid());

-- Update / delete: only the member who owns the row (guests can't edit).
drop policy if exists "members update own posts" on public.posts;
create policy "members update own posts" on public.posts for update using (author_id = auth.uid());
drop policy if exists "members delete own posts" on public.posts;
create policy "members delete own posts" on public.posts for delete using (author_id = auth.uid());
drop policy if exists "members update own comments" on public.comments;
create policy "members update own comments" on public.comments for update using (author_id = auth.uid());
drop policy if exists "members delete own comments" on public.comments;
create policy "members delete own comments" on public.comments for delete using (author_id = auth.uid());

-- Explicit table grants (belt-and-suspenders — guests are the `anon` role, members `authenticated`).
grant select, insert on public.posts to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;
grant update, delete on public.posts to authenticated;
grant update, delete on public.comments to authenticated;

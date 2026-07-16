-- =============================================================================
-- Manila Tour — AI ASSISTANT migration
--   Run once, AFTER schema.sql (needs public.touch_updated_at()).
--   Dashboard → SQL Editor → New query → paste → Run.
--
-- Per-user, private AI chat on ANY center-displayed record — post (incl. photo
-- pages), business, advertisement, or news/information article — mirroring the
-- polymorphic (content_type, content_id) pattern already used by public.comments
-- (see comments.sql). One conversation per (user, content_type, content_id):
-- the AI button's first click analyzes that record and creates it; every
-- follow-up question appends to the SAME conversation.
--
-- content_id is `text`, not a uuid FK, because it addresses FOUR different
-- tables (posts / businesses / advertisements / news_items) plus photos
-- (public.photos, keyed by slug) — exactly the same tradeoff comments.sql made
-- for content_id, for the same reason.
--
-- Writes (the analysis + every chat turn) are made ONLY by the
-- supabase/functions/ai-assistant Edge Function, using the service-role key —
-- that's the sole place holding the Gemini API key and the sole writer, so a
-- forged "assistant" message can't be inserted by a client. The client reads
-- its own rows directly (RLS-protected) so reopening a record's chat doesn't
-- need a round trip through the function.
-- =============================================================================

create table if not exists public.ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  content_type text not null check (content_type in ('post', 'photo', 'business', 'advertisement', 'news')),
  content_id   text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, content_type, content_id) -- exactly one private conversation per user per record
);

create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  message         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists ai_conversations_user_idx    on public.ai_conversations (user_id, updated_at desc);
create index if not exists ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

drop trigger if exists ai_conversations_touch on public.ai_conversations;
create trigger ai_conversations_touch
  before update on public.ai_conversations
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — a user may only ever see their OWN conversations/messages. No admin
-- override: this is a private AI chat, not moderated content like comments.
-- ---------------------------------------------------------------------------
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

drop policy if exists "read own ai conversations" on public.ai_conversations;
create policy "read own ai conversations" on public.ai_conversations for select
  using (user_id = auth.uid());

drop policy if exists "delete own ai conversations" on public.ai_conversations;
create policy "delete own ai conversations" on public.ai_conversations for delete
  using (user_id = auth.uid());

drop policy if exists "read own ai messages" on public.ai_messages;
create policy "read own ai messages" on public.ai_messages for select
  using (exists (
    select 1 from public.ai_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  ));

-- No insert/update policies for authenticated: all writes go through the
-- Edge Function's service-role client, which bypasses RLS by design.
grant select, delete on public.ai_conversations to authenticated;
grant select on public.ai_messages to authenticated;

-- =============================================================================
-- Manila Tour — SITE_CONTENT schema (run once, after content.sql)
--   Dashboard → SQL Editor → New query → paste → Run
--
-- One table for the footer's Advertisement / Link / Policy child items
-- (Banner Ad Information, Business Directory, Terms of Use, …). Each row is a
-- full center-area page: localized title/summary/body, an optional image and a
-- related URL, assigned to a footer section with its own sort order and
-- enable/disable flag. The app renders rows via /content/view?slug=<slug>
-- (src/routes/ContentView.tsx) and the admin console manages them like any
-- other dataset.
--
-- Seed data lives in src/data/siteContent.json (single source of truth, also
-- the app's offline fallback). Populate the table with:
--   $env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
--   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ...service-role..."
--   node scripts/seed.mjs
-- =============================================================================

create table if not exists public.site_content (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,          -- /content/view?slug=<slug>
  content_type text not null,                 -- 'advertisement' | 'link' | 'policy'
  section      text not null,                 -- 'footer-advertisement' | 'footer-link' | 'footer-policy'
  title        jsonb not null default '{}'::jsonb,  -- { en, ko }
  summary      jsonb not null default '{}'::jsonb,  -- { en, ko } one-liner under the title
  body         jsonb not null default '{}'::jsonb,  -- { en, ko } long text ("## " headings, "- " bullets)
  image_url    text,                          -- media-bucket path, /public asset or full URL
  url          text,                          -- related/CTA link (internal path or external site)
  sort         integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists site_content_section_sort_idx on public.site_content (section, sort) where active;

-- keep updated_at fresh (touch_updated_at() is created by content.sql)
drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before update on public.site_content
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- ROW-LEVEL SECURITY — same pattern as the other admin-managed content tables:
-- everyone reads, authenticated users write (the admin console).
-- ---------------------------------------------------------------------------
alter table public.site_content enable row level security;

drop policy if exists "site_content readable" on public.site_content;
create policy "site_content readable" on public.site_content for select using (true);

drop policy if exists "auth writes site_content" on public.site_content;
create policy "auth writes site_content" on public.site_content for all
  to authenticated using (true) with check (true);

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

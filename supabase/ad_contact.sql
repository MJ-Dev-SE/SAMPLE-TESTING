-- =============================================================================
-- Manila Tour — contact info on ADVERTISEMENTS (run once).
--   Dashboard → SQL Editor → New query → paste → Run.
--
-- The /ad/view page (wing banners, header ads, homepage ad cards, footer
-- ADVERTISEMENT links — everything in the admin "Advertisements" tab) is a
-- sponsor's own page, not community content: it no longer shows a Comments /
-- Reviews thread, and instead shows the advertiser's contact details. These are
-- the columns holding those details; each is optional and edited in the admin
-- Advertisements form.
--
-- Business listings and posts are NOT affected — they keep their own separate
-- address/contact columns and their comment threads.
--
-- Safe to run before or after the frontend deploy: lib/content.ts retries with
-- the pre-migration column list on Postgres 42703 (undefined column), so ads
-- keep rendering (just without contact info) until this runs.
-- =============================================================================

alter table public.advertisements
  add column if not exists address      text,
  add column if not exists phone        text,
  add column if not exists mobile_phone text,
  add column if not exists email        text;

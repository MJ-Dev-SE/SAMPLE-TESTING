-- =============================================================================
-- Manila Tour — ADDRESS + CONTACT migration (run once, AFTER community.sql +
-- manilatour.sql + seo.sql). Dashboard → SQL Editor → New query → paste → Run.
--
-- Adds a structured Philippines address (province / city-municipality /
-- barangay, entered via a cascading picker — src/components/PostingAddressFields.tsx
-- — plus a free-text street/unit line composed into the existing `address`
-- column) and a Contact block (phone already existed on businesses; adds
-- mobile_phone everywhere) to EVERY posting, not just Business Directory
-- listings:
--   1) businesses — add address_province / address_city / address_barangay /
--      mobile_phone (existing address/phone/region columns are reused as-is).
--   2) posts — add address / address_province / address_city /
--      address_barangay / phone / mobile_phone (all new — posts had none of
--      this before).
--   3) Recreates public.popular_posts (same definition as manilatour.sql/
--      seo.sql) so `select p.*` in that view picks up posts' new columns —
--      a view's `p.*` is frozen at CREATE time, so skipping this step would
--      leave popular_posts silently missing the new fields.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) BUSINESSES — structured address breakdown + mobile phone.
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists address_province text,
  add column if not exists address_city     text,
  add column if not exists address_barangay text,
  add column if not exists mobile_phone     text;

-- ---------------------------------------------------------------------------
-- 2) POSTS — address + contact, net-new (every post now collects these).
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists address          text,
  add column if not exists address_province text,
  add column if not exists address_city     text,
  add column if not exists address_barangay text,
  add column if not exists phone            text,
  add column if not exists mobile_phone     text;

-- ---------------------------------------------------------------------------
-- 3) POPULAR_POSTS — recreate (unchanged definition) so `p.*` exposes the
--    new posts columns above.
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

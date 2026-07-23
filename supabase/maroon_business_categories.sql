-- =============================================================================
-- Manila Tour — decouples 4 maroon-bar shortcuts from the Business Directory
-- (run once, AFTER community.sql). Dashboard → SQL Editor → New query → Run.
--
-- Famous Restaurants / Rent Car / Academy / Real Estate used to be plain links
-- straight into Business Directory child categories (/business-directory/food,
-- /rentcar, /education, /realestate — kind='business', full "Add listing"
-- behavior with address/contact fields). They now get their own top-level
-- community categories (kind='community') with the SAME display names, so the
-- Business Directory child pages keep working exactly as before (still
-- reachable from inside /business-directory itself), while these 4 maroon-bar
-- entries become independent, simple "Write" feeds — title + details + photo
-- only, same as News/Golf/etc. (see src/data/categoryBar.ts, src/App.tsx
-- COMMUNITY_PARENTS). No children seeded — CategoryPage/PostWrite already
-- support posting straight to a parent-only community category.
-- =============================================================================

insert into public.categories (slug, parent_slug, kind, name, icon, sort, active) values
  ('famous-restaurants', null, 'community', '{"en":"Famous Restaurants","ko":"맛집"}', 'fa-utensils', 20, true),
  ('rent-car',            null, 'community', '{"en":"Rent Car","ko":"렌트카"}',           'fa-car',      21, true),
  ('academy',             null, 'community', '{"en":"Academy","ko":"학원"}',             'fa-graduation-cap', 22, true),
  ('real-estate',         null, 'community', '{"en":"Real Estate","ko":"부동산"}',        'fa-building', 23, true)
on conflict (slug) do update set kind = excluded.kind, parent_slug = excluded.parent_slug;

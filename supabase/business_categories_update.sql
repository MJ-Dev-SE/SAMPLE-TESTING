-- =============================================================================
-- Manila Tour — Business Directory child-category update (run once).
--   Dashboard → SQL Editor → New query → paste → Run.
--
-- 1) Removes two Business Directory children — Government offices ('government')
--    and Transportation ('traffic') — by DEACTIVATING them (active=false), not
--    deleting: any business already tagged to them keeps its row (no broken
--    FK), it just no longer shows the removed category. listCategories() filters
--    on active=true, so a deactivated category disappears from BOTH the
--    directory chip row AND the "Register your business" category picker. To
--    bring either back later, set active=true again.
-- 2) Adds three new children — Money Changer, Logistics, Religion — immediately
--    selectable in Add-listing and browsable at /business-directory/<slug>.
--    'etc' (Others) is bumped to the end so it stays last in the list.
--
-- All rows are kind='business', parent_slug='business-directory'.
-- =============================================================================

-- 1) Deactivate the two removed children.
update public.categories
   set active = false
 where kind = 'business'
   and parent_slug = 'business-directory'
   and slug in ('government', 'traffic');

-- 2) Add the three new children (idempotent — re-running just refreshes them).
insert into public.categories (slug, parent_slug, kind, name, icon, sort, active) values
  ('money-changer', 'business-directory', 'business', '{"en":"Money Changer","ko":"환전소"}', 'fa-money-bill-transfer', 16, true),
  ('logistics',     'business-directory', 'business', '{"en":"Logistics","ko":"물류"}',       'fa-truck-fast',         17, true),
  ('religion',      'business-directory', 'business', '{"en":"Religion","ko":"종교"}',         'fa-place-of-worship',   18, true)
on conflict (slug) do update set
  parent_slug = excluded.parent_slug,
  kind = excluded.kind,
  name = excluded.name,
  icon = excluded.icon,
  sort = excluded.sort,
  active = excluded.active;

-- Keep "Others" last.
update public.categories set sort = 19
 where kind = 'business' and parent_slug = 'business-directory' and slug = 'etc';

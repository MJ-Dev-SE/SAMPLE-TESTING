-- =============================================================================
-- Manila Tour — adds the "Golf" maroon-bar category (run once, AFTER community.sql).
--   Dashboard → SQL Editor → New query → paste → Run
--
-- Part of the maroon-bar restructure to a single row of 12 parent-only columns
-- (src/data/categoryBar.ts): Golf is a brand-new top-level community category,
-- standing alongside Information/News/Travel/etc. — not nested under Business
-- Directory. Two children are seeded (not shown in the bar, same as every other
-- parent's children after the restructure) purely so the existing posting flow
-- works: PostWrite always requires a specific child category, never lets a post
-- save parent-only (see routes/PostWrite.tsx, routes/CategoryPage.tsx).
-- =============================================================================

insert into public.categories (slug, parent_slug, kind, name, icon, sort, active) values
  ('golf', null, 'community', '{"en":"Golf","ko":"골프"}', 'fa-golf-ball-tee', 8, true)
on conflict (slug) do update set kind = excluded.kind, parent_slug = excluded.parent_slug;

insert into public.categories (slug, parent_slug, kind, name, icon, sort, active) values
  ('golf-courses',  'golf', 'community', '{"en":"Golf Courses","ko":"골프장"}', 'fa-flag', 0, true),
  ('golf-packages', 'golf', 'community', '{"en":"Golf Packages","ko":"골프 패키지"}', 'fa-suitcase', 1, true)
on conflict (slug) do update set kind = excluded.kind, parent_slug = excluded.parent_slug;

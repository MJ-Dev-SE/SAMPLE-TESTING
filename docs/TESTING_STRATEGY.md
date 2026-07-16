# Testing Strategy — Manila Tour / PhilGo Clone

Status: **live, incremental**. This document is still the source of truth for *what* tests each
feature should have and *where they'd live*, but as of 2026-07-16 `/ctest <target>` implements and
runs real test files against the plan (bootstrapping Vitest/Testing Library/Playwright wiring on its
first call) instead of only recording intent. Entries under §8 and `## Planned Test Backlog` without a
"Run result" line are still just planned; a "Run result" line means a real test executed (or was
explicitly skipped with a stated reason — see that entry).

## 1. Current state (reviewed 2026-07-15)

- **Frontend**: React 18 + TS + Vite SPA, no backend/API — `src/data/*` is mockup data today,
  `src/lib/*` (e.g. `comments.ts`, `posts.ts`, `chat.ts`, `search.ts`, `weather.ts`, `fx.ts`) already
  contains real business logic that talks to Supabase and is unit-testable in isolation.
- **DB**: Supabase Postgres, schema in `supabase/*.sql` (`schema.sql`, `content.sql`, `community.sql`,
  `manilatour.sql`, `admin.sql`, `comments.sql`, `seo.sql`, `site_content.sql`). RLS is used for
  authorization (see `comments.sql` §5) — this is a prime white-box target.
- **Auth**: `src/lib/auth.tsx` (Supabase Auth), gates protected actions client-side today.
- **Existing test tooling**: no unit/integration framework installed (no Vitest/Jest, no `.eslintrc*`,
  no linter per `CLAUDE.md`). What exists:
  - `npm run test:seo` → `tests/seo.mjs` (esbuild + node, pure-function checks on `src/lib/seo/*`).
  - `tests/seo-render.mjs`, `tests/smoke.mjs`, `tests/verify-features.mjs`, `tests/verify-community.mjs`,
    `tests/verify-manila.mjs` → ad-hoc Playwright scripts driving a running dev server. These are
    real, useful E2E/regression checks but are hand-run, not wired into `npm test` or CI.
  - `playwright` is already a devDependency (used today only by `scripts/prerender.mjs`).
- **CI**: none (`.github/workflows` does not exist).
- **Conclusion**: the project already has the *right instincts* (pure `lib/` functions, Playwright
  available) but no formal unit/integration layer and no CI gate. This plan formalizes that without
  discarding the existing verify scripts — they become the seed of the E2E suite.

## 2. Tools (proposed, not yet installed)

| Level | Tool | Why |
|---|---|---|
| Unit / MC-DC / Integration | **Vitest** | Vite-native config reuse, fast, jsdom for hooks/components |
| Component | **@testing-library/react** (+ Vitest) | Renders real components, queries by role/text |
| E2E | **Playwright** (already a devDependency) | Already used for `prerender.mjs` + existing verify scripts |
| Lint | **ESLint** (`typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) | None configured today; `tsc -b` alone doesn't catch unused-effect-deps, a11y, etc. |
| Format | **Prettier** + `format:check` script | None configured today |
| Coverage | **Vitest `--coverage` (v8 provider)** | Built into Vitest, no extra service needed |
| DB/RLS integration | **Supabase local dev (`supabase start`) or a dedicated test project** | Never point tests at production |

Adopting these is a separate, explicit decision — this doc only records the recommendation.

## 3. Feature → test-level matrix

| Feature | Unit | MC/DC | Integration | E2E | Acceptance |
|---|---|---|---|---|---|
| Auth (`lib/auth.tsx`) | session/role helpers | `isAuthenticated && ...` gates | login → protected action unlocks | ✅ | ✅ |
| Comments/Reviews (`lib/comments.ts`, `comments.sql`) | `createComment` validation, rating clamp, `commentTargetPath` routing | rating-eligibility, RLS status gate | insert → `recent_comments_mt` → correct target | ✅ | ✅ |
| Categories (`data/categoryBar.ts`, `CategoryPage.tsx`) | parent/child filter fns | parent-vs-child combine logic | post under child → visible in child + parent feed | ✅ | ✅ |
| Posts (`lib/posts.ts`) | view-count, `postPath()` slug logic | publish-eligibility conditions | create → appears in list/board | ✅ | — |
| Chat (`lib/chat.ts`) | helpers (formatting, unread calc) | block/permission checks | search → create conversation → send/receive | ✅ | — |
| Search (`lib/search.ts`) | filter/match functions | — | live suggestions from DB | partial | — |
| Weather / FX (`lib/weather.ts`, `lib/fx.ts`) | number/date formatting, fallback on fetch failure | — | mocked network integration | — | — |
| Language toggle (`i18n`, `useLocalized`) | `L()`/`t()` resolution, fallback | — | switch persists in `localStorage`, `<html lang>` updates | ✅ | ✅ |
| Ads (`advertisements` table) | date-window eligibility fn | date-based activation, position rules | admin create → public position display | ✅ | ✅ |
| Admin (`admin.sql`, admin routes) | form validation | `is_admin()`-gated actions | create/edit record → public section, EN/KO switch | ✅ | ✅ |
| SEO (`lib/seo/*`) | slugify, excerpt, canonical URL | — | — | covered today by `tests/seo.mjs` / `seo-render.mjs` | — |

## 4. High-risk conditionals for MC/DC

Prioritized list (each condition must be shown to independently affect the outcome):

1. `comments.sql` RLS read policy: `status = 'active' OR author_id = auth.uid() OR is_admin()`
2. `createComment` rating validity: `c.rating != null && c.rating >= 1 && c.rating <= 5`
3. `RATING_TYPES.has(contentType) && page === 1` (average-rating computation gate in `listComments`)
4. Post publish/visibility gates (parent/child category combination logic)
5. Chat: user-blocking / permission checks before a conversation may be created or a message sent
6. Ad activation: `startDate <= now <= endDate && isActive && positionMatches`
7. Any composite auth gate of the shape `isAuthenticated && hasSelectedChildCategory && hasValidContent`

Skip MC/DC on presentation-only conditionals (className toggles, layout branches with no data/auth
consequence).

## 5. CI pipeline (proposed, not yet wired)

```bash
npm ci \
  && npm run typecheck \
  && npm run lint \
  && npm run format:check \
  && npm run test \
  && npm run test:coverage \
  && npm run build \
  && npm run test:e2e
```

`typecheck`/`lint`/`format:check`/`test`/`test:coverage`/`test:e2e` do not exist yet — only add them
when the corresponding tool is actually installed and configured (`build` already exists and includes
`tsc -b`). Fail the pipeline on: TS errors, lint errors, formatting drift, failing required tests,
build failure, coverage under threshold, or a critical E2E failure. CI does not replace human review.

## 6. Coverage targets (initial)

Statements 80% / branches 75% / functions 80% / lines 80%, weighted toward `lib/auth.tsx`,
`lib/comments.ts`, `lib/posts.ts`, `lib/chat.ts`, category filtering, and admin actions. No tests
written purely to move a percentage.

## 7. Acceptance scope guardrail (Given/When/Then)

The system must stay within the approved Manila Tour scope (tourism info, business listings, ads,
promo/marketing, community posts, comments/reviews, tourism links/policies). Example:

```
Given an admin creates an active Manila Tour advertisement
When it is assigned to the header position
Then it appears in the header ad area
And its destination opens correctly when clicked
```

Regression guardrail: no reintroduction of "88 Hot Spring" rooms/pools/promotions/resort categories;
existing categories, auth, navigation, and admin functions must keep working as new tests are added.

## 8. Worked example — Comments & Reviews (anchors this plan to real code)

Grounded in `supabase/comments.sql` and `src/lib/comments.ts`. These are the **planned** test cases
(not implemented) that `/ctest` would log for this feature today:

1. **Unit** — `createComment` rejects an empty/whitespace-only `body` (throws before hitting Supabase).
2. **Unit** — `createComment` clamps/validates `rating`: `0`, `6`, `2.6`, and `null` map to `null`/rounded
   per `c.rating >= 1 && c.rating <= 5`; only `1..5` survive.
3. **MC/DC** — `commentTargetPath` switch: each `content_type` (`post` non-photo, `post` photo,
   `business`, `advertisement`, `news`) independently drives a distinct return path, including the
   `is_photo && photo_slug` sub-condition.
4. **Integration** — inserting a comment via `createComment` against a test Supabase project makes the
   row show up in `public.recent_comments_mt` with the correct `resolved_title` and `target_slug`, and
   `comments_fill_polymorphic()` correctly backfills `content_type`/`content_id` for a legacy
   post-only insert (PhilGo-style row).
5. **E2E** — open a business page → submit a valid review with a rating → comment count and average
   rating update → the review appears in Recent Comments → clicking it opens the same business page
   scrolled/highlighted to that comment (`?comment=<id>`).

## 9. Deliverables checklist (tracked here, not yet built)

- [x] Vitest + Testing Library config — `vitest.config.ts`, `tests/setup.ts`, `playwright.config.ts`
      bootstrapped by `/ctest` on 2026-07-16 (jsdom env; `@testing-library/react` + `jest-dom` +
      `user-event`; `@playwright/test` added alongside the existing `playwright` devDependency).
- [ ] ESLint + Prettier config and `lint` / `format:check` scripts
- [x] `test`, `test:watch`, `test:coverage`, `test:e2e` scripts added to `package.json` (2026-07-16).
      No separate `test:unit`/`test:integration` scripts — `test`/`test:coverage` cover
      `tests/unit`, `tests/component`, `tests/integration` via one Vitest `include` glob.
- [ ] Migrate `tests/verify-*.mjs` into a structured Playwright `test:e2e` suite
- [ ] `.github/workflows/ci.yml`
- [ ] Supabase test-project fixtures (users, categories, posts, comments, businesses, ads)
- [ ] Coverage config + first coverage report
- [ ] Documented list of tested vs. untested features (this file, kept current via `/ctest`)

## Planned Test Backlog

### 2026-07-16 — Comments/Reviews: polymorphic migration (`supabase/comments.sql`)

App-layer cases for `src/lib/comments.ts` (`createComment` validation, `commentTargetPath` routing,
insert → `recent_comments_mt` integration, business-review E2E) are already logged in §8 — not
repeated here. This entry covers the SQL-level surface added by `comments.sql` that §8 doesn't
enumerate as discrete cases: the RLS policy's condition combinations, the DB constraint, the
backfill trigger, and the view's join/filter logic.

1. **MC/DC** — `comments` SELECT RLS policy (comments.sql §5): `status = 'active' OR author_id =
   auth.uid() OR public.is_admin()`. Each condition must independently flip visibility:
   - status='hidden', author_id ≠ viewer, not admin → row **hidden** (baseline false).
   - status='hidden', author_id = viewer, not admin → row **visible** (author-override flips it).
   - status='hidden', author_id ≠ viewer, is_admin()=true → row **visible** (admin-override flips it).
   - status='active', author_id ≠ viewer, not admin → row **visible** (status condition alone flips it).
2. **Unit/Constraint** — `comments_rating_range` check constraint (rating null or 1..5), tested at the
   DB layer independent of the app-side clamp in `createComment`: insert rating=0 → rejected;
   rating=6 → rejected; rating=null → accepted; rating=3 → accepted.
3. **Integration** — `comments_fill_polymorphic()` BEFORE INSERT trigger: a legacy/PhilGo-style insert
   that sets only `post_id` ends up with `content_type='post'` and `content_id=post_id::text` after
   insert; an insert that already sets `content_type='business'` explicitly is left untouched (trigger
   only fills, never overwrites).
4. **Integration** — `public.recent_comments_mt` view (comments.sql §6): (a) a comment on a post whose
   `board_id` does NOT match `mt-%` is excluded (keeps PhilGo-only content out of the Manila Tour feed);
   (b) a comment on `board_id='mt-photos'` sets `is_photo=true` and `photo_slug=po.category`; (c) a
   `status <> 'active'` or empty-body comment is excluded regardless of `content_type`.
5. **E2E/Acceptance** — admin hides a comment (`status='hidden'`) via moderation → it disappears from
   the public Recent Comments feed and from the content's own thread for a non-author/non-admin
   visitor, but stays visible to the comment's author and to an admin. Exercises RLS case 1 end-to-end
   through the UI instead of raw SQL.

**Coverage note:** no existing test touches `comments.sql` directly — `tests/verify-*.mjs` drive the
UI, not RLS/triggers/constraints, so cases 1-4 above are net-new surface, not duplicates.

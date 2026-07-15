# Testing Strategy — Manila Tour / PhilGo Clone

Status: **planning only**. Nothing in this document has been installed, wired into CI, or executed.
It defines *what* tests this project should eventually have and *where they'd live*, so that when the
team is ready to implement, the shape is already agreed. Use `/ctest` to extend this plan feature-by-
feature as new code lands; it never writes test files or runs anything on its own.

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

- [ ] Vitest + Testing Library config
- [ ] ESLint + Prettier config and `lint` / `format:check` scripts
- [ ] `test:unit`, `test:integration`, `test:coverage` scripts
- [ ] Migrate `tests/verify-*.mjs` into a structured Playwright `test:e2e` suite
- [ ] `.github/workflows/ci.yml`
- [ ] Supabase test-project fixtures (users, categories, posts, comments, businesses, ads)
- [ ] Coverage config + first coverage report
- [ ] Documented list of tested vs. untested features (this file, kept current via `/ctest`)

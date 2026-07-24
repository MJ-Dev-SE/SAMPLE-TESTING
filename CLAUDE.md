# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Korean–Philippines community portal, originally built as a pixel-faithful clone of philgo.com's UI
and since grown into a live, Supabase-backed site served on **two domains from one codebase**.
React 18 + TypeScript + Vite + react-router-dom + Tailwind + react-i18next, deployed on Vercel.

Content comes from **two places**, and knowing which is which is the main thing to learn here:

- **Supabase (live data)** — posts, businesses, comments/reviews, news, advertisements, categories,
  page visits, auth. Read/written through `src/lib/*` (`content.ts`, `posts.ts`, `comments.ts`,
  `chat.ts`, `search.ts`, `weather.ts`, `fx.ts`), with an admin UI under `src/admin/`.
- **Static typed modules (`src/data/*`)** — site chrome that has no DB table: menu, sidebar, footer,
  megamenu, home layout, boards, category bar, plus the hanin.tv business/wing seed data.

> Historical note: this file used to say "there is no backend, no API." That has not been true for a
> long time — there is a real Supabase backend, RLS policies, and two edge functions. Treat any
> "mockup only" phrasing you find in older docs (including parts of `docs/TESTING_STRATEGY.md`) as
> stale.

## Commands

```bash
npm run dev              # Vite dev server on http://localhost:5176
npm run build            # generate sitemap/robots + tsc -b (type-check) + vite build
npm run build:prerender  # build + snapshot known public routes into dist/ (Playwright)
npm run preview          # serve the production build
npm run generate:sitemap # (re)write public/sitemap.xml + robots.txt from Supabase + VITE_SITE_URL
npm run test:seo         # -> node tests/seo.mjs (esbuild + node, pure-function checks on src/lib/seo/*)
npm run test             # Vitest (see the caveat below)
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Vitest with v8 coverage
npm run test:e2e         # Playwright -> tests/e2e (see the caveat below)

node tests/seo-render.mjs # SEO head-tag render checks (needs `npm run dev` running)
node tests/smoke.mjs      # ad-hoc Playwright route smoke test (needs `npm run dev` running)
```

**Test-suite reality check (as of 2026-07-24).** `vitest.config.ts` globs `tests/unit`,
`tests/component`, and `tests/integration`, but only **`tests/unit` exists** (3 files:
`brand.test.ts`, `dialCodes.test.ts`, `wingSlots.test.ts`). `playwright.config.ts` points at
`tests/e2e`, which **does not exist yet** — so `npm run test:e2e` runs with `--pass-with-no-tests`
(it succeeds with "no tests" instead of hard-failing) until `/ctest` drops real specs there.
The `tests/*.mjs` files at the root of `tests/` (`smoke`, `seo-render`, `verify-features`,
`verify-community`, `verify-manila`) are a separate, hand-run Playwright harness; they take a
`BASE_URL` env override and **default to `http://hanin.localhost:5176`** — the hanin brand, because
bare `localhost` resolves to the temporarily-disabled Manila Tour and renders NotFound (see the
multi-brand section). Use `/ctest <target>` to add real tests (see `docs/TESTING_STRATEGY.md`).

⚠️ **`tests/smoke.mjs` is flaky by design.** It navigates with `waitUntil: 'networkidle'` and a 20s
timeout, but the homepage pulls 25–30 ad/business images straight from Supabase Storage. When those
are cold, the network never goes idle, `page.goto` times out, and **every** route is reported as
"not rendered" — a false failure that looks alarming but says nothing about the app. Verified with a
`domcontentloaded` probe: the pages render fine (correct nav, correct locale per brand) while ~25
image requests are still in flight. If you see a whole-suite failure here, check whether the errors
are all `navigation: page.goto: Timeout … networkidle` before believing it.

There is no linter configured. The automated checks are `tsc -b` (run by `build`), the SEO scripts,
and the Vitest/Playwright suites. `tsconfig.json` is strict with `noUnusedLocals`/`noUnusedParameters`,
so unused imports/vars fail the build.

`tsconfig.node.json` is a **composite referenced project**, so it may not set `noEmit` (TS6310). It
emits to `node_modules/.tmp/tsconfig-node/` instead — do not remove that `outDir`, or `tsc -b` will
start writing a stale `vite.config.js`/`vite.config.d.ts` into the repo root again. That matters
because Vite resolves `vite.config.js` **before** `vite.config.ts`, so a stray emitted `.js` silently
shadows the real config.

In VS Code this project is launched via the `philgo` launch config (`.claude/launch.json`, port 5176).

## Multi-brand / per-hostname branding — read this before debugging "the site is 404"

`src/config/brand.ts` decides how the SAME app presents itself per domain. Page content is identical
everywhere; only the identity layer switches (site name, logo, title/meta defaults, favicon, footer,
ad slots, default locale, wing-banner counts). The host is read **once at module load** from
`window.location.hostname` into `activeBrand`; unknown hosts fall back to `BRANDS[0]`.

| Brand | Hostnames | Notes |
|---|---|---|
| `manilatour` (default) | `manilatour.com` | **`disabled: true`** right now — a deliberate, reversible kill-switch |
| `hanin` | `hanin.tv`, `hanin.localhost` | `defaultLocale: 'ko'`, `forceDefaultLocale: true`, `adPrefix: 'hanin:'` |

**Consequence that will waste your time if you don't know it:** plain `http://localhost:5176/` matches
no brand → falls back to MANILATOUR → `disabled: true` → `src/App.tsx` renders `<NotFound />` for
**every** path. That is expected, not a regression. **For local work use
`http://hanin.localhost:5176/`.** To bring manilatour back, set `disabled: false` in `brand.ts:104`.

Ads are scoped per position: positions listed in a brand's `brandedAdPositions` read rows stored under
`adPrefix + position` (e.g. `'hanin:header'`); every other position falls through to the shared base
slots. `vercel.json` currently 302-redirects `manilatour.com` → `hanin.tv` and rewrites
`/robots.txt` + `/sitemap.xml` to the `.hanin` variants for the hanin host.

## SEO layer

- `src/config/site.ts` — SITE_URL/SITE_NAME resolved from `activeBrand` + `VITE_SITE_URL`/
  `VITE_SITE_NAME` (validated; loud console error + origin fallback in prod when missing). Never
  hardcode the production domain.
- `src/components/seo/Seo.tsx` — one per page: title/description/canonical/robots/OG/Twitter/
  hreflang/JSON-LD via react-helmet-async (provider in `main.tsx`). `Breadcrumbs.tsx` renders the
  shared crumb trail + BreadcrumbList JSON-LD.
- `src/lib/seo/*` — slugify (Korean-preserving), excerpt/strip/truncate, canonical/image URL
  helpers, schema.org builders. Mirrored server-side by `public.slugify()` in `supabase/seo.sql`.
- **`supabase/seo.sql` must run before deploying**: adds slug + meta columns, slug triggers and
  the `slug_redirects` table. Until it runs, `lib/content.ts` falls back to legacy column lists
  (`withSeoColumnFallback`), so the site still works pre-migration.
- Renaming a slug is safe: a DB trigger logs the old slug into `slug_redirects`, and detail pages
  that miss on the primary lookup consult `src/lib/slugRedirects.ts` and client-redirect, so
  published links never die.
- URLs: posts `/posts/<slug>`, businesses `/business/<slug>`, news `/news/article/<slug>`,
  community categories `/<parent>[/<child>]` (routes/CategoryPage.tsx), directory
  `/business-directory[/<category>]`. All legacy query-param URLs still resolve (redirect or
  canonical). Link posts/businesses ONLY via `postPath()` (lib/posts) / `businessPath()`
  (lib/content). Unknown routes render `routes/NotFound.tsx` (noindex), not a home redirect.
- `scripts/generate-sitemap.mjs` (build-time, anon key only) writes sitemap.xml + robots.txt;
  `scripts/prerender.mjs` snapshots the known public routes. Both sitemap files are committed, so
  `npm run build` will show them as modified whenever the DB content has changed — that diff is
  expected. See `docs/SEO_DEPLOYMENT.md`.

## Database / migrations

`supabase/*.sql` holds 17 hand-run migrations (Dashboard → SQL Editor → paste → Run), plus edge
functions in `supabase/functions/` (`ai-assistant`, `track-visit`). RLS is the authorization
mechanism — see `comments.sql` §5 and `admin.sql`.

⚠️ **The files are flat and unnumbered, so apply order is only documented in prose** (e.g. `seo.sql`
must run before deploying). Watch out for the near-identical names `address_contact.sql` (business
listings) and `ad_contact.sql` (advertisements) — they touch different tables. Each file's header
comment states whether it is idempotent and whether it is safe to run before or after the frontend
deploy; read it before running.

## Architecture

The original idea still governs the static half: **markup is fixed; content lives in typed modules.**
When changing chrome content, edit the data module, not the JSX.

- **`src/types/index.ts`** — every DATA SLOT shape. Start here to understand any data module.
  `Localized = { en: string; ko: string }` is the key primitive: any text that differs by language is
  a `Localized` object, not a bare string. Proper nouns/brands stay bare strings.
- **`src/data/*`** — typed static modules: `menu`, `megamenu`, `sidebar`, `footer`, `home`, `boards`,
  `categoryBar`, `haninBusinesses`, `haninWings`, `siteContent`, `manilaSeed.json`. Korean values not
  captured from the real site are marked `[KO: …]` placeholders (35 remain, mostly in `menu.ts`);
  hanin.tv identity placeholders are marked `[HANIN: …]` in `brand.ts`.
  *Known dead code:* `nav.ts` and `list.ts` are imported nowhere; `components/MegaMenu.tsx` is
  likewise unwired (the menu is the dedicated `/menu` route, not a hover dropdown).
- **`src/lib/*`** — the live data layer plus hooks and pure utils, all flat in one directory today.
  `content.ts` and `posts.ts` are the big ones and already carry loading/error handling.
  `src/lib/seo/*` is the one sub-module that has been split out.
- **`src/components/*`** — presentational, consuming both halves. Sub-folders exist for `ai/`,
  `comments/`, and `seo/`; the rest is flat.
- **`src/routes/*`** — ~26 pages (Home, Menu, PostList/View/Write, CategoryPage, Company,
  BusinessView/Register, News/Weather views, Photo, Ad views, Login/Register/Profile, Chat,
  Policy, NotFound, Placeholder). Each route wraps its content in `<Layout>`.
- **`src/admin/*`** — the admin surface (`AdminPage`, `RecordForm`, `AdSlotsPanel`, `registry.ts`,
  `audit.ts`, `visits.ts`, `useIsAdmin.ts`). This is the one feature-sliced folder; everything else
  is sliced by layer.

### i18n (per-brand default locale)

- Config in `src/i18n/index.ts`: react-i18next + browser language detector.
- **Per-brand behavior.** When `activeBrand.forceDefaultLocale` is `false` (manilatour), the locale
  is detected from the browser, persists in `localStorage['lang']`, and is mirrored to `<html lang>`.
  When it is `true` (hanin), detection *and* persistence are both disabled: every load opens in
  `defaultLocale` (`ko`), and the switcher changes only the current view. An empty
  `localStorage['lang']` on hanin.tv is correct, not a bug.
- Two parallel string systems:
  - **UI chrome strings** → `src/locales/{en,ko}.json`, read with `useTranslation()`'s `t()`.
  - **DATA SLOT strings** → `Localized` fields in `src/data/*`, read with the `useLocalized()` hook
    (`src/lib/useLocalized.ts`), conventionally bound to `const L = useLocalized()` then `L(field)`.
  Use `t()` for labels/headings baked into components; use `L()` for anything from a data module.
- Routing (`src/App.tsx`): `PageRoutes` defines all routes as **relative** paths and is mounted three
  times — at `/`, under `/en/*`, and under `/ko/*`. The `/en` and `/ko` wrappers force i18n to that
  locale. Routes mirror real PhilGo URLs, including query-param pages like
  `/post/list?post_id=freetalk&category=…` (read via `useSearchParams`, see `routes/PostList.tsx`).

### Styling / design tokens

- Tokens are defined once in `tailwind.config.ts` (`theme.extend`) and mirrored as CSS variables in
  `src/styles/global.css`. Values are meant to be pixel-exact to the live site — preserve them.
- Use the semantic Tailwind names, not raw hex: spacing `xs/s/m/l/xl/2xl`, radii `m/l`, colors like
  `text-normal`, `muted`, `subtlest`, `neutral-90/95/97`, `link`, `maroon`, and accent/chip pairs
  (`accent-blue`+`chip-blue`, etc.). `max-w-content` (1010px) is the 3-column shell width.
- Accent colors are a closed set (`AccentColor` type). `src/lib/accent.ts` maps each to its
  `bg-chip-* text-accent-*` class pair — use `accentClass[color]` rather than hardcoding the pair.
- Page shell is `src/components/Layout.tsx`: Header + LeftSidebar / main / RightSidebar + Footer.
- Images: real assets live under `public/` (brand logos, `public/brand/hanin/**` showcase and wing
  creatives) and are resolved through `src/lib/media.ts` + `components/SmartImage.tsx`;
  `src/lib/placeholder.ts` supplies inline SVG placeholders where no asset exists. Font Awesome solid
  icons load via CDN in `index.html` and are referenced as `fa-*` class names stored in data.
- `public/data/ph-address/**` is a generated dataset (~1,735 JSON files from
  `scripts/build-ph-address.mjs`), fetched one file at a time by `src/lib/phAddress.ts`. It is
  deliberately split that way — do not bundle it.

## Reference material

`docs/reference/ad-assets/` holds client screenshots and source creatives. Nothing there is served —
Vite only serves `public/`. Images the site actually renders live under `public/brand/hanin/`.

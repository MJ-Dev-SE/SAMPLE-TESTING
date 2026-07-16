# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pixel-faithful, **data-driven** clone of the philgo.com Korean–Philippines community portal UI.
React 18 + TypeScript + Vite + react-router-dom + Tailwind + react-i18next. There is no backend,
no API, and no real pagination — every page renders mockup data sequentially.

## Commands

```bash
npm run dev              # Vite dev server on http://localhost:5175
npm run build            # generate sitemap/robots + tsc -b (type-check) + vite build
npm run build:prerender  # build + snapshot known public routes into dist/ (Playwright)
npm run preview          # serve the production build
npm run generate:sitemap # (re)write public/sitemap.xml + robots.txt from Supabase + VITE_SITE_URL
npm run test:seo         # SEO utility unit tests (esbuild + node, no server needed)
node tests/seo-render.mjs # SEO head-tag render checks (needs `npm run dev` running)
npm run test              # Vitest — unit/MC-DC/component/integration (tests/unit, tests/component, tests/integration)
npm run test:watch        # Vitest in watch mode
npm run test:coverage     # Vitest with v8 coverage report
npm run test:e2e          # Playwright — tests/e2e (auto-starts the dev server if not already running)
```

There is no linter configured. Type-checking via `tsc -b` (run by `build`), the two SEO test scripts
above, and the Vitest/Playwright suites (`test`, `test:coverage`, `test:e2e` — wired up via `/ctest`,
see `docs/TESTING_STRATEGY.md`) are the automated checks. `tsconfig.json` is strict and uses
`noUnusedLocals`/`noUnusedParameters`, so unused imports/vars fail the build.

In VS Code this project is launched via the `philgo` launch config (port 5175).

## SEO layer

- `src/config/site.ts` — SITE_URL/SITE_NAME from `VITE_SITE_URL`/`VITE_SITE_NAME` (validated; loud
  console error + origin fallback in prod when missing). Never hardcode the production domain.
- `src/components/seo/Seo.tsx` — one per page: title/description/canonical/robots/OG/Twitter/
  hreflang/JSON-LD via react-helmet-async (provider in `main.tsx`). `Breadcrumbs.tsx` renders the
  shared crumb trail + BreadcrumbList JSON-LD.
- `src/lib/seo/*` — slugify (Korean-preserving), excerpt/strip/truncate, canonical/image URL
  helpers, schema.org builders. Mirrored server-side by `public.slugify()` in `supabase/seo.sql`.
- **`supabase/seo.sql` must run before deploying**: adds slug + meta columns, slug triggers and
  the `slug_redirects` table. Until it runs, `lib/content.ts` falls back to legacy column lists
  (`withSeoColumnFallback`), so the site still works pre-migration.
- URLs: posts `/posts/<slug>`, businesses `/business/<slug>`, news `/news/article/<slug>`,
  community categories `/<parent>[/<child>]` (routes/CategoryPage.tsx), directory
  `/business-directory[/<category>]`. All legacy query-param URLs still resolve (redirect or
  canonical). Link posts/businesses ONLY via `postPath()` (lib/posts) / `businessPath()`
  (lib/content). Unknown routes render `routes/NotFound.tsx` (noindex), not a home redirect.
- `scripts/generate-sitemap.mjs` (build-time, anon key only) writes sitemap.xml + robots.txt;
  `scripts/prerender.mjs` snapshots the known public routes. See `docs/SEO_DEPLOYMENT.md`.

## Architecture

The central idea: **markup is fixed; data lives in typed modules.** Swapping in real data later means
editing `src/data/*` only — components never change. When adding or changing content, edit the data
module, not the JSX.

- **`src/types/index.ts`** — every DATA SLOT shape. Start here to understand any data module.
  `Localized = { en: string; ko: string }` is the key primitive: any text that differs by language is
  a `Localized` object, not a bare string. Proper nouns/brands stay bare strings.
- **`src/data/*`** — typed mockup modules (nav, megamenu, home, menu, footer, sidebar, boards, list,
  categoryBar). Each module's top comment documents its DATA SLOT shape. Korean values that weren't
  captured from the real site are marked `[KO: …]` placeholders for the client to fill.
- **`src/components/*`** — presentational. They consume data modules and render with Tailwind classes.
- **`src/routes/*`** — pages (Home, Menu, PostList, PostView, Company, Chat, Placeholder). Each route
  wraps its content in `<Layout>`.

### i18n (EN default, KO second)

- Config in `src/i18n/index.ts`: react-i18next + browser language detector. Active locale persists in
  `localStorage['lang']` and is mirrored to `<html lang>`.
- Two parallel string systems:
  - **UI chrome strings** → `src/locales/{en,ko}.json`, read with `useTranslation()`'s `t()`.
  - **DATA SLOT strings** → `Localized` fields in `src/data/*`, read with the `useLocalized()` hook
    (`src/lib/useLocalized.ts`), conventionally bound to `const L = useLocalized()` then `L(field)`.
  Use `t()` for labels/headings baked into components; use `L()` for anything coming from a data module.
- Routing (`src/App.tsx`): `PageRoutes` defines all routes as **relative** paths and is mounted three
  times — at `/`, under `/en/*`, and under `/ko/*`. The `/en` and `/ko` wrappers force i18n to that
  locale. Unknown paths redirect to home. Routes mirror real PhilGo URLs, including query-param pages
  like `/post/list?post_id=freetalk&category=…` (read via `useSearchParams`, see `routes/PostList.tsx`).

### Styling / design tokens

- Tokens are defined once in `tailwind.config.ts` (`theme.extend`) and mirrored as CSS variables in
  `src/styles/global.css`. Values are meant to be pixel-exact to the live site — preserve them.
- Use the semantic Tailwind names, not raw hex: spacing `xs/s/m/l/xl/2xl`, radii `m/l`, colors like
  `text-normal`, `muted`, `subtlest`, `neutral-90/95/97`, `link`, `maroon`, and accent/chip pairs
  (`accent-blue`+`chip-blue`, etc.). `max-w-content` (1010px) is the 3-column shell width.
- Accent colors are a closed set (`AccentColor` type). `src/lib/accent.ts` maps each to its
  `bg-chip-* text-accent-*` class pair — use `accentClass[color]` rather than hardcoding the pair.
- Page shell is `src/components/Layout.tsx`: Header + LeftSidebar / main / RightSidebar + Footer.
- Images are inline SVG placeholders (`src/lib/placeholder.ts`); Font Awesome solid icons load via CDN
  in `index.html` and are referenced as `fa-*` class names stored in data.

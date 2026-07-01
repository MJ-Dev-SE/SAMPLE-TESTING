# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pixel-faithful, **data-driven** clone of the philgo.com Korean–Philippines community portal UI.
React 18 + TypeScript + Vite + react-router-dom + Tailwind + react-i18next. There is no backend,
no API, and no real pagination — every page renders mockup data sequentially.

## Commands

```bash
npm run dev       # Vite dev server on http://localhost:5175
npm run build     # tsc -b (type-check, references tsconfig.node.json) + vite build
npm run preview   # serve the production build
```

There is no test runner and no linter configured. Type-checking via `tsc -b` (run by `build`) is
the only automated check. `tsconfig.json` is strict and uses `noUnusedLocals`/`noUnusedParameters`,
so unused imports/vars fail the build.

In VS Code this project is launched via the `philgo` launch config (port 5175).

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

# PhilGo UI Clone

A pixel-faithful clone of the [philgo.com](https://philgo.com) Korean–Philippines community portal UI.
Built per the master spec: **React 18 + TypeScript + Vite + react-router-dom + Tailwind CSS + react-i18next + Font Awesome.**

All UI is **data-driven** via typed mockup modules (DATA SLOTs). Swapping in real data later means editing
the `src/data/*` modules only — component markup stays unchanged. Pagination is a layout placeholder
(items render sequentially, no real paging logic).

## Getting started

```bash
npm install
npm run dev        # opens http://localhost:5175
npm run build      # type-check + production build
npm run preview
```

## Internationalization (EN / KO)

- Default locale **English**; second locale **Korean**.
- Toggle in the header (top-right) and reused in the footer "Global Site" switcher.
- Active language persists via `localStorage['lang']` and sets `<html lang>`.
- Locale-prefixed routes `/en/*` and `/ko/*` are also supported.
- All user-facing strings are locale keys (`src/locales/en.json`, `ko.json`).
- DATA SLOTs carry localized `{ en, ko }` fields. Korean values that weren't known are marked `[KO: …]`
  placeholders for the client to fill; known Korean (footer policy, business categories, widgets) is filled in.

## Project structure

```
src/
  components/   Header, MegaMenu, Left/RightSidebar, Footer, Layout, NewsTabs,
                BoardColumn, PopularList, BusinessCard, RecentComments, RecentPhotos,
                EmergencyCard, MenuSection, MenuRow, LanguageSwitcher, Pagination, BannerRow
  routes/       Home, Menu, PostList, Company, Chat
  data/         nav, megamenu, home, menu, footer, sidebar, list  (typed DATA SLOTs)
  i18n/         react-i18next config (detection + persistence + <html lang>)
  locales/      en.json, ko.json
  styles/       global.css (design tokens as CSS variables)
  types/        shared TypeScript interfaces
  lib/          useLocalized, accent map, placeholder image helpers
```

## Design tokens

Configured in `tailwind.config.ts` and mirrored as CSS variables in `src/styles/global.css`
(spacing xs–2xl, radii m/l, color palette, accent chip pairs, system font stack) — pixel-exact.

## Routes

`/` (home) · `/menu` · `/post/list` · `/company` · `/chat` · plus `/en/*` and `/ko/*` locale wrappers.

## Notes

- Banner/photo/avatar images are inline SVG placeholders (no external asset downloads).
- Font Awesome solid icons load via CDN in `index.html`.
- Philgo's real footer has no physical-address block; a `company` DATA SLOT exists in
  `src/data/footer.ts` for clients who want a traditional company-info footer (not rendered by default).
```

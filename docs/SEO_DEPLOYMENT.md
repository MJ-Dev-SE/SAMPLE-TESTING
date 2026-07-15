# SEO Deployment Guide — Manila Tour

Everything the SEO layer needs at deploy time, per hosting target.
The full architecture summary lives at the end of this file.

## TL;DR checklist (any host)

1. **Run the DB migration first**: paste `supabase/seo.sql` into Supabase → SQL Editor → Run
   (idempotent; run it BEFORE deploying this frontend — the client now selects the new columns).
2. Set production env vars (see below) — especially `VITE_SITE_URL`.
3. `npm run build` (static) or `npm run build:prerender` (static + pre-rendered public routes — preferred).
4. Deploy `dist/`.
5. Configure the SPA rewrite for your host (below) — it must not shadow real files.
6. Verify `https://<domain>/robots.txt` and `https://<domain>/sitemap.xml`, then submit the
   sitemap in Google Search Console (URL-prefix property for the domain).
7. Spot-check: deep link (e.g. `/business-directory/hotel`) loads on hard refresh; `view-source`
   of a pre-rendered route shows real `<title>`/`<meta>`.

## Environment variables (production)

| Var | Required | Notes |
|---|---|---|
| `VITE_SITE_URL` | **Yes** | Canonical origin, e.g. `https://manilatour.com`, no trailing slash. Build warns loudly if missing/placeholder; the client falls back to `window.location.origin`. |
| `VITE_SITE_NAME` | No | Defaults to "Manila Tour". |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | **Yes** | Public client + sitemap generator (anon key only — RLS-safe public reads). |
| `SUPABASE_SERVICE_ROLE_KEY` | No | **Server-only** (seed script). Never `VITE_`-prefixed, never needed by the build. |

## Build commands

- `npm run generate:sitemap` — writes `public/sitemap.xml` + `public/robots.txt` (absolute URLs from `VITE_SITE_URL`). Fail-soft: without Supabase access it emits the static routes only and the build continues.
- `npm run build` — sitemap + typecheck (`tsc -b`) + `vite build`.
- `npm run build:prerender` — the above, then snapshots ~30 known public routes into `dist/<route>/index.html` with headless Chromium (needs `npx playwright install chromium` once on the build machine).
- `npm run test:seo` — 58 unit checks (slug/canonical/structured-data/sitemap).

## Host-specific configuration

### Vercel (current `vercel.json`)

Already configured: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`.
Vercel checks the filesystem **before** applying rewrites, so `robots.txt`, `sitemap.xml`,
assets and pre-rendered `dist/<route>/index.html` files are served as-is; only genuinely
missing paths fall back to the SPA. Set the env vars in Project → Settings → Environment
Variables and use `npm run build:prerender` as the build command (Vercel's build image can
run `npx playwright install chromium` in `installCommand`).

HTTP 404 limitation: unknown URLs return 200 + the noindex 404 page. Acceptable to Google
(soft-404 detection + noindex); a real 404 status would require SSR/middleware.

### Hostinger static (or any Apache shared hosting)

Upload `dist/` and add `.htaccess` in the web root:

```apache
RewriteEngine On
# Serve real files/directories first — never rewrite over robots.txt,
# sitemap.xml, JS/CSS/fonts/images or pre-rendered pages.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
# Everything else → the SPA shell
RewriteRule ^ /index.html [L]
```

### Nginx (Hostinger VPS or any VPS)

```nginx
server {
  root /var/www/manilatour/dist;
  index index.html;
  location / {
    try_files $uri $uri/index.html /index.html;
  }
}
```

`try_files $uri $uri/index.html` serves pre-rendered routes and real assets before the SPA fallback.

### Hostinger VPS with Node (optional SSR future)

Not required today. If real per-URL HTML for dynamic detail pages becomes a hard requirement,
the least disruptive path is Vite manual SSR for the public routes only (admin/auth stay
client-side) — see "Rendering strategy" below before committing to this.

## Custom domain / HTTPS

Point the domain at the host (A/ALIAS or Vercel nameservers), enable HTTPS (automatic on
Vercel; Let's Encrypt via hPanel/certbot elsewhere), then make sure `VITE_SITE_URL` matches
the final scheme+host exactly and rebuild — canonicals/sitemap bake the URL in at build time.

## Search Console

1. Add the property for `VITE_SITE_URL`, verify via DNS TXT (or the HTML-tag method — add the
   meta tag to `index.html` `<head>` and redeploy).
2. Sitemaps → submit `sitemap.xml`.
3. Inspect a pre-rendered URL (e.g. `/information`) and a dynamic one (e.g. a `/posts/<slug>`)
   with URL Inspection → "View crawled page" to confirm metadata is picked up.

## Keeping the sitemap fresh (content changes without redeploys)

Chosen option: **scheduled regeneration** — the sitemap is generated at build time, so
redeploying refreshes it. On Vercel, add a Deploy Hook (Settings → Git → Deploy Hooks) and
either trigger it after publishing content or hit it on a schedule (e.g. a daily
`cron-job.org`/GitHub Actions ping). This is fully supported by static hosting and needs no
server runtime. (Alternatives considered: a Supabase Edge Function serving XML would work but
adds a second origin for `sitemap.xml`; dynamic endpoints aren't possible on pure static hosts.)

## Rendering strategy (and its honest limits)

Chosen: **SPA + build-time pre-rendering of known public routes** (`scripts/prerender.mjs`) —
the least disruptive meaningful option: no framework migration, admin/auth stay client-side,
and the ~30 highest-value pages (home, all category landings, directory, policies) ship as
complete HTML with metadata + JSON-LD.

**Remaining limitation — state this plainly:** dynamic detail pages (`/posts/<slug>`,
`/business/<slug>`, `/news/article/<slug>`, `/photo/view`) are client-rendered. Googlebot
executes JS and reads their react-helmet metadata, but non-JS crawlers and most social
scrapers (Facebook/Kakao link previews) will see only the site defaults for those URLs.
If detail-page link previews or non-Google SEO become a priority, the upgrade path is Vite
manual SSR for the public router on a Node host — do not migrate the whole app.

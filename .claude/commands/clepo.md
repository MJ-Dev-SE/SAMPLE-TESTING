---
description: End-of-task health check — runs the FE-BE, FE-CO, and EC agents in order and returns one Taglish report (frontend, backend, middleware, deployment).
---

Run the full **/clepo** end-of-task checking pipeline for this project (PhilGo clone, Vite + React SPA).
The goal: after I finish a task, this one command tells me — in **Taglish** — whether everything is
healthy, and exactly where any problem is.

## Setup (do this once, before the agents)
1. Confirm the dev server is up so the UI agents can drive it:
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:5175`
   If it is not `200`, start it in the **background**: `npm run dev`, then poll the port until it
   answers `200` before continuing.

## Run the three agents IN THIS ORDER (sequentially, not parallel)
Use the Agent tool. Wait for each to finish and capture its Taglish report block before starting the next.

1. **`fe-be`** — data ↔ render checker (frontend rendering data from backend; backend is future, so it
   checks the data-layer wiring today).
2. **`fe-co`** — frontend component/UI checker. It runs `tests/smoke.mjs` in headless Chromium plus
   targeted checks for whatever changed this session (buttons, animations, scroll, nav, language switch).
3. **`ec`** — error checker (frontend build/tsc, backend/middleware, deployment readiness) and a summary
   of what I modified this session. **It must NOT push or deploy — diagnose only.**

## Then give me ONE consolidated report
Synthesize the three agents' findings into a single Taglish summary using exactly this shape. Lead each
section with a clear ✅ / ⚠️ / ❌ so I can scan it fast:

```
========== /clepo REPORT ==========

🖥️  FRONTEND (UI / components — FE-CO)
   <✅/⚠️/❌> <Taglish: routes, buttons, animations, scroll, language switch, console errors>

🔌  FE ↔ BACKEND (data rendering — FE-BE)
   <✅/⚠️/❌> <Taglish: data wiring, [KO:] placeholders, future-backend notes>

⚙️  BACKEND / MIDDLEWARE (EC)
   <✅/⚠️/❌> <Taglish: walang backend pa = N/A, o ang errors na nakita>

🚀  DEPLOYMENT / PUSH (EC)
   <✅/⚠️/❌> <Taglish: pwede ba i-push? kung hindi, bakit. Hindi ako nag-push — diagnose lang.>

📝  NA-MODIFY MO THIS SESSION (EC)
   <Taglish: plain-language list ng files na binago/idinagdag/binura>

—— BOTTOM LINE ——
<✅ Malinis, pwede nang i-push>  OR  <⚠️/❌ Ayusin muna ito bago mag-push: ...>
===================================
```

Rules:
- Keep the feedback **specific** — name the exact file, route, component, line, or error text. No vague
  "may problema lang somewhere."
- Tone is **Taglish** (mix of Tagalog + English), casual but clear.
- **Never push, deploy, commit, or edit source files** during /clepo. It is read-only diagnosis.
- If the dev server had to be started by you, you may leave it running (do not kill the user's server).

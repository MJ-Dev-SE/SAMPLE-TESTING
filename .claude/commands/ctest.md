---
description: Testing executor — reads/extends docs/TESTING_STRATEGY.md, then writes and RUNS real test files for the target feature (unit/MC-DC/component via Vitest, E2E via Playwright). Bootstraps the test stack on first use.
---

Run **/ctest**: this is an *execution* command. It turns the plan in `docs/TESTING_STRATEGY.md` into
real, runnable test files and runs them — it no longer just plans. Every invocation should leave the
repo with tests that actually ran (or an explicit, reported reason one couldn't).

## Input

`$ARGUMENTS` names the feature/file this invocation targets (e.g. `lib/chat.ts`, "ad scheduling",
`CategoryPage`). If empty: run the full existing suite (`npm run test`, plus `npm run test:e2e` if the
dev server is reachable) and report pass/fail + coverage, rather than picking a target.

## 0. Bootstrap the stack (idempotent — check before doing any of this)

Check `package.json` devDependencies for `vitest`. If it's already there, skip this whole section.
Otherwise, this is the first `/ctest` run in execute mode:

1. `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8`
   (Playwright is already a devDependency — don't reinstall it.)
2. Create `vitest.config.ts` at the repo root: reuse the `react()` plugin from `vite.config.ts`,
   `test.environment: 'jsdom'`, `test.setupFiles: ['tests/setup.ts']`, `test.include` matching
   `tests/unit/**/*.test.{ts,tsx}`, `tests/component/**/*.test.tsx`, `tests/integration/**/*.test.ts`.
3. Create `tests/setup.ts` importing `@testing-library/jest-dom`.
4. Create `playwright.config.ts` if it doesn't already exist: `testDir: './tests/e2e'`, `use.baseURL`
   built from `vite.config.ts`'s `server.port` (read it, don't hardcode — it has drifted from what
   CLAUDE.md documents before), `webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: true }`.
5. Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`,
   `"test:coverage": "vitest run --coverage"`, `"test:e2e": "playwright test"`.
6. Update `CLAUDE.md`'s Commands block and the "There is no linter configured..." paragraph to mention
   the new `npm run test` / `test:coverage` / `test:e2e` scripts and that Vitest + Testing Library +
   Playwright are now wired up. Don't touch anything else in that file.
7. Leave `tests/*.mjs` (the existing ad-hoc scripts) exactly as they are — this bootstrap is additive,
   not a migration.

Report what you installed/created before moving on to the actual target.

## What to do for a target

1. Read `docs/TESTING_STRATEGY.md` in full — source of truth for tools, coverage targets, MC/DC
   priorities, acceptance guardrails. Check the `## Planned Test Backlog` section (and §8's worked
   example) for an existing entry matching this target.
   - If a plan already exists for it, use those cases.
   - If not, derive 3-5 concrete cases first (level, exact function/flow, specific input/condition
     combos — MC/DC needs each condition shown to independently flip the outcome) and append a dated
     subsection to `## Planned Test Backlog` before writing any test code, same as before. Keep entries
     append-only; supersede explicitly if the code changed since a prior plan.
2. Locate the real code for the target (Grep/Glob/Read). Ground every test in an actual exported
   function, component, route, table, or RLS policy — never invent APIs that don't exist.
3. For each planned case, write a real test file and actually run it:
   - **Unit / MC-DC** (pure functions in `src/lib/*`, `src/data/*`) → `tests/unit/<module>.test.ts`,
     Vitest. Run with `npx vitest run tests/unit/<module>.test.ts`.
   - **Component** (presentational behavior, hooks) → `tests/component/<Name>.test.tsx`, Vitest +
     Testing Library + jsdom. Mock `src/lib/supabase` (`vi.mock`) rather than hitting a network.
   - **Integration** that only needs a mocked Supabase query builder → `tests/integration/<feature>.test.ts`,
     Vitest with `vi.mock('../src/lib/supabase')` simulating the relevant `.from().select()...` chain.
   - **Integration that genuinely requires live Postgres/RLS** (e.g. the comments RLS policy, the
     `comments_fill_polymorphic` trigger, `recent_comments_mt` view) — mocking can't validate a real
     RLS policy. Write the test file anyway against `tests/integration/<feature>.test.ts`, but mark
     each such case `it.skip('requires supabase start: <what it checks>', ...)` with the real
     assertion body filled in (not a stub) so it runs as soon as someone points `SUPABASE_URL` at a
     local/test instance. Report these as skipped, not passing — never claim DB-level coverage that
     didn't execute.
   - **E2E** → `tests/e2e/<flow>.spec.ts`, Playwright. Before running, check whether the dev server
     port (from `vite.config.ts`) is reachable; if not, run `npm run dev` in the background first via
     Playwright's `webServer` (already configured in step 0) rather than assuming it's up. Run with
     `npx playwright test tests/e2e/<flow>.spec.ts`.
4. After running, update the matching `## Planned Test Backlog` entry in `docs/TESTING_STRATEGY.md`:
   append a `**Run result (<date>):**` line per case — pass/fail counts and file path for cases that
   executed, and the explicit skip reason for cases that didn't. Don't delete the original plan text.
5. Report back in chat: files created/updated, the actual `vitest`/`playwright` run output (pass/fail,
   not just "wrote tests"), and anything skipped with why.

## Hard rules

- Bootstrap (section 0) runs at most once — check for `vitest` in devDependencies first; never
  reinstall or duplicate config on later calls.
- Never point any test at production Supabase. Mocked client for unit/component/integration; a local
  or dedicated test Supabase project only, never the live one, for anything that must hit real Postgres.
- Never invent APIs, routes, or table/column names that don't exist in the code.
- Never edit application source to "make it testable" — name the needed refactor as a follow-up instead.
- Never report a case as passing if it only ran against a mock standing in for real DB/RLS behavior —
  say explicitly what was and wasn't actually verified.
- If the target already has real coverage (e.g. `tests/seo.mjs` for `lib/seo/*`), extend/run that
  existing coverage rather than duplicating it in a new file.

---
description: Testing-strategy planner — reads/extends docs/TESTING_STRATEGY.md with a per-feature test plan (3-5 concrete cases across unit/MC-DC/integration/E2E/acceptance). Never writes test files, installs frameworks, or runs tests.
---

Run **/ctest**: this is a *planning* command, not a test runner. It exists so we can decide **what
tests a feature should eventually have** before any of it is implemented. It must never install a
test framework, create test files, or execute anything (`npm test`, `npx playwright`, etc.).

## Input

`$ARGUMENTS` names the feature/file this invocation targets (e.g. `lib/chat.ts`, "ad scheduling",
`CategoryPage`). If empty, operate on the whole project: summarize `docs/TESTING_STRATEGY.md` and
point out the biggest coverage gap.

## What to do

1. Read `docs/TESTING_STRATEGY.md` in full — it is the source of truth for tools, coverage targets,
   MC/DC priorities, and the acceptance/regression guardrails. Don't repeat its contents blindly;
   apply them to the target.
2. Locate the real code for the target (Grep/Glob/Read — `src/lib/*`, `src/data/*`,
   `src/components/*`, `src/routes/*`, relevant `supabase/*.sql`). Ground every test case in an
   actual function, component, route, table, or RLS policy — never invent APIs that don't exist.
3. Classify which test levels actually apply (skip MC/DC for presentation-only branches; skip
   integration/E2E for pure formatting helpers, etc. — see §3/§4 of the strategy doc).
4. Write **3 to 5 concrete planned test cases** for the target, each stating: level (unit / MC-DC /
   integration / E2E / acceptance), the exact function or flow it exercises, and the specific
   input/condition combinations (for MC/DC: each condition shown to independently flip the outcome).
5. Append (or update, if the feature already has an entry) a dated subsection under a
   `## Planned Test Backlog` heading at the end of `docs/TESTING_STRATEGY.md` — create that heading
   if it doesn't exist yet. Keep entries append-only per feature (don't silently delete a prior
   plan; supersede it explicitly if the code changed).
6. Report back to me directly (in chat) the same 3-5 test cases you just filed, plus any gap you
   noticed against the feature → level matrix (§3) or the MC/DC risk list (§4).

## Hard rules

- Never create `*.test.ts`, `*.spec.ts`, or any Playwright script.
- Never run `npm install`, `npm test`, `npx vitest`, `npx playwright`, or any test/build command.
- Never edit application source to "make it testable" — if the code genuinely needs a safe refactor
  to be testable, name that as a follow-up recommendation instead of doing it here.
- If the target already has real coverage (e.g. `tests/seo.mjs` for `lib/seo/*`), say so and record
  what's covered vs. still missing instead of proposing duplicate cases.

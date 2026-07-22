import { lazy, type ComponentType } from 'react'

/**
 * React.lazy() wrapper that fixes the #1 cause of "white screen after
 * switching tabs — need to reload to fix it" in code-split SPAs like this one.
 *
 * WHY IT HAPPENS: every route is its own JS chunk (see the `lazy(() =>
 * import('./routes/...'))` calls in App.tsx), fetched on first visit to that
 * route. Backgrounding a browser tab commonly throttles or outright cancels
 * in-flight network requests — so a chunk fetch that was still loading when
 * the user switched tabs can come back REJECTED once they switch back. A
 * rejected `import()` promise is exactly what `React.lazy()` throws into the
 * render tree as a fatal error; with nothing to catch it, React unmounts the
 * ENTIRE app, leaving a blank white page. A stale chunk reference after a new
 * deploy shipped different file hashes fails the exact same way.
 *
 * FIX: retry the import a couple of times first (recovers the vast majority
 * of cases — the network hiccup is transient). If it's still failing, assume
 * the deployed build changed under us and reload the page ONCE to fetch the
 * current build — sessionStorage remembers that attempt so a genuinely broken
 * network doesn't reload-loop forever. Either path means the user never sees
 * a blank screen or a manual-reload prompt for what is, 99% of the time, a
 * transient hiccup that fixes itself.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches React.lazy's
// own signature (ComponentType<any>), so components with specific prop types
// (e.g. CategoryPage's `{ parentSlug: string }`) still type-check at their call site.
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  const RELOAD_FLAG = 'mt-chunk-reload-attempted'
  const RETRIES = 2
  const RETRY_DELAY_MS = 400

  const load = async (attempt = 0): Promise<{ default: T }> => {
    try {
      const mod = await factory()
      try {
        sessionStorage.removeItem(RELOAD_FLAG) // a later success clears any earlier failure marker
      } catch {
        /* sessionStorage unavailable (private mode / quota) — not fatal */
      }
      return mod
    } catch (err) {
      if (attempt < RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        return load(attempt + 1)
      }
      let alreadyReloaded = false
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1'
        if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, '1')
      } catch {
        /* if we can't remember the attempt, fall through to a normal throw below */
      }
      if (!alreadyReloaded) {
        window.location.reload()
        // The reload is already navigating away; never resolve so React
        // doesn't get a chance to render an error state in the meantime.
        return new Promise<{ default: T }>(() => {})
      }
      // Already tried a reload once and it's STILL failing (offline, or a
      // genuinely broken deploy) — surface the real error so the top-level
      // ErrorBoundary (main.tsx) can show a recovery prompt instead of
      // reload-looping forever.
      throw err
    }
  }

  return lazy(() => load())
}

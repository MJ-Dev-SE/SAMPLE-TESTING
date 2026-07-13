/**
 * Tiny TTL cache for CONTENT reads (ads, photos, news, links, …) — the datasets
 * that change rarely but are refetched on every route change because Layout
 * remounts its widgets. Caching them cuts Supabase DB egress by ~90% while
 * browsing without changing what renders.
 *
 * Two layers: an in-memory map (fastest, per-tab) backed by localStorage (per
 * browser, survives reloads). Community data (posts/comments) is NOT cached —
 * it must stay live. Admin writes call `bustContentCache()` so this browser
 * sees its own edits immediately; other browsers converge within the TTL.
 */

const PREFIX = 'cc.'
const DEFAULT_TTL_MS = 15 * 60 * 1000 // 15 minutes

interface Entry<T> {
  at: number
  value: T
}

const memory = new Map<string, Entry<unknown>>()

function readStore<T>(key: string): Entry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as Entry<T>) : null
  } catch {
    return null
  }
}

function writeStore<T>(key: string, entry: Entry<T>) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* storage full / unavailable — memory layer still works */
  }
}

/**
 * Run `fetcher` at most once per TTL for `key`; otherwise return the cached
 * value. On fetch failure a stale cached value (any age) is returned before
 * the error propagates — same fail-soft spirit as the rest of the data layer.
 */
export async function cachedQuery<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const now = Date.now()
  const mem = memory.get(key) as Entry<T> | undefined
  if (mem && now - mem.at < ttlMs) return mem.value
  const stored = readStore<T>(key)
  if (stored && now - stored.at < ttlMs) {
    memory.set(key, stored)
    return stored.value
  }
  try {
    const value = await fetcher()
    const entry: Entry<T> = { at: now, value }
    memory.set(key, entry)
    writeStore(key, entry)
    return value
  } catch (err) {
    const stale = mem ?? stored
    if (stale) return stale.value // offline / quota errors → last known content
    throw err
  }
}

/** Drop cached entries (all, or only keys starting with `prefix`). */
export function bustContentCache(prefix = '') {
  for (const key of Array.from(memory.keys())) {
    if (key.startsWith(prefix)) memory.delete(key)
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX + prefix)) localStorage.removeItem(k)
    }
  } catch {
    /* ignore */
  }
}

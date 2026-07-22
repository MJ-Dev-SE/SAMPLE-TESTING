import { useEffect, useRef, useState } from 'react'

const PREFIX = 'mt-draft:'

/**
 * Auto-save a form's typed content to localStorage so it survives an accidental
 * close (clicking outside a modal), a navigation away, or a full page reload —
 * and reappears the next time the form mounts. Cleared explicitly on a
 * successful submit via the returned `clearDraft`.
 *
 * Scope: plain serializable fields only (text, selects, the address/contact
 * objects). Picked FILES are intentionally NOT persisted — browsers don't let a
 * page re-attach a file input for security reasons, so image picks always start
 * empty and the user re-selects them; everything they TYPED is what's restored.
 *
 * @param key       Stable per-form id (also namespaces the storage key).
 * @param snapshot  The current serializable state (rebuilt each render is fine).
 * @param restore   Called once on mount with a saved draft, to push it into state.
 * @param isEmpty   Optional "nothing worth keeping" test — when true the draft is
 *                  removed instead of written, so a pristine form leaves no trace
 *                  and clearing every field discards the draft.
 * @param enabled   Skip entirely (e.g. while auth/context is still resolving).
 */
export function useFormDraft<T>({
  key,
  snapshot,
  restore,
  isEmpty,
  enabled = true,
}: {
  key: string
  snapshot: T
  restore: (saved: T) => void
  isEmpty?: (snapshot: T) => boolean
  enabled?: boolean
}): { clearDraft: () => void } {
  const storageKey = PREFIX + key
  // A STATE gate (not a ref) so the first, pre-restore render — which still holds
  // the empty initial snapshot — never runs the save effect and clobbers a saved
  // draft. restore()'s setState and setHydrated(true) batch together, so by the
  // time `hydrated` is true the restored values are already in `snapshot`.
  const [hydrated, setHydrated] = useState(false)
  const lastWritten = useRef<string>('')

  useEffect(() => {
    if (!enabled) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        lastWritten.current = raw
        restore(JSON.parse(raw) as T)
      }
    } catch {
      /* malformed / unavailable storage — start clean */
    }
    setHydrated(true)
    // Restore is a one-time bootstrap; re-running on key change is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled])

  useEffect(() => {
    if (!enabled || !hydrated) return
    try {
      if (isEmpty?.(snapshot)) {
        if (lastWritten.current !== '') {
          localStorage.removeItem(storageKey)
          lastWritten.current = ''
        }
        return
      }
      const serialized = JSON.stringify(snapshot)
      if (serialized === lastWritten.current) return
      lastWritten.current = serialized
      localStorage.setItem(storageKey, serialized)
    } catch {
      /* quota / serialization — a lost draft is acceptable, a crash is not */
    }
  }, [snapshot, hydrated, enabled, storageKey, isEmpty])

  const clearDraft = () => {
    lastWritten.current = ''
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }

  return { clearDraft }
}

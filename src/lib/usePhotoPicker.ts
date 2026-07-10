import { useEffect, useRef, useState, type ChangeEvent } from 'react'

export interface PhotoPick {
  file: File
  /** Object URL for the preview thumbnail (revoked when the pick is dropped). */
  url: string
}

/**
 * Shared multi-photo picker state: picking again APPENDS to the selection,
 * each pick can be removed individually (✕), and preview object-URLs are
 * revoked when dropped / reset / unmounted. Used by every post composer.
 */
export function usePhotoPicker() {
  const [picks, setPicks] = useState<PhotoPick[]>([])

  const picksRef = useRef(picks)
  picksRef.current = picks
  useEffect(() => () => picksRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  /** <input type="file"> onChange — appends, then clears the input for re-picks. */
  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(e.target.files ?? []).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    if (next.length > 0) setPicks((prev) => [...prev, ...next])
    e.target.value = ''
  }

  /** ✕ on one thumbnail. */
  const removeAt = (i: number) => {
    const target = picksRef.current[i]
    if (target) URL.revokeObjectURL(target.url)
    setPicks((prev) => prev.filter((_, idx) => idx !== i))
  }

  /** Clear everything (after a successful submit). */
  const reset = () => {
    picksRef.current.forEach((p) => URL.revokeObjectURL(p.url))
    setPicks([])
  }

  return { picks, addFiles, removeAt, reset }
}

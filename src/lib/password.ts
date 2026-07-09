/**
 * Lightweight password-strength heuristic for the sign-up meter.
 * Returns a 0–4 score plus a label key (resolved via i18n) and a bar color.
 * Not a security control — Supabase enforces the real minimum; this is UX guidance.
 */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  labelKey: 'tooShort' | 'weak' | 'fair' | 'good' | 'strong'
  color: string
  /** Fraction of the meter to fill (0–1). */
  ratio: number
}

export function scorePassword(pw: string): PasswordStrength {
  if (!pw) return { score: 0, labelKey: 'tooShort', color: '#e4e5e9', ratio: 0 }

  let points = 0
  if (pw.length >= 6) points++
  if (pw.length >= 10) points++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++
  if (/\d/.test(pw)) points++
  if (/[^A-Za-z0-9]/.test(pw)) points++

  // Anything under Supabase's 6-char minimum is always "too short".
  if (pw.length < 6) return { score: 1, labelKey: 'tooShort', color: '#dc3146', ratio: 0.2 }

  const map: Record<number, PasswordStrength> = {
    1: { score: 1, labelKey: 'weak', color: '#dc3146', ratio: 0.25 },
    2: { score: 2, labelKey: 'fair', color: '#f97316', ratio: 0.5 },
    3: { score: 3, labelKey: 'good', color: '#0071ec', ratio: 0.75 },
    4: { score: 4, labelKey: 'strong', color: '#00883c', ratio: 1 },
  }
  return map[Math.min(4, Math.max(1, points))]
}

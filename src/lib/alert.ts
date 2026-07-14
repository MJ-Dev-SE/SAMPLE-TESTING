import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

/**
 * Themed SweetAlert2 wrappers so auth feedback matches the site's accent color.
 * Use `alertError` / `alertSuccess` for modals and `toast` for lightweight confirmations.
 */
const accent = '#0071ec' // accent-blue

export const alertError = (title: string, text?: string) =>
  Swal.fire({ icon: 'error', title, text, confirmButtonColor: accent })

export const alertSuccess = (title: string, text?: string) =>
  Swal.fire({ icon: 'success', title, text, confirmButtonColor: accent })

/**
 * Extract a human-readable message from anything thrown.
 * Supabase errors (PostgrestError / AuthError) are plain objects, not `Error`
 * instances, so `String(err)` would give "[object Object]". Dig out the useful bits.
 */
export function errText(err: unknown): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  const e = err as Record<string, unknown>
  const msg = (e.message || e.error_description || e.details || e.hint) as string | undefined
  const code = e.code ? ` (${e.code})` : ''
  return msg ? `${msg}${code}` : JSON.stringify(e)
}

/** Danger confirm dialog — resolves true only if the user confirms. */
export const alertConfirm = async (
  title: string,
  text: string,
  confirmText: string,
  cancelText: string,
): Promise<boolean> =>
  (
    await Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#d33',
      cancelButtonColor: accent,
    })
  ).isConfirmed

/**
 * "You need to log in" prompt shown before a protected action a logged-out
 * visitor just attempted (starting a chat, sending a message, etc — see
 * lib/chat.ts / components/ChatButton.tsx). Resolves true only if they chose
 * to log in; the caller is responsible for navigating to /user/login with
 * `state: { from: location }` so Login.tsx can send them back afterward.
 */
export const requireLogin = async (
  title: string,
  text: string,
  confirmText: string,
  cancelText: string,
): Promise<boolean> =>
  (
    await Swal.fire({
      icon: 'info',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: accent,
      cancelButtonColor: '#8a8072',
    })
  ).isConfirmed

/** Small top-right toast that auto-dismisses (used after login/sign-up). */
export const toast = (title: string, icon: 'success' | 'info' = 'success') =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  })

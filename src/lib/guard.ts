/**
 * guard.ts — TEMPORARY client-side access deterrent.
 *
 * Raises the friction of casually reading page data through the browser:
 *   - right-click / context menu
 *   - DevTools keyboard shortcuts (F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U)
 *   - text selection + copy/cut of page content
 *   - console output (silenced so mock data isn't dumped to the console)
 *
 * IMPORTANT — this is a DETERRENT, not security. Everything a browser renders
 * is ultimately reachable by a determined user (view-source, network tab,
 * disabling JS, a saved copy). Never treat this as protection for real secrets;
 * anything that must stay private belongs on a server the client can't read.
 *
 * It is intentionally NON-INTRUSIVE to real usage: forms, inputs, buttons,
 * links, scrolling and the language switcher all keep working. Only inspection
 * affordances are blocked. Enabled in production builds only (see main.tsx),
 * so the dev workflow is never affected.
 */

/** Allow normal selection/typing inside real form fields. */
function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

let installed = false

export function installAccessGuard(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  // 1) Block the right-click context menu.
  window.addEventListener(
    'contextmenu',
    (e) => {
      e.preventDefault()
    },
    { capture: true },
  )

  // 2) Block DevTools / view-source keyboard shortcuts.
  window.addEventListener(
    'keydown',
    (e) => {
      const key = e.key.toLowerCase()
      const ctrlOrCmd = e.ctrlKey || e.metaKey

      // F12 — open DevTools
      const isF12 = e.key === 'F12'
      // Ctrl/Cmd+Shift+I / J / C — DevTools panels & inspector
      const isInspect =
        ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')
      // Ctrl/Cmd+U — view source
      const isViewSource = ctrlOrCmd && key === 'u'
      // Ctrl/Cmd+S — save page (pull full HTML). Leave editable fields alone.
      const isSavePage = ctrlOrCmd && key === 's' && !isEditable(e.target)

      if (isF12 || isInspect || isViewSource || isSavePage) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    { capture: true },
  )

  // 3) Deter selecting + copying page content, but keep form fields usable.
  const blockIfNotEditable = (e: Event) => {
    if (!isEditable(e.target)) e.preventDefault()
  }
  window.addEventListener('selectstart', blockIfNotEditable, { capture: true })
  window.addEventListener('copy', blockIfNotEditable, { capture: true })
  window.addEventListener('cut', blockIfNotEditable, { capture: true })
  // Deter drag-saving of images/text.
  window.addEventListener('dragstart', blockIfNotEditable, { capture: true })

  // 4) Silence the console so data/logs aren't dumped there.
  silenceConsole()
}

function silenceConsole(): void {
  const noop = () => {}
  const methods: (keyof Console)[] = [
    'log',
    'info',
    'debug',
    'warn',
    'error',
    'table',
    'dir',
    'trace',
    'group',
    'groupCollapsed',
    'groupEnd',
    'count',
    'time',
    'timeEnd',
  ]
  for (const m of methods) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(console as any)[m] = noop
    } catch {
      /* some consoles are read-only; ignore */
    }
  }
}

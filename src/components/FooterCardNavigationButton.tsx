import Tooltip from './Tooltip'

/**
 * The ">" control that cycles the mobile footer's single rotating card to the
 * next group. `nextLabel` describes the NEXT group ("Show Links" / "Show
 * Policies" / "Show Advertisements") and is used for BOTH the visible tooltip
 * and the screen-reader `aria-label`, so the action is never conveyed by the
 * ">" glyph alone. Keyboard-focusable (native button).
 */
export default function FooterCardNavigationButton({
  nextLabel,
  onClick,
}: {
  nextLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={nextLabel}
      title={nextLabel}
      className="group relative shrink-0 h-9 w-9 grid place-items-center rounded-full border border-neutral-90 bg-white text-muted hover:border-accent-blue hover:text-accent-blue transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
    >
      <i className="fa-solid fa-chevron-right text-sm" aria-hidden="true" />
      <Tooltip label={nextLabel} position="top" />
    </button>
  )
}

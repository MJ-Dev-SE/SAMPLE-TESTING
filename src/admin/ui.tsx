/**
 * Shared Flux design tokens (beige palette) + tiny building blocks for the
 * /admin console. Class fragments live here so every admin panel file uses the
 * exact same look; Tailwind JIT scans these strings.
 */
export const INK = 'text-[#3f382f]'
export const MUTED = 'text-[#8a8072]'
export const CARD =
  'bg-white rounded-[18px] border border-[#e7ddca] shadow-[0_1px_3px_0_rgba(107,90,60,0.07),0_8px_24px_0_rgba(107,90,60,0.09)] transition-shadow duration-200 hover:shadow-[0_2px_6px_0_rgba(107,90,60,0.11),0_16px_36px_0_rgba(107,90,60,0.14)]'
export const HERO =
  'relative overflow-hidden rounded-[22px] p-8 text-white bg-gradient-to-br from-[#a98c5a] via-[#a98c5a]/90 to-[#6b5a3c]'
export const PRIMARY_BTN =
  'inline-flex items-center gap-1.5 h-8 px-4 rounded-[18px] bg-gradient-to-r from-[#a98c5a] to-[#6b5a3c] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60'
export const GHOST_BTN =
  'inline-flex items-center gap-1.5 h-8 px-4 rounded-[18px] border border-[#e7ddca] bg-white text-xs font-medium text-[#8a8072] hover:text-[#a98c5a] hover:bg-[#efe7d5] transition-colors disabled:opacity-60'
export const BADGE =
  'inline-flex items-center rounded-xl bg-[#a98c5a]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#a98c5a]'
export const AVATAR = 'bg-gradient-to-br from-[#a98c5a] to-[#6b5a3c]'

export const shortDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'

/** Glassmorphism KPI stat card inside the gradient hero (white/10 + backdrop blur). */
export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white/10 backdrop-blur-[8px] p-4 hover:bg-white/15 transition-colors">
      <div className="text-[11px] font-medium text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white truncate">{value}</div>
    </div>
  )
}

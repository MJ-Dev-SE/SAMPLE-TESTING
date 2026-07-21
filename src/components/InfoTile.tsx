import type { ReactNode } from 'react'

/** One fact tile: icon chip + label over value, so long values never fight a label column. */
export default function InfoTile({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-m bg-neutral-97 px-3 py-2.5">
      <span className="w-8 h-8 shrink-0 grid place-items-center rounded-m bg-white border border-neutral-90 text-accent-blue">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.5px] text-subtlest">{label}</dt>
        <dd className="text-sm font-medium text-text-normal break-words">{value}</dd>
      </div>
    </div>
  )
}

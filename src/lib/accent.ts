import type { AccentColor } from '../types'

// Accent pairs (chip bg / icon color) → Tailwind class pairs.
export const accentClass: Record<AccentColor, string> = {
  blue: 'bg-chip-blue text-accent-blue',
  green: 'bg-chip-green text-accent-green',
  indigo: 'bg-chip-indigo text-accent-indigo',
  pink: 'bg-chip-pink text-accent-pink',
  purple: 'bg-chip-purple text-accent-purple',
  teal: 'bg-chip-teal text-accent-teal',
  neutral: 'bg-transparent text-text-normal',
}

import type { Config } from 'tailwindcss'

/**
 * PhilGo design-token system.
 * Mirrors the WebAwesome (--wa-*) token set described in the spec.
 * Keep every value pixel-exact.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Spacing scale: xs..2xl
      spacing: {
        xs: '0.5rem', // 8px
        s: '0.75rem', // 12px
        m: '1rem', // 16px
        l: '1.5rem', // 24px
        xl: '2rem', // 32px
        '2xl': '2.5rem', // 40px
      },
      borderRadius: {
        m: '0.375rem', // 6px
        l: '0.75rem', // 12px
      },
      colors: {
        page: '#ffffff',
        'text-normal': '#1b1d26',
        body: '#212529',
        muted: '#6b7280', // labels (subtler gray)
        subtler: '#6b7280',
        subtlest: '#9aa0a6', // descriptions (lightest gray)
        'neutral-90': '#e4e5e9', // border
        'neutral-95': '#f1f2f3', // section-header bg
        'neutral-97': '#f7f7f8', // row hover bg
        link: '#0053c0',
        'accent-blue': '#0071ec',
        'chip-blue': '#e8f3ff',
        'accent-green': '#00883c',
        'chip-green': '#e3f9e3',
        'accent-indigo': '#6163f2',
        'chip-indigo': '#f0f2ff',
        'accent-pink': '#dc3146',
        'chip-pink': '#fff0ef',
        'accent-purple': '#9951db',
        'chip-purple': '#f7f0ff',
        'accent-teal': '#078098',
        'chip-teal': '#e3f6fb',
        // PhilGo category bar
        maroon: '#7f1d1d',
        'maroon-nav': '#fcecec',
      },
      fontFamily: {
        sans: ['system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      },
      maxWidth: {
        content: '1010px', // 3-column shell width (matches live philgo.com ~1012px)
      },
      boxShadow: {
        card: '0 6px 16px rgba(0,0,0,.08)',
        'card-blue': '0 8px 18px rgba(33,37,41,.08)',
      },
      // Cheap CSS-only entrance transitions for modals/panels that mount on
      // click (no JS animation library) — see BusinessModal.tsx.
      keyframes: {
        'overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'overlay-in': 'overlay-in 150ms ease-out',
        'modal-in': 'modal-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config

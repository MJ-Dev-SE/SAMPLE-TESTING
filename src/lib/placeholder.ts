// Lightweight inline SVG placeholders so the mockup renders with no external assets.
// Real data later replaces these URLs in the DATA SLOT modules only.

export function placeholderImg(
  w: number,
  h: number,
  label = '',
  bg = '#e4e5e9',
  fg = '#9aa0a6',
): string {
  const text = label || `${w}x${h}`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <rect width='100%' height='100%' fill='${bg}'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='system-ui,sans-serif' font-size='${Math.max(11, Math.round(Math.min(w, h) / 8))}'
      fill='${fg}'>${text}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function avatar(seed: string): string {
  const colors = ['#0071ec', '#00883c', '#6163f2', '#dc3146', '#9951db', '#078098']
  const c = colors[seed.charCodeAt(0) % colors.length]
  const letter = seed.charAt(0).toUpperCase()
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
    <rect width='100%' height='100%' rx='20' fill='${c}'/>
    <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle'
      font-family='system-ui,sans-serif' font-size='18' fill='#fff'>${letter}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

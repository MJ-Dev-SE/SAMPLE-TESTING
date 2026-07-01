import { Link } from 'react-router-dom'

/** PhilGo wordmark: geometric triangle glyph + "PHIL" (gray) "GO" (orange). */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="PhilGo home">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <polygon points="17,3 7,28 17,22" fill="#0071ec" />
        <polygon points="17,3 27,28 17,22" fill="#078098" />
        <polygon points="7,28 27,28 17,22" fill="#f97316" />
      </svg>
      <span className="text-[28px] font-extrabold tracking-tight leading-none">
        <span className="text-[#5b6068]">PHIL</span>
        <span className="text-[#f15a24]">GO</span>
      </span>
    </Link>
  )
}

import { Link } from 'react-router-dom'

/**
 * Brand logo image. Drop the artwork at `public/brand-logo.png` (wide/horizontal logo).
 * Used in BOTH the header and the footer. Adjust the height via `className` (e.g. h-[64px]).
 */
export default function Logo({ className = 'h-[56px]' }: { className?: string }) {
  return (
    <Link to="/" className="inline-flex items-center" aria-label="Home">
      <img src="/brand-logo.png" alt="" className={`w-auto max-w-full ${className}`} />
    </Link>
  )
}

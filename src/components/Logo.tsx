import { Link } from 'react-router-dom'

/** 88 Hotspring Resort wordmark: 4-square activity mark + bilingual name. */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="88 Hotspring Resort home">
      <img src="/logo-mark.jpg" alt="" className="h-[46px] w-auto" />
      <span className="flex flex-col leading-none gap-1">
        <span className="text-[26px] font-extrabold tracking-tight leading-none">
          <span className="text-[#e02128]">88温泉</span>
          <span className="text-[#1c3f94]">리조트</span>
        </span>
        <span className="text-[13px] font-bold text-[#1c3f94] tracking-wider leading-none">
          88HOTSPRING RESORT
        </span>
      </span>
    </Link>
  )
}

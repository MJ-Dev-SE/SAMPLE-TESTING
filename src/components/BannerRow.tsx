import type { Banner } from '../types'

/** Reusable banner-ad row. Wraps on smaller screens. */
export default function BannerRow({ banners, className = '' }: { banners: Banner[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-s ${className}`}>
      {banners.map((b, i) => (
        <a key={i} href={b.href} className="flex-1 min-w-[160px] block">
          <img
            src={b.imageUrl}
            alt={b.alt}
            className="w-full rounded-m border border-neutral-90 object-cover"
          />
        </a>
      ))}
    </div>
  )
}

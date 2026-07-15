import { SITE_NAME, SITE_URL } from '../../config/site'
import { canonicalUrl, absoluteImageUrl } from './url'

/**
 * JSON-LD BUILDERS (schema.org). Each returns a plain object for <Seo jsonLd={…}>.
 * Only ever emit facts we actually have — every optional field is skipped when
 * absent, and nothing here fabricates ratings, reviews, prices or addresses.
 */

type JsonLd = Record<string, unknown>

/** Drop undefined/null/empty-string fields so the emitted JSON stays honest. */
function compact(obj: JsonLd): JsonLd {
  const out: JsonLd = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out
}

/** WebSite — home page only. */
export function websiteLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: ['en', 'ko'],
  }
}

/** Organization — the site operator (home page). */
export function organizationLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: canonicalUrl('/logo.png'),
  }
}

export interface CrumbItem {
  label: string
  /** Site-relative path; the last crumb may omit it (current page). */
  href?: string
}

/** BreadcrumbList — emitted alongside the visible Breadcrumbs component. */
export function breadcrumbLd(items: CrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) =>
      compact({
        '@type': 'ListItem',
        position: i + 1,
        name: item.label,
        item: item.href ? canonicalUrl(item.href) : undefined,
      }),
    ),
  }
}

export interface ArticleLdInput {
  headline: string
  description?: string
  /** Media path or absolute URL — resolved to an absolute URL. */
  image?: string | null
  url: string
  datePublished?: string
  dateModified?: string
  authorName?: string
  isNews?: boolean
}

/** Article / NewsArticle — post detail and news article pages. */
export function articleLd(a: ArticleLdInput): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': a.isNews ? 'NewsArticle' : 'Article',
    headline: a.headline,
    description: a.description,
    image: a.image ? [absoluteImageUrl(a.image)] : undefined,
    url: canonicalUrl(a.url),
    mainEntityOfPage: canonicalUrl(a.url),
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    author: a.authorName ? { '@type': 'Person', name: a.authorName } : undefined,
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: canonicalUrl('/logo.png') } },
  })
}

export interface LocalBusinessLdInput {
  name: string
  description?: string
  image?: string | null
  url: string
  telephone?: string | null
  /** Free-text street address, if the record has one. */
  streetAddress?: string | null
  /** Region/city label (e.g. "Manila", "Angeles"). */
  addressLocality?: string | null
}

/** LocalBusiness — business-directory profile pages. Address/phone only when real. */
export function localBusinessLd(b: LocalBusinessLdInput): JsonLd {
  const hasAddress = !!(b.streetAddress || b.addressLocality)
  return compact({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    description: b.description,
    image: b.image ? absoluteImageUrl(b.image) : undefined,
    url: canonicalUrl(b.url),
    telephone: b.telephone ?? undefined,
    address: hasAddress
      ? compact({
          '@type': 'PostalAddress',
          streetAddress: b.streetAddress ?? undefined,
          addressLocality: b.addressLocality ?? undefined,
          addressCountry: 'PH',
        })
      : undefined,
  })
}

export interface TouristAttractionLdInput {
  name: string
  description?: string
  image?: string | null
  url: string
}

/** TouristAttraction — resort/tour photo pages that describe a real place. */
export function touristAttractionLd(t: TouristAttractionLdInput): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: t.name,
    description: t.description,
    image: t.image ? absoluteImageUrl(t.image) : undefined,
    url: canonicalUrl(t.url),
  })
}

export interface PersonLdInput {
  name: string
  url: string
  image?: string | null
}

/** Person — public member profiles (only when the profile is public). */
export function personLd(p: PersonLdInput): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    url: canonicalUrl(p.url),
    image: p.image ? absoluteImageUrl(p.image) : undefined,
  })
}

import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  TWITTER_CARD,
} from '../../config/site'
import { absoluteImageUrl, canonicalUrl, localeUrl, stripLocalePrefix } from '../../lib/seo/url'
import { truncate } from '../../lib/seo/text'
import { useLocalized } from '../../lib/useLocalized'

export interface SeoProps {
  /** Page title WITHOUT the site name (it's appended automatically). */
  title?: string
  /** Meta description (plain text, already localized). */
  description?: string
  /**
   * Site-relative canonical path, e.g. "/business/manila-grand-hotel" or
   * "/post/list?post_id=freetalk". Defaults to the current pathname (query
   * string dropped, /en|/ko prefix stripped). Pass explicitly on any page
   * whose identity lives in the query string.
   */
  path?: string
  /** Absolute canonical override (rare — cross-domain canonicals). */
  canonical?: string
  /** Social image: media-bucket path, /public asset or absolute URL. */
  image?: string | null
  /** OpenGraph type. */
  type?: 'website' | 'article' | 'profile'
  /** noindex,nofollow — private/low-value pages. Auth stays the real protection. */
  noindex?: boolean
  /** One or more schema.org JSON-LD objects. */
  jsonLd?: object | object[]
  /** Article timestamps (ISO) — emitted as article:published_time/modified_time. */
  publishedTime?: string
  modifiedTime?: string
  /** Skip the en/ko hreflang alternates (pages excluded from locale prefixes). */
  noAlternates?: boolean
}

/**
 * Per-page head manager. Renders <title>, description, canonical, robots,
 * OpenGraph + Twitter cards, hreflang alternates and JSON-LD via
 * react-helmet-async. Every public route mounts exactly one <Seo>; deeper
 * mounts override shallower ones (App-level defaults lose to page values).
 */
export default function Seo({
  title,
  description,
  path,
  canonical,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
  publishedTime,
  modifiedTime,
  noAlternates = false,
}: SeoProps) {
  const location = useLocation()
  const { i18n } = useTranslation()
  const L = useLocalized()

  const relPath = path ?? stripLocalePrefix(location.pathname)
  const canonicalHref = canonical ?? canonicalUrl(relPath)
  // An absolute canonical override has no locale variants on this site.
  const skipAlternates = noAlternates || /^https?:\/\//i.test(relPath) || !!canonical
  const fullTitle = title ? truncate(`${title} | ${SITE_NAME}`, 70) : L(DEFAULT_TITLE)
  const desc = truncate(description || L(DEFAULT_DESCRIPTION), 300)
  const ogImage = absoluteImageUrl(image || DEFAULT_OG_IMAGE)
  const lang = i18n.resolvedLanguage === 'ko' ? 'ko' : 'en'
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonicalHref} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* hreflang alternates — the same page exists at /, /en/* and /ko/* */}
      {!noindex && !skipAlternates && <link rel="alternate" hrefLang="en" href={localeUrl(relPath, 'en')} />}
      {!noindex && !skipAlternates && <link rel="alternate" hrefLang="ko" href={localeUrl(relPath, 'ko')} />}
      {!noindex && !skipAlternates && <link rel="alternate" hrefLang="x-default" href={canonicalHref} />}

      {/* OpenGraph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalHref} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={lang === 'ko' ? 'ko_KR' : 'en_US'} />
      {type === 'article' && publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {type === 'article' && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content={TWITTER_CARD} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  )
}

import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import SmartImage from '../components/SmartImage'
import ArticleBody from '../components/ArticleBody'
import CommentsReviewsSection from '../components/comments/CommentsReviewsSection'
import AiAssistantButton from '../components/ai/AiAssistantButton'
import AiAssistantSection from '../components/ai/AiAssistantSection'
import { useAiAssistant } from '../components/ai/useAiAssistant'
import { NotFoundBody } from './NotFound'
import { getNewsArticle, newsArticlePath } from '../lib/content'
import { resolveSlugRedirect } from '../lib/slugRedirects'
import { metaDescription } from '../lib/seo/text'
import { articleLd } from '../lib/seo/structuredData'
import { useLocalized } from '../lib/useLocalized'
import type { NewsItemRec } from '../types'

/**
 * News / information article. Two URL shapes resolve here:
 *   /news/article/<slug>  — canonical path route (App.tsx)
 *   /news/view?slug=<slug> — legacy; still works, canonicalises to the path URL.
 * Used for both the News and Information tabs (`tab` distinguishes the kicker).
 */
export default function NewsArticleView() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { slug: pathSlug } = useParams()
  const [params] = useSearchParams()
  const slug = pathSlug ?? params.get('slug') ?? ''
  const [rec, setRec] = useState<NewsItemRec | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const ai = useAiAssistant('news', rec?.id ?? '')

  useEffect(() => {
    let alive = true
    setLoading(true)
    getNewsArticle(slug)
      .then(async (r) => {
        if (!alive) return
        if (!r && slug) {
          const next = await resolveSlugRedirect('news', slug)
          if (!alive) return
          if (next) return setRedirectTo(newsArticlePath(next))
        }
        setRec(r)
      })
      .catch(() => alive && setRec(null))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [slug])

  if (redirectTo) return <Navigate to={redirectTo} replace />
  if (loading) return <Layout><p className="text-sm text-subtlest p-l">…</p></Layout>
  if (!rec) {
    return (
      <Layout>
        <Seo title={t('notFound.title')} noindex />
        <NotFoundBody />
      </Layout>
    )
  }

  const isInfo = rec.tab === 'information'
  const hero = rec.image_url || rec.thumb_url
  const sectionLabel = isInfo ? t('content.typeInformation') : t('content.typeNews')
  const canonicalPath = rec.canonical_url || (rec.article_slug ? newsArticlePath(rec.article_slug) : `/news/view?slug=${encodeURIComponent(slug)}`)
  const description = metaDescription(rec.meta_description, L(rec.body), L(rec.title))

  return (
    <Layout>
      <Seo
        title={rec.meta_title || L(rec.title)}
        description={description}
        path={canonicalPath}
        image={rec.og_image_url || hero}
        type="article"
        modifiedTime={rec.updated_at}
        noindex={rec.is_indexable === false}
        jsonLd={articleLd({
          headline: L(rec.title),
          description,
          image: rec.og_image_url || hero,
          url: canonicalPath,
          dateModified: rec.updated_at,
          isNews: !isInfo,
        })}
      />
      <Breadcrumbs
        items={[
          { label: t('menuPage.breadcrumbHome'), href: '/' },
          { label: sectionLabel },
          { label: L(rec.title) },
        ]}
      />

      <article className="border border-neutral-90 rounded-l overflow-hidden">
        <div className="px-l pt-l">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isInfo ? 'bg-chip-purple text-accent-purple' : 'bg-chip-indigo text-accent-indigo'}`}>
              <i className={`fa-solid ${isInfo ? 'fa-circle-info' : 'fa-newspaper'}`} aria-hidden="true" />
              {sectionLabel}
            </span>
            <AiAssistantButton open={ai.open} onClick={ai.toggle} />
          </div>
          <h1 className="text-2xl font-bold text-text-normal mt-2 mb-3 leading-8">{L(rec.title)}</h1>
        </div>
        {hero && <SmartImage src={hero} alt={L(rec.title)} className="w-full" />}
        <div className="p-l">
          {L(rec.body) ? <ArticleBody text={L(rec.body)} /> : <p className="text-sm text-muted">{L(rec.title)}</p>}
        </div>
      </article>

      {rec.id && <AiAssistantSection ai={ai} />}

      {rec.id && (
        <CommentsReviewsSection
          contentType="news"
          contentId={rec.id}
          allowRating
          highlightedCommentId={params.get('comment')}
        />
      )}
    </Layout>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import Seo from '../components/seo/Seo'
import Breadcrumbs from '../components/seo/Breadcrumbs'
import { NotFoundBody } from './NotFound'
import { getCategoryBySlug, listCategories } from '../lib/content'
import { useLocalized } from '../lib/useLocalized'
import { metaDescription } from '../lib/seo/text'
import { STALE } from '../lib/queryClient'
import { listPostsByCategory, listPostsByParentCategory } from '../lib/posts'
import PostListItem from '../components/PostListItem'

const PAGE_SIZE = 20

/**
 * COMMUNITY CATEGORY LANDING PAGES — the maroon-bar tree on stable, crawlable
 * URLs: /information (parent → combined feed of all children) and
 * /information/weather (child → only its own posts). The legacy
 * /post/list?maroon=<slug> URLs 30x-style redirect here (see PostList.tsx).
 * Parent and child pages interlink both ways: parent shows child chips,
 * children breadcrumb back to the parent.
 */
export default function CategoryPage({ parentSlug }: { parentSlug: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const { childSlug } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || 1))
  const slug = childSlug ?? parentSlug

  // Resolve the parent + its children (children double as the chip row and the
  // parent feed's id list).
  const {
    data: tree,
    isLoading: resolving,
    isError: treeError,
  } = useQuery({
    queryKey: ['category-tree', parentSlug],
    queryFn: async () => {
      const [p, kids] = await Promise.all([
        getCategoryBySlug(parentSlug, 'community'),
        listCategories(parentSlug, 'community'),
      ])
      return { parent: p, children: kids }
    },
    staleTime: STALE.categories,
    gcTime: STALE.categories * 2,
  })
  const parent = treeError ? null : tree?.parent ?? null
  const children = tree?.children ?? []

  const child = childSlug ? children.find((c) => c.slug === childSlug) ?? null : null
  const category = childSlug ? child : parent ?? null

  // Load the feed once the category tree is resolved.
  const target = childSlug ? children.find((c) => c.slug === childSlug) : undefined
  const feedEnabled = !resolving && !!parent && (!childSlug || children.some((c) => c.slug === childSlug))
  const {
    data: feed,
    isLoading: loading,
    isError: error,
  } = useQuery({
    queryKey: ['category-posts', parentSlug, childSlug ?? null, page],
    queryFn: () =>
      target
        ? listPostsByCategory(target.id, { page, pageSize: PAGE_SIZE })
        : listPostsByParentCategory(children.map((c) => c.id), { page, pageSize: PAGE_SIZE }),
    enabled: feedEnabled,
    staleTime: STALE.postList,
    gcTime: STALE.postList * 2,
  })
  const posts = feed?.rows ?? []
  const total = feed?.total ?? 0

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (resolving) {
    return (
      <Layout>
        <p className="text-sm text-subtlest">…</p>
      </Layout>
    )
  }

  if (!category || !parent) {
    return (
      <Layout>
        <Seo title={t('notFound.title')} noindex />
        <NotFoundBody />
      </Layout>
    )
  }

  const isParent = !childSlug
  const basePath = isParent ? `/${parentSlug}` : `/${parentSlug}/${childSlug}`
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const writeHref = `/post/write?maroon=${slug}`
  const title = category.meta_title || (isParent ? L(category.name) : `${L(category.name)} — ${L(parent.name)}`)
  const description = metaDescription(
    category.meta_description,
    isParent
      ? `${L(category.name)} — ${children.map((c) => L(c.name)).join(', ')}. ${t('category.allChildren')}.`
      : `${L(parent.name)} › ${L(category.name)}`,
  )
  // Filter/pagination variants and empty categories stay out of the index;
  // the canonical always points at page 1 of the clean path.
  const noindex = category.is_indexable === false || page > 1 || (!loading && !error && total === 0)

  return (
    <Layout>
      <Seo
        title={title}
        description={description}
        path={basePath}
        image={category.og_image_url}
        noindex={noindex}
      />
      <Breadcrumbs
        items={[
          { label: t('menuPage.breadcrumbHome'), href: '/' },
          ...(isParent
            ? [{ label: L(category.name) }]
            : [{ label: L(parent.name), href: `/${parentSlug}` }, { label: L(category.name) }]),
        ]}
      />

      <div className="flex items-center justify-between gap-3 mb-s">
        <h1 className="text-xl font-bold text-text-normal min-w-0 flex items-center gap-2">
          {category.icon && <i className={`fa-solid ${category.icon} text-accent-blue`} aria-hidden="true" />}
          {L(category.name)}
          {isParent && <span className="ml-1 text-sm font-normal text-muted">· {t('category.allChildren')}</span>}
        </h1>
        <Link
          to={writeHref}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-4 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
        >
          <i className="fa-solid fa-pen" />
          {t('post.write')}
        </Link>
      </div>

      {/* Parent ↔ child links: "all" chip + one chip per child category. */}
      {children.length > 0 && (
        <nav className="flex flex-wrap gap-1.5 mb-l" aria-label={t('category.subcategories')}>
          <Link
            to={`/${parentSlug}`}
            className={`px-2.5 py-1 text-xs border rounded-full transition-colors ${
              isParent ? 'border-accent-blue bg-chip-blue text-accent-blue font-semibold' : 'border-neutral-90 text-muted hover:bg-neutral-97 hover:text-accent-blue'
            }`}
          >
            {t('category.viewAll')}
          </Link>
          {children.map((c) => (
            <Link
              key={c.id}
              to={`/${parentSlug}/${c.slug}`}
              className={`px-2.5 py-1 text-xs border rounded-full transition-colors inline-flex items-center gap-1 ${
                c.slug === childSlug ? 'border-accent-blue bg-chip-blue text-accent-blue font-semibold' : 'border-neutral-90 text-muted hover:bg-neutral-97 hover:text-accent-blue'
              }`}
            >
              {c.icon && <i className={`fa-solid ${c.icon}`} aria-hidden="true" />}
              {L(c.name)}
            </Link>
          ))}
        </nav>
      )}

      {loading ? (
        <p className="text-sm text-subtlest">…</p>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-neutral-90 rounded-l p-l text-center">
          <p className="text-sm text-subtlest mb-3">{error ? t('content.notFound') : t('category.empty')}</p>
          <Link to={writeHref} className="text-sm text-link font-medium hover:underline">
            <i className="fa-solid fa-pen mr-1" />
            {t('post.write')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="border border-neutral-90 rounded-l overflow-hidden">
            {posts.map((p) => (
              <PostListItem
                key={p.id}
                post={p}
                categoryChip={
                  isParent && p.category_row ? (
                    <span className="mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-full bg-chip-blue px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">
                      {p.category_row.icon && <i className={`fa-solid ${p.category_row.icon}`} aria-hidden="true" />}
                      {L(p.category_row.name)}
                    </span>
                  ) : undefined
                }
              />
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </Layout>
  )
}

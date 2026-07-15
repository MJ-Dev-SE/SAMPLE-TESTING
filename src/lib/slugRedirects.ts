import { supabase } from './supabase'

/**
 * Old-slug → new-slug lookups against public.slug_redirects (supabase/seo.sql).
 * When a slug is renamed, the DB trigger logs the old one here; detail pages
 * that miss on the primary slug lookup consult this map and client-redirect
 * (Navigate replace) to the new URL, so published links never die.
 */
export type SlugEntity = 'post' | 'business' | 'news'

export async function resolveSlugRedirect(entity: SlugEntity, oldSlug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('slug_redirects')
    .select('new_slug')
    .eq('entity', entity)
    .eq('old_slug', oldSlug)
    .maybeSingle()
  if (error) return null // fail soft — the caller just shows its not-found state
  return (data?.new_slug as string | undefined) ?? null
}

import { supabase } from './supabase'

/** The single public Storage bucket that holds all uploaded media. */
export const MEDIA_BUCKET = 'media'

/**
 * Resolve a stored image reference to a browser-loadable URL.
 * Content rows store paths RELATIVE to the `media` bucket (e.g. "photos/banner/x.jpg")
 * so they aren't tied to a project domain. Anything already absolute (http/https/data:)
 * or empty is returned unchanged.
 */
export function publicUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return ''
  if (/^(https?:|data:|blob:|\/)/.test(pathOrUrl)) return pathOrUrl // absolute or site-relative (/public asset)
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(pathOrUrl).data.publicUrl
}

/**
 * A resized/optimized image URL via Supabase's image transform (render/image endpoint).
 * The originals are multi-MB; requesting `width`/`quality` serves a tiny derivative for
 * banners, thumbnails and ads. SVGs and data/blob URLs pass through unchanged.
 */
export function imageUrl(
  pathOrUrl: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number } = {},
): string {
  if (!pathOrUrl) return ''
  if (/^(data:|blob:|\/)/.test(pathOrUrl)) return pathOrUrl // data/blob or site-relative /public asset
  if (/\.svg($|\?)/i.test(pathOrUrl)) return publicUrl(pathOrUrl) // vector — nothing to resize

  const { width, height, quality = 72 } = opts

  // Absolute Supabase public URL → swap to the render/image endpoint + query params.
  if (/^https?:/.test(pathOrUrl)) {
    if (pathOrUrl.includes('/storage/v1/object/public/')) {
      const base = pathOrUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      const qs = new URLSearchParams()
      if (width) qs.set('width', String(width))
      if (height) qs.set('height', String(height))
      qs.set('quality', String(quality))
      return `${base}?${qs.toString()}`
    }
    return pathOrUrl // some other external URL — leave it
  }

  // Relative storage path → let supabase-js build the transform URL.
  const transform: { width?: number; height?: number; quality: number } = { quality }
  if (width) transform.width = width
  if (height) transform.height = height
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(pathOrUrl, { transform }).data.publicUrl
}

/**
 * Upload a file into media/<folder>/<uniqueName> and return its RELATIVE path
 * (store this in the DB; render it through publicUrl). Requires a logged-in user
 * (Storage insert policy is `authenticated`).
 */
export async function uploadToMedia(folder: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const rand = Math.random().toString(36).slice(2, 10)
  const path = `${folder}/${Date.now()}-${rand}.${ext}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw error
  return path
}

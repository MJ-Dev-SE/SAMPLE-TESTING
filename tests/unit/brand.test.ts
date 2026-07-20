import { describe, expect, it } from 'vitest'
import { activeBrand, BRANDS, resolveBrand } from '../../src/config/brand'

describe('resolveBrand (hostname → brand)', () => {
  it('maps manilatour.com to the default brand', () => {
    expect(resolveBrand('manilatour.com').id).toBe('manilatour')
  })

  it('tolerates www. and uppercase', () => {
    expect(resolveBrand('www.manilatour.com').id).toBe('manilatour')
    expect(resolveBrand('WWW.HANIN.TV').id).toBe('hanin')
  })

  it('maps hanin.tv (and its local preview host) to the hanin brand', () => {
    expect(resolveBrand('hanin.tv').id).toBe('hanin')
    expect(resolveBrand('hanin.localhost').id).toBe('hanin')
  })

  it('falls back to the default brand for unknown hosts (localhost, previews, IPs)', () => {
    expect(resolveBrand('localhost').id).toBe('manilatour')
    expect(resolveBrand('127.0.0.1').id).toBe('manilatour')
    expect(resolveBrand('preview-abc123.vercel.app').id).toBe('manilatour')
    expect(resolveBrand('').id).toBe('manilatour')
  })
})

describe('manilatour output-preservation invariants', () => {
  // These pin the exact literals the site shipped with BEFORE per-hostname
  // branding existed — if any fails, manilatour.com's output changed.
  const base = BRANDS[0]

  it('default brand is manilatour with the pre-refactor identity values', () => {
    expect(base.id).toBe('manilatour')
    expect(base.siteName).toBe('Manila Tour')
    expect(base.logo.src).toBe('/brand-logo.png')
    expect(base.logo.alt).toBe('Manila Tour')
    expect(base.logo.homeAriaLabel).toBe('Manila Tour — Home')
    expect(base.ogImage).toBe('/logo.png')
  })

  it('default brand leaves index.html favicon/title and ad positions untouched', () => {
    expect(base.favicon).toBeNull()
    expect(base.documentTitle).toBeNull()
    expect(base.adPrefix).toBe('')
    expect(base.brandedAdPositions).toEqual([]) // every slot = the shared base inventory
    expect(base.siteUrl).toBeNull() // VITE_SITE_URL env still decides
  })

  it('jsdom (localhost) resolves to the default brand', () => {
    expect(activeBrand.id).toBe('manilatour')
  })
})

describe('hanin brand shape', () => {
  const hanin = resolveBrand('hanin.tv')

  it('scopes ONLY the header slots to its own inventory — wings and the rest stay shared', () => {
    expect(hanin.adPrefix).toBe('hanin:')
    expect(hanin.adPrefix).not.toBe(BRANDS[0].adPrefix)
    expect(hanin.brandedAdPositions).toEqual(['header'])
    expect(hanin.brandedAdPositions).not.toContain('wing-left')
    expect(hanin.brandedAdPositions).not.toContain('wing-right')
  })

  it('owns its canonical origin', () => {
    expect(hanin.siteUrl).toBe('https://hanin.tv')
  })
})

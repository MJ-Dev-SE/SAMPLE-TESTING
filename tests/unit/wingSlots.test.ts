import { describe, expect, it } from 'vitest'
import { groupIntoSlots } from '../../src/components/WingBanners'
import type { AdvertisementRec } from '../../src/types'

function ad(id: string): AdvertisementRec {
  return {
    id,
    title: { en: id, ko: id },
    description: { en: '', ko: '' },
    body: { en: '', ko: '' },
    image_url: `/${id}.jpg`,
    url: null,
    position: 'wing-left',
    sort: 0,
    active: true,
    start_date: null,
    end_date: null,
  }
}

describe('groupIntoSlots (wing crossfade round-robin)', () => {
  it('puts each base creative in its own slot when there are no extras', () => {
    const ads = ['a', 'b', 'c', 'd'].map(ad)
    const slots = groupIntoSlots(ads, 4)
    expect(slots).toHaveLength(4)
    expect(slots.map((s) => s.map((x) => x.id))).toEqual([['a'], ['b'], ['c'], ['d']])
  })

  it('assigns extras round-robin, in sort order, so slot 1 gets extra 1, slot 2 gets extra 2, etc.', () => {
    // 4 base + 2 extras ("e1", "e2") — matches how AdSlotsPanel appends extras
    // after the base count, in the order they're added (sort ascending).
    const ads = ['a', 'b', 'c', 'd', 'e1', 'e2'].map(ad)
    const slots = groupIntoSlots(ads, 4)
    expect(slots.map((s) => s.map((x) => x.id))).toEqual([
      ['a', 'e1'], // slot 1: base + 1st extra
      ['b', 'e2'], // slot 2: base + 2nd extra
      ['c'], // slot 3: base only
      ['d'], // slot 4: base only
    ])
  })

  it('a slot with 2+ creatives is exactly what the crossfade condition checks for', () => {
    const ads = ['a', 'b', 'c', 'd', 'e1', 'e2', 'e3', 'e4', 'e5'].map(ad)
    const slots = groupIntoSlots(ads, 4)
    // slot 1 (index 0) now has a, e1, e5 — three creatives, crossfades through all three
    expect(slots[0].map((x) => x.id)).toEqual(['a', 'e1', 'e5'])
    expect(slots[0].length).toBeGreaterThan(1)
  })

  it('wraps extras past the count back to the first slot, preserving rotation order', () => {
    const ads = ['a', 'b', 'e1', 'e2', 'e3'].map(ad)
    const slots = groupIntoSlots(ads, 2)
    expect(slots.map((s) => s.map((x) => x.id))).toEqual([
      ['a', 'e1', 'e3'],
      ['b', 'e2'],
    ])
  })

  it('handles fewer creatives than slots — trailing slots are simply empty', () => {
    const ads = ['a', 'b'].map(ad)
    const slots = groupIntoSlots(ads, 4)
    expect(slots.map((s) => s.length)).toEqual([1, 1, 0, 0])
  })

  it('handles zero creatives', () => {
    expect(groupIntoSlots([], 4)).toEqual([[], [], [], []])
  })
})

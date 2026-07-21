import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DIAL_COUNTRY,
  DIAL_COUNTRIES,
  flagEmoji,
  joinDial,
  splitDial,
} from '../../src/lib/dialCodes'

describe('flagEmoji', () => {
  it('maps an ISO code to its regional-indicator flag', () => {
    expect(flagEmoji('PH')).toBe('🇵🇭')
    expect(flagEmoji('KR')).toBe('🇰🇷')
  })

  it('is case-insensitive', () => {
    expect(flagEmoji('ph')).toBe(flagEmoji('PH'))
  })
})

describe('splitDial (stored value → picker state)', () => {
  it('defaults a blank value to the Philippines', () => {
    const { country, national } = splitDial('')
    expect(country.dial).toBe('+63')
    expect(country).toBe(DEFAULT_DIAL_COUNTRY)
    expect(national).toBe('')
  })

  it('recognises the country from the dial prefix', () => {
    expect(splitDial('+82 10 1234 5678')).toEqual({
      country: DIAL_COUNTRIES.find((c) => c.iso === 'KR'),
      national: '10 1234 5678',
    })
  })

  // The bug this guards: "+1" is a prefix of nothing here, but "+6" cases like
  // +63/+65/+64 and +8/+81/+82/+86 overlap — the LONGEST match must win.
  it('prefers the longest matching dial code', () => {
    expect(splitDial('+63 917 000 1111').country.iso).toBe('PH')
    expect(splitDial('+65 8123 4567').country.iso).toBe('SG')
    expect(splitDial('+81 90 1234 5678').country.iso).toBe('JP')
    expect(splitDial('+886 912 345 678').country.iso).toBe('TW')
  })

  it('keeps an unrecognised or local number intact under the default country', () => {
    expect(splitDial('0917 123 4567')).toEqual({ country: DEFAULT_DIAL_COUNTRY, national: '0917 123 4567' })
    expect(splitDial('+999 55 44').national).toBe('+999 55 44')
  })
})

describe('joinDial (picker state → stored value)', () => {
  it('prefixes the dial code', () => {
    expect(joinDial(DEFAULT_DIAL_COUNTRY, '917 123 4567')).toBe('+63 917 123 4567')
  })

  it('stores nothing when no number was typed — the field is optional', () => {
    expect(joinDial(DEFAULT_DIAL_COUNTRY, '')).toBe('')
    expect(joinDial(DEFAULT_DIAL_COUNTRY, '   ')).toBe('')
  })

  it('round-trips through splitDial', () => {
    for (const country of DIAL_COUNTRIES) {
      const stored = joinDial(country, '123 4567')
      const back = splitDial(stored)
      expect(back.national).toBe('123 4567')
      expect(back.country.dial).toBe(country.dial)
    }
  })
})

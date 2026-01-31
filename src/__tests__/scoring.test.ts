import { describe, it, expect } from 'vitest'
import { KEY_GROUPS, ALL_KEYS } from '../lib/keys'
import {
  createKeyProfile,
  recordKeyPress,
  computeWeaknessScore,
  rankWeaknesses,
} from '../lib/scoring'

describe('KEY_GROUPS', () => {
  it('contains home row, top row, bottom row, numbers, and python symbols', () => {
    expect(KEY_GROUPS).toHaveProperty('homeRow')
    expect(KEY_GROUPS).toHaveProperty('topRow')
    expect(KEY_GROUPS).toHaveProperty('bottomRow')
    expect(KEY_GROUPS).toHaveProperty('numbers')
    expect(KEY_GROUPS).toHaveProperty('pythonSymbols')
  })

  it('python symbols include core symbols', () => {
    const symbols = KEY_GROUPS.pythonSymbols
    for (const s of ['(', ')', '[', ']', '{', '}', ':', '=', '_', '#', '@', '.', ',']) {
      expect(symbols).toContain(s)
    }
  })

  it('ALL_KEYS is a flat deduplicated list of all keys', () => {
    expect(ALL_KEYS.length).toBeGreaterThan(0)
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length)
  })
})

describe('createKeyProfile', () => {
  it('creates a profile with zero attempts and no history', () => {
    const profile = createKeyProfile('a')
    expect(profile.key).toBe('a')
    expect(profile.totalAttempts).toBe(0)
    expect(profile.correctAttempts).toBe(0)
    expect(profile.averageTimeMs).toBe(0)
    expect(profile.history).toEqual([])
  })
})

describe('recordKeyPress', () => {
  it('records a correct press and updates accuracy', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(profile.totalAttempts).toBe(1)
    expect(profile.correctAttempts).toBe(1)
    expect(profile.averageTimeMs).toBe(200)
  })

  it('records an incorrect press', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.totalAttempts).toBe(1)
    expect(profile.correctAttempts).toBe(0)
    expect(profile.averageTimeMs).toBe(500)
  })

  it('computes running average time across multiple presses', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: true, timeMs: 400 })
    expect(profile.averageTimeMs).toBe(300)
    expect(profile.totalAttempts).toBe(2)
    expect(profile.correctAttempts).toBe(2)
  })

  it('appends to history', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.history).toHaveLength(2)
    expect(profile.history[0]).toEqual({ correct: true, timeMs: 200 })
    expect(profile.history[1]).toEqual({ correct: false, timeMs: 500 })
  })
})

describe('computeWeaknessScore', () => {
  it('returns 1.0 for a key with zero accuracy and max slowness', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: false, timeMs: 2000 })
    const score = computeWeaknessScore(profile, { maxTimeMs: 2000 })
    expect(score).toBeCloseTo(1.0, 1)
  })

  it('returns near-zero for a key with perfect accuracy and fastest speed', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 100 })
    const score = computeWeaknessScore(profile, { maxTimeMs: 2000 })
    // accuracy component = 0, speed component = 0.3 * (100/2000) = 0.015
    expect(score).toBeCloseTo(0.3 * (100 / 2000), 2)
  })

  it('returns 1.0 for a key with no attempts (untested = weakest)', () => {
    const profile = createKeyProfile('a')
    const score = computeWeaknessScore(profile, { maxTimeMs: 2000 })
    expect(score).toBe(1.0)
  })
})

describe('rankWeaknesses', () => {
  it('ranks keys from weakest to strongest', () => {
    let good = createKeyProfile('a')
    good = recordKeyPress(good, { correct: true, timeMs: 100 })
    good = recordKeyPress(good, { correct: true, timeMs: 100 })

    let bad = createKeyProfile('(')
    bad = recordKeyPress(bad, { correct: false, timeMs: 800 })
    bad = recordKeyPress(bad, { correct: false, timeMs: 900 })

    let mid = createKeyProfile('[')
    mid = recordKeyPress(mid, { correct: true, timeMs: 400 })
    mid = recordKeyPress(mid, { correct: false, timeMs: 500 })

    const ranked = rankWeaknesses([good, bad, mid])
    expect(ranked[0].key).toBe('(')
    expect(ranked[1].key).toBe('[')
    expect(ranked[2].key).toBe('a')
  })

  it('returns top N weakest when limit is specified', () => {
    let good = createKeyProfile('a')
    good = recordKeyPress(good, { correct: true, timeMs: 100 })

    let bad = createKeyProfile('(')
    bad = recordKeyPress(bad, { correct: false, timeMs: 800 })

    let mid = createKeyProfile('[')
    mid = recordKeyPress(mid, { correct: true, timeMs: 400 })

    const ranked = rankWeaknesses([good, bad, mid], 1)
    expect(ranked).toHaveLength(1)
    expect(ranked[0].key).toBe('(')
  })
})

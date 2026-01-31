import { describe, it, expect } from 'vitest'
import { KEY_GROUPS, ALL_KEYS } from '../lib/keys'
import {
  createKeyProfile,
  recordKeyPress,
  computeWeaknessScore,
  rankWeaknesses,
  computeTrend,
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
  it('creates a profile with zero attempts, no history, and initial bests', () => {
    const profile = createKeyProfile('a')
    expect(profile.key).toBe('a')
    expect(profile.totalAttempts).toBe(0)
    expect(profile.correctAttempts).toBe(0)
    expect(profile.averageTimeMs).toBe(0)
    expect(profile.bestAccuracy).toBe(0)
    expect(profile.bestSpeedMs).toBe(0)
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

  /**
   * Spec: "For each key, track personal bests: Best accuracy %, Best speed"
   * bestAccuracy should be the highest accuracy the key profile has ever achieved.
   * bestSpeedMs should be the fastest average reaction time.
   */
  it('tracks personal best accuracy and speed', () => {
    let profile = createKeyProfile('a')
    // 1 hit → 100% accuracy, 200ms avg
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(profile.bestAccuracy).toBe(1.0)
    expect(profile.bestSpeedMs).toBe(200)

    // 1 miss → 50% accuracy, avg time changes — but best accuracy stays at 1.0
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.bestAccuracy).toBe(1.0)

    // Another hit → 66.7% accuracy, best speed improves
    profile = recordKeyPress(profile, { correct: true, timeMs: 100 })
    expect(profile.bestAccuracy).toBe(1.0) // still from first press
    // avgTimeMs = (200+500+100)/3 = 266.67, but bestSpeedMs was 200 which is better
    expect(profile.bestSpeedMs).toBeLessThanOrEqual(267)
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

describe('computeTrend', () => {
  /**
   * Spec: "Trend: direction and magnitude derived from linear regression on the last 10 data points per key.
   * Displayed as: improving (green arrow up), declining (red arrow down), or stable (grey dash)"
   */
  it('returns stable for profile with fewer than 3 data points', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(computeTrend(profile)).toBe('stable')
  })

  it('returns improving when accuracy increases over last 10 presses', () => {
    let profile = createKeyProfile('a')
    // First 5 mostly misses, last 5 mostly hits → improving
    for (let i = 0; i < 5; i++) profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    for (let i = 0; i < 5; i++) profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(computeTrend(profile)).toBe('improving')
  })

  it('returns declining when accuracy decreases over last 10 presses', () => {
    let profile = createKeyProfile('a')
    // First 5 mostly hits, last 5 mostly misses → declining
    for (let i = 0; i < 5; i++) profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    for (let i = 0; i < 5; i++) profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(computeTrend(profile)).toBe('declining')
  })

  it('returns stable when accuracy is consistent', () => {
    let profile = createKeyProfile('a')
    // All hits → flat line → stable
    for (let i = 0; i < 10; i++) profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(computeTrend(profile)).toBe('stable')
  })

  it('only considers last 10 data points', () => {
    let profile = createKeyProfile('a')
    // 20 misses followed by 10 hits — trend should look at last 10 (all hits) → stable
    for (let i = 0; i < 20; i++) profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    for (let i = 0; i < 10; i++) profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(computeTrend(profile)).toBe('stable')
  })
})

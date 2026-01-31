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

  /**
   * Misses don't destroy invaders, so they have no reaction time per spec.
   * averageTimeMs should not change on a miss (timeMs is irrelevant for misses).
   */
  it('records an incorrect press without affecting averageTimeMs', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: false, timeMs: 0 })
    expect(profile.totalAttempts).toBe(1)
    expect(profile.correctAttempts).toBe(0)
    expect(profile.averageTimeMs).toBe(0)
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
   * bestAccuracy only starts tracking after 10+ attempts so the ratio is
   * statistically meaningful (avoids the trivial 1/1 = 100% after first hit).
   * bestSpeedMs tracks the fastest individual hit.
   */
  it('tracks personal best accuracy and speed', () => {
    let profile = createKeyProfile('a')
    // 1 hit → 100% accuracy, but bestAccuracy stays 0 (< 10 attempts)
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(profile.bestAccuracy).toBe(0)
    expect(profile.bestSpeedMs).toBe(200)

    // 1 miss → bestAccuracy still 0 (< 10 attempts)
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.bestAccuracy).toBe(0)

    // Another hit → bestAccuracy still 0 (only 3 attempts)
    profile = recordKeyPress(profile, { correct: true, timeMs: 100 })
    expect(profile.bestAccuracy).toBe(0)
    // bestSpeedMs = min(200, 100) = 100
    expect(profile.bestSpeedMs).toBe(100)
  })

  /**
   * bestAccuracy only begins tracking once 10+ attempts have been recorded,
   * preventing the trivial 1/1 = 100% that made the metric useless.
   */
  it('starts tracking bestAccuracy after 10 attempts', () => {
    let profile = createKeyProfile('a')
    // 9 hits, 0 misses — still < 10 total attempts
    for (let i = 0; i < 9; i++) {
      profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    }
    expect(profile.bestAccuracy).toBe(0) // not yet tracking

    // 10th attempt (hit): 10/10 = 100%, now tracks
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(profile.bestAccuracy).toBe(1.0)

    // 11th attempt (miss): 10/11 = ~91%, bestAccuracy stays at 100%
    profile = recordKeyPress(profile, { correct: false, timeMs: 0 })
    expect(profile.bestAccuracy).toBe(1.0)
  })

  /**
   * Spec: "Speed: average reaction time in milliseconds from invader spawn to keypress"
   * Misses (timeMs=0) should not dilute the average reaction time, since reaction time
   * is only meaningful for destroyed invaders.
   */
  it('does not dilute averageTimeMs with miss timeMs=0', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: false, timeMs: 0 })
    // averageTimeMs should stay at 200, not become (200+0)/2 = 100
    expect(profile.averageTimeMs).toBe(200)
  })

  /**
   * Regression test: hits after misses must use hit count (correctAttempts) as the
   * running average divisor, not total attempts. Otherwise the average gets diluted.
   * E.g., hit(200) → miss → hit(600) should average to 400, not 333.
   */
  it('averageTimeMs uses hit count, not total attempts, as divisor', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: false, timeMs: 0 })
    profile = recordKeyPress(profile, { correct: true, timeMs: 600 })
    // Average of 2 hits: (200 + 600) / 2 = 400
    expect(profile.averageTimeMs).toBe(400)
  })

  /**
   * Spec: "Best speed: fastest average reaction time for that key"
   * bestSpeedMs should track the fastest individual reaction time, not the running average.
   */
  it('bestSpeedMs tracks fastest individual hit time, not running average', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 300 })
    expect(profile.bestSpeedMs).toBe(300)

    profile = recordKeyPress(profile, { correct: true, timeMs: 100 })
    // bestSpeedMs should be 100 (the faster hit), not 200 (the average)
    expect(profile.bestSpeedMs).toBe(100)
  })

  /**
   * Spec: "Total kills: lifetime count of invaders destroyed for that key"
   * lifetimeKills should increment on each hit and survive recalibration.
   */
  it('tracks lifetimeKills on correct presses', () => {
    let profile = createKeyProfile('a')
    expect(profile.lifetimeKills).toBe(0)

    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(profile.lifetimeKills).toBe(1)

    profile = recordKeyPress(profile, { correct: false, timeMs: 0 })
    expect(profile.lifetimeKills).toBe(1) // miss doesn't increment

    profile = recordKeyPress(profile, { correct: true, timeMs: 150 })
    expect(profile.lifetimeKills).toBe(2)
  })

  it('appends to history', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.history).toHaveLength(2)
    expect(profile.history[0]).toEqual({ correct: true, timeMs: 200 })
    expect(profile.history[1]).toEqual({ correct: false, timeMs: 500 })
  })

  /**
   * History is capped at 20 entries to prevent unbounded localStorage growth.
   * computeTrend only uses the last 10 data points, so 20 provides ample buffer.
   */
  it('caps history at 20 entries to prevent unbounded growth', () => {
    let profile = createKeyProfile('a')
    for (let i = 0; i < 30; i++) {
      profile = recordKeyPress(profile, { correct: i % 2 === 0, timeMs: 200 + i })
    }
    expect(profile.history).toHaveLength(20)
    // Should keep the most recent 20 entries (indices 10-29)
    expect(profile.history[0]).toEqual({ correct: true, timeMs: 210 })
    expect(profile.history[19]).toEqual({ correct: false, timeMs: 229 })
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

/**
 * Old localStorage profiles saved before lifetimeKills, bestAccuracy, and
 * bestSpeedMs were added will have those fields as undefined after JSON.parse.
 * recordKeyPress must handle this gracefully (default to 0) instead of
 * producing NaN via `undefined + 1` or `Math.max(undefined, ...)`.
 */
describe('recordKeyPress — backward compatibility with legacy profiles', () => {
  it('handles profiles missing lifetimeKills, bestAccuracy, bestSpeedMs', () => {
    // Simulate a profile from old localStorage that lacks newer fields
    const legacyProfile = {
      key: 'a',
      totalAttempts: 5,
      correctAttempts: 3,
      averageTimeMs: 200,
      history: [],
    } as unknown as import('../lib/scoring').KeyProfile

    const updated = recordKeyPress(legacyProfile, { correct: true, timeMs: 150 })

    expect(updated.lifetimeKills).toBe(1) // not NaN
    expect(updated.bestAccuracy).toBe(0) // not NaN; stays 0 since totalAttempts < 10
    expect(updated.bestSpeedMs).toBe(150) // not NaN
    expect(updated.totalAttempts).toBe(6)
    expect(updated.correctAttempts).toBe(4)
  })
})

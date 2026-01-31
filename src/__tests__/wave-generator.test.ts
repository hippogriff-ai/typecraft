import { describe, it, expect } from 'vitest'
import {
  generateWaveChars,
  getCalibrationRounds,
  getNextPracticeRound,
} from '../lib/wave-generator'
import { KEY_GROUPS } from '../lib/keys'
import { createKeyProfile, recordKeyPress } from '../lib/scoring'

describe('generateWaveChars', () => {
  it('returns the specified number of characters', () => {
    const chars = generateWaveChars({ count: 6, focusKeys: ['a', 'b'] })
    expect(chars).toHaveLength(6)
  })

  it('biases heavily toward focus keys', () => {
    const chars = generateWaveChars({ count: 50, focusKeys: ['('] })
    const focusCount = chars.filter((c) => c === '(').length
    expect(focusCount / chars.length).toBeGreaterThanOrEqual(0.6)
  })

  it('includes some non-focus filler keys', () => {
    const chars = generateWaveChars({ count: 50, focusKeys: ['('] })
    const nonFocus = chars.filter((c) => c !== '(').length
    expect(nonFocus).toBeGreaterThan(0)
  })
})

describe('getCalibrationRounds', () => {
  it('returns one round config per key group', () => {
    const rounds = getCalibrationRounds()
    const groupCount = Object.keys(KEY_GROUPS).length
    expect(rounds).toHaveLength(groupCount)
  })

  it('each round has a name and focus keys', () => {
    const rounds = getCalibrationRounds()
    for (const round of rounds) {
      expect(round.name).toBeTruthy()
      expect(round.focusKeys.length).toBeGreaterThan(0)
    }
  })
})

describe('getNextPracticeRound', () => {
  it('selects weakest keys as focus', () => {
    let bad = createKeyProfile('(')
    bad = recordKeyPress(bad, { correct: false, timeMs: 800 })

    let good = createKeyProfile('a')
    good = recordKeyPress(good, { correct: true, timeMs: 100 })

    const round = getNextPracticeRound({ '(': bad, a: good })
    expect(round.focusKeys).toContain('(')
  })

  it('returns at most 5 focus keys', () => {
    const profiles: Record<string, ReturnType<typeof createKeyProfile>> = {}
    for (const c of 'abcdefghij') {
      let p = createKeyProfile(c)
      p = recordKeyPress(p, { correct: false, timeMs: 800 })
      profiles[c] = p
    }
    const round = getNextPracticeRound(profiles)
    expect(round.focusKeys.length).toBeLessThanOrEqual(5)
  })
})

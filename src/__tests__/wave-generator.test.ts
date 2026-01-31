import { describe, it, expect } from 'vitest'
import {
  getCalibrationRounds,
  getNextPracticeRound,
} from '../lib/wave-generator'
import { KEY_GROUPS } from '../lib/keys'
import { createKeyProfile, recordKeyPress } from '../lib/scoring'

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
  /**
   * Defensive edge case: if keyProfiles is empty (e.g., corrupted localStorage with
   * calibrationProgress.complete=true but wiped profiles), getNextPracticeRound should
   * return sensible home row defaults instead of empty focusKeys. Empty focusKeys would
   * cause spawnWave to fall back to a different set of defaults downstream.
   */
  it('returns home row defaults when profiles is empty', () => {
    const round = getNextPracticeRound({})
    expect(round.focusKeys.length).toBeGreaterThan(0)
    expect(round.focusKeys).toEqual(['a', 's', 'd', 'f', 'g'])
    expect(round.fillerKeys).toBeUndefined()
  })

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

  /**
   * Spec: "Filler source: the player's next-weakest keys (ranked 6-10)."
   * When enough profiles exist, fillerKeys should contain keys ranked 6-10
   * so practice rounds maintain 70/30 focus/filler variety.
   */
  it('returns filler keys from ranks 6-10 when enough profiles exist', () => {
    const profiles: Record<string, ReturnType<typeof createKeyProfile>> = {}
    const keys = 'abcdefghij'.split('')
    // Create 10 profiles with decreasing accuracy so ranking is predictable
    for (let i = 0; i < keys.length; i++) {
      let p = createKeyProfile(keys[i])
      // Lower accuracy = higher weakness score
      for (let j = 0; j < 10; j++) {
        p = recordKeyPress(p, { correct: j < (10 - i), timeMs: 200 })
      }
      profiles[keys[i]] = p
    }
    const round = getNextPracticeRound(profiles)
    expect(round.focusKeys).toHaveLength(5)
    expect(round.fillerKeys).toBeDefined()
    expect(round.fillerKeys!.length).toBe(5)
    // Focus and filler should not overlap
    for (const fk of round.fillerKeys!) {
      expect(round.focusKeys).not.toContain(fk)
    }
  })

  /**
   * When fewer than 6 profiles exist, there are no keys ranked 6-10,
   * so fillerKeys should be undefined (calibration mode doesn't use filler).
   */
  it('returns undefined fillerKeys when fewer than 6 profiles exist', () => {
    const profiles: Record<string, ReturnType<typeof createKeyProfile>> = {}
    for (const c of 'abc') {
      let p = createKeyProfile(c)
      p = recordKeyPress(p, { correct: false, timeMs: 500 })
      profiles[c] = p
    }
    const round = getNextPracticeRound(profiles)
    expect(round.fillerKeys).toBeUndefined()
  })
})

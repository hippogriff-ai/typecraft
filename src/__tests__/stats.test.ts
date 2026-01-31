import { describe, it, expect } from 'vitest'
import {
  calculateWPM,
  calculateLearningSpeed,
  type SessionRecord,
} from '../lib/stats'

describe('calculateWPM', () => {
  /**
   * Spec: "Effective CPM / 5 (total characters spawned per minute of active gameplay, multiplied by accuracy)"
   */
  it('calculates words per minute from characters and time', () => {
    // 50 characters in 12 seconds = 50 WPM (at 5 chars/word, 100% accuracy)
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 12000 })
    expect(wpm).toBe(50)
  })

  it('returns 0 for zero elapsed time', () => {
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 0 })
    expect(wpm).toBe(0)
  })

  /**
   * Spec: "multiplied by accuracy" — 50% accuracy should halve the WPM.
   */
  it('applies accuracy multiplier to WPM', () => {
    // 50 chars in 12s at 50% accuracy → 25 WPM
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 12000, accuracy: 0.5 })
    expect(wpm).toBe(25)
  })
})

describe('calculateLearningSpeed', () => {
  /**
   * Spec: "WPM delta — difference between current WPM (avg of last 5 rounds) and previous WPM (avg of rounds 6-10).
   * Requires 10+ rounds to display."
   */
  it('returns positive delta when recent rounds are better', () => {
    // Previous 5 rounds avg 30 WPM, recent 5 rounds avg 40 WPM → +10
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 30 },
      { timestamp: 2000, wpm: 30 },
      { timestamp: 3000, wpm: 30 },
      { timestamp: 4000, wpm: 30 },
      { timestamp: 5000, wpm: 30 },
      { timestamp: 6000, wpm: 40 },
      { timestamp: 7000, wpm: 40 },
      { timestamp: 8000, wpm: 40 },
      { timestamp: 9000, wpm: 40 },
      { timestamp: 10000, wpm: 40 },
    ]
    expect(calculateLearningSpeed(sessions)).toBe(10)
  })

  it('returns negative delta when recent rounds are worse', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 40 },
      { timestamp: 2000, wpm: 40 },
      { timestamp: 3000, wpm: 40 },
      { timestamp: 4000, wpm: 40 },
      { timestamp: 5000, wpm: 40 },
      { timestamp: 6000, wpm: 30 },
      { timestamp: 7000, wpm: 30 },
      { timestamp: 8000, wpm: 30 },
      { timestamp: 9000, wpm: 30 },
      { timestamp: 10000, wpm: 30 },
    ]
    expect(calculateLearningSpeed(sessions)).toBe(-10)
  })

  it('returns 0 for fewer than 10 sessions', () => {
    expect(calculateLearningSpeed([])).toBe(0)
    expect(calculateLearningSpeed([{ timestamp: 1000, wpm: 30 }])).toBe(0)
    // 9 sessions still not enough
    const nine = Array.from({ length: 9 }, (_, i) => ({ timestamp: i * 1000, wpm: 30 + i }))
    expect(calculateLearningSpeed(nine)).toBe(0)
  })

  it('uses last 10 rounds for the window comparison', () => {
    // 15 sessions: first 10 vary, last 5 avg to 50
    const sessions: SessionRecord[] = [
      ...Array.from({ length: 5 }, (_, i) => ({ timestamp: i * 1000, wpm: 10 })),
      ...Array.from({ length: 5 }, (_, i) => ({ timestamp: (i + 5) * 1000, wpm: 20 })),
      ...Array.from({ length: 5 }, (_, i) => ({ timestamp: (i + 10) * 1000, wpm: 50 })),
    ]
    // Recent 5: avg 50, previous 5 (rounds 6-10): avg 20 → delta = 30
    expect(calculateLearningSpeed(sessions)).toBe(30)
  })
})

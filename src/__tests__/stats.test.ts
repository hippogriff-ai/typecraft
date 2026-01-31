import { describe, it, expect } from 'vitest'
import {
  calculateWPM,
  calculateLearningSpeed,
  type SessionRecord,
} from '../lib/stats'

describe('calculateWPM', () => {
  it('calculates words per minute from characters and time', () => {
    // 50 characters in 12 seconds = 50 WPM (at 5 chars/word)
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 12000 })
    expect(wpm).toBe(50)
  })

  it('returns 0 for zero elapsed time', () => {
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 0 })
    expect(wpm).toBe(0)
  })
})

describe('calculateLearningSpeed', () => {
  it('returns positive delta when improving', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 30 },
      { timestamp: 2000, wpm: 35 },
      { timestamp: 3000, wpm: 40 },
    ]
    const speed = calculateLearningSpeed(sessions)
    expect(speed).toBeGreaterThan(0)
  })

  it('returns negative delta when declining', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 40 },
      { timestamp: 2000, wpm: 35 },
      { timestamp: 3000, wpm: 30 },
    ]
    const speed = calculateLearningSpeed(sessions)
    expect(speed).toBeLessThan(0)
  })

  it('returns 0 for fewer than 2 sessions', () => {
    expect(calculateLearningSpeed([])).toBe(0)
    expect(calculateLearningSpeed([{ timestamp: 1000, wpm: 30 }])).toBe(0)
  })

  it('computes average WPM change per session', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 20 },
      { timestamp: 2000, wpm: 30 },
      { timestamp: 3000, wpm: 40 },
    ]
    // (40 - 20) / (3 - 1) = 10 WPM per session
    const speed = calculateLearningSpeed(sessions)
    expect(speed).toBe(10)
  })
})

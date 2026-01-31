/**
 * Tests for the adaptive calibration system.
 * Verifies speed adjustments based on rolling accuracy windows during calibration rounds.
 * Can be simplified if calibration thresholds or speed multipliers change.
 */
import { describe, it, expect } from 'vitest'
import {
  createCalibrationTracker,
  recordCalibrationResult,
  getAdaptedSpeed,
} from '../lib/adaptive-calibration'

describe('adaptive calibration', () => {
  it('does not adjust speed until 10 results recorded', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 9; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBe(50)
  })

  it('increases speed by 10% when rolling accuracy > 90%', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeCloseTo(55, 0)
  })

  it('decreases speed by 10% when rolling accuracy < 50%', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: i < 4 })
    }
    expect(getAdaptedSpeed(tracker)).toBe(45)
  })

  it('does not adjust speed when accuracy is between 50% and 90%', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: i < 7 })
    }
    expect(getAdaptedSpeed(tracker)).toBe(50)
  })

  it('checks every 10 invaders and accumulates adjustments', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeCloseTo(55, 0)

    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeCloseTo(60.5, 0)
  })

  /** Speed must not exceed 2x base, preventing the game from becoming unplayable. */
  it('caps speed increase at 2x base speed', () => {
    let tracker = createCalibrationTracker(50)
    // 100 perfect results = 10 adjustments of +10% = 1.1^10 ≈ 2.59x uncapped
    for (let i = 0; i < 100; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeLessThanOrEqual(100) // 2x base
  })

  /** Speed must not drop below 0.5x base, keeping the game playable. */
  it('floors speed decrease at 0.5x base speed', () => {
    let tracker = createCalibrationTracker(50)
    // 100 miss-heavy results = 10 adjustments of -10% = 0.9^10 ≈ 0.35x uncapped
    for (let i = 0; i < 100; i++) {
      tracker = recordCalibrationResult(tracker, { correct: false })
    }
    expect(getAdaptedSpeed(tracker)).toBeGreaterThanOrEqual(25) // 0.5x base
  })

  it('uses a rolling window of last 10 results, not all-time', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: false })
    }
    expect(getAdaptedSpeed(tracker)).toBe(45)

    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeCloseTo(49.5, 0)
  })
})

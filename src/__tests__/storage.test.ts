import { describe, it, expect, beforeEach } from 'vitest'
import { saveState, loadState, clearCalibrationData, type AppState } from '../lib/storage'
import { createKeyProfile } from '../lib/scoring'

beforeEach(() => {
  localStorage.clear()
})

function makeState(overrides?: Partial<AppState>): AppState {
  return {
    keyProfiles: { a: createKeyProfile('a') },
    roundHistory: [],
    calibrationProgress: { completedGroups: [], complete: false },
    currentFocusKeys: [],
    mode: 'calibration',
    ...overrides,
  }
}

describe('saveState / loadState', () => {
  it('round-trips state through localStorage', () => {
    const state = makeState({ mode: 'practice' })
    saveState(state)
    const loaded = loadState()
    expect(loaded).toEqual(state)
  })

  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull()
  })

  /**
   * Spec: "On version mismatch or JSON parse error: wipe all data and restart calibration."
   * Corrupted data should be removed from localStorage, not just ignored.
   */
  it('returns null and wipes storage for corrupted data', () => {
    localStorage.setItem('typecraft', 'not json{{{')
    expect(loadState()).toBeNull()
    expect(localStorage.getItem('typecraft')).toBeNull()
  })
})

describe('clearCalibrationData', () => {
  it('clears key profiles and calibration but keeps round history', () => {
    const state = makeState({
      mode: 'practice',
      roundHistory: [{ timestamp: 1000, wpm: 30, grapesLeft: 8, focusKeys: ['a'] }],
      calibrationProgress: { completedGroups: ['homeRow'], complete: true },
    })
    saveState(state)

    clearCalibrationData()

    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded!.mode).toBe('calibration')
    expect(loaded!.keyProfiles).toEqual({})
    expect(loaded!.calibrationProgress).toEqual({ completedGroups: [], complete: false })
    expect(loaded!.currentFocusKeys).toEqual([])
    // Round history preserved
    expect(loaded!.roundHistory).toHaveLength(1)
  })

  /**
   * Spec: "Recalibration Keeps: high score, total kills, round history"
   */
  it('preserves high score on recalibration', () => {
    const state = makeState({
      mode: 'practice',
      highScore: 99,
      calibrationProgress: { completedGroups: ['homeRow'], complete: true },
    })
    saveState(state)

    clearCalibrationData()

    const loaded = loadState()
    expect(loaded!.highScore).toBe(99)
  })

  it('does nothing when no state exists', () => {
    expect(() => clearCalibrationData()).not.toThrow()
  })
})

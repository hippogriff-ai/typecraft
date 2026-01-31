import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveState,
  loadState,
  clearCalibrationData,
  type AppState,
} from '../lib/storage'
import { createKeyProfile } from '../lib/scoring'

beforeEach(() => {
  localStorage.clear()
})

function makeState(overrides?: Partial<AppState>): AppState {
  return {
    keyProfiles: { a: createKeyProfile('a') },
    sessionHistory: [],
    calibrationComplete: false,
    currentDrillKeys: [],
    ...overrides,
  }
}

describe('saveState / loadState', () => {
  it('round-trips state through localStorage', () => {
    const state = makeState({ calibrationComplete: true })
    saveState(state)
    const loaded = loadState()
    expect(loaded).toEqual(state)
  })

  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull()
  })

  it('returns null for corrupted data', () => {
    localStorage.setItem('typecraft', 'not json{{{')
    expect(loadState()).toBeNull()
  })
})

describe('clearCalibrationData', () => {
  it('clears key profiles and calibration flag but keeps session history', () => {
    const state = makeState({
      calibrationComplete: true,
      sessionHistory: [{ timestamp: 1000, wpm: 30 }],
      keyProfiles: { a: createKeyProfile('a') },
    })
    saveState(state)

    clearCalibrationData()

    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded!.calibrationComplete).toBe(false)
    expect(loaded!.keyProfiles).toEqual({})
    expect(loaded!.currentDrillKeys).toEqual([])
    // Session history preserved
    expect(loaded!.sessionHistory).toEqual([{ timestamp: 1000, wpm: 30 }])
  })

  it('does nothing when no state exists', () => {
    expect(() => clearCalibrationData()).not.toThrow()
  })
})

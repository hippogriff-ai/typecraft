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

  it('returns null for corrupted data', () => {
    localStorage.setItem('typecraft', 'not json{{{')
    expect(loadState()).toBeNull()
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

  it('does nothing when no state exists', () => {
    expect(() => clearCalibrationData()).not.toThrow()
  })
})

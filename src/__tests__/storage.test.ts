import { describe, it, expect, beforeEach } from 'vitest'
import { saveState, loadState, clearCalibrationData, wasDataWiped, type AppState } from '../lib/storage'
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

describe('wasDataWiped', () => {
  /**
   * Spec: "Show a brief notice to the player: 'Data format updated. Starting fresh calibration.'"
   * wasDataWiped() returns true after a schema mismatch wipe, false otherwise.
   */
  it('returns true after schema version mismatch wipe', () => {
    const state = makeState()
    saveState(state)
    const raw = JSON.parse(localStorage.getItem('typecraft')!)
    raw.schemaVersion = -1
    localStorage.setItem('typecraft', JSON.stringify(raw))
    loadState() // triggers wipe
    expect(wasDataWiped()).toBe(true)
  })

  it('returns false when no wipe occurred', () => {
    expect(wasDataWiped()).toBe(false)
  })

  it('returns false after data was wiped and flag consumed', () => {
    const state = makeState()
    saveState(state)
    const raw = JSON.parse(localStorage.getItem('typecraft')!)
    raw.schemaVersion = -1
    localStorage.setItem('typecraft', JSON.stringify(raw))
    loadState()
    wasDataWiped() // consume
    expect(wasDataWiped()).toBe(false) // second call returns false
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
    // Key profiles are reset (accuracy/speed/history cleared) but keys still exist
    expect(loaded!.keyProfiles['a'].totalAttempts).toBe(0)
    expect(loaded!.keyProfiles['a'].averageTimeMs).toBe(0)
    expect(loaded!.keyProfiles['a'].history).toEqual([])
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

  /**
   * Spec: "Recalibration Resets: accuracy, speed, and trend for all key profiles.
   * Keeps: high score, total kills, round history (lifetime achievements preserved)"
   * correctAttempts = total kills, so it must survive recalibration.
   */
  it('preserves total kills (correctAttempts) per key on recalibration', () => {
    const profile = {
      ...createKeyProfile('a'),
      totalAttempts: 20,
      correctAttempts: 15,
      averageTimeMs: 250,
      bestAccuracy: 0.9,
      bestSpeedMs: 100,
      history: [{ correct: true, timeMs: 200 }],
    }
    const state = makeState({
      mode: 'practice',
      keyProfiles: { a: profile },
      calibrationProgress: { completedGroups: ['homeRow'], complete: true },
    })
    saveState(state)

    clearCalibrationData()

    const loaded = loadState()
    expect(loaded!.keyProfiles['a']).toBeDefined()
    // Total kills preserved
    expect(loaded!.keyProfiles['a'].correctAttempts).toBe(15)
    // Accuracy, speed, trend reset
    expect(loaded!.keyProfiles['a'].totalAttempts).toBe(0)
    expect(loaded!.keyProfiles['a'].averageTimeMs).toBe(0)
    expect(loaded!.keyProfiles['a'].bestAccuracy).toBe(0)
    expect(loaded!.keyProfiles['a'].bestSpeedMs).toBe(0)
    expect(loaded!.keyProfiles['a'].history).toEqual([])
  })

  it('does nothing when no state exists', () => {
    expect(() => clearCalibrationData()).not.toThrow()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { saveState, loadState, clearCalibrationData, wasDataWiped, type AppState } from '../lib/storage'
import { createKeyProfile } from '../lib/scoring'
import type { Settings } from '../lib/settings'

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

  /**
   * JSON data without a schemaVersion field should be treated as a version mismatch
   * and wiped. Without this guard, manually-edited or externally-written localStorage
   * data missing required fields (roundHistory, calibrationProgress, etc.) would load
   * and crash the app when accessing .map() or .completedGroups on undefined.
   */
  it('returns null and wipes storage when schemaVersion is absent', () => {
    localStorage.setItem('typecraft', JSON.stringify({ keyProfiles: {} }))
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

  /**
   * Data without schemaVersion is treated as corrupted — must show notice.
   */
  it('returns true after missing schemaVersion wipe', () => {
    localStorage.setItem('typecraft', JSON.stringify({ keyProfiles: {} }))
    loadState()
    expect(wasDataWiped()).toBe(true)
  })

  /**
   * Spec: "On version mismatch or JSON parse error: wipe all data and restart
   * calibration. Show a brief notice." The notice must appear for BOTH
   * schema-mismatch AND JSON parse errors, not just schema mismatch.
   */
  it('returns true after JSON parse error wipe', () => {
    localStorage.setItem('typecraft', 'corrupted{{{not-json')
    loadState() // triggers catch block wipe
    expect(wasDataWiped()).toBe(true)
  })
})

/**
 * Settings loaded from localStorage must be validated/clamped to prevent
 * corrupted or manually-edited values from causing game logic errors.
 * Without validation, out-of-range values (grapeCount > 48, negative
 * wavesPerRound, etc.) could reach createRoundState and spawnWave.
 */
describe('loadState — settings validation', () => {
  it('clamps out-of-range settings when loading from localStorage', () => {
    const state = makeState({
      settings: {
        grapeCount: 999,
        speedPreset: 'normal',
        maxInvadersPerWave: 999,
        wavesPerRound: 999,
        colorBlindMode: 'none',
      },
    })
    saveState(state)

    const loaded = loadState()
    expect(loaded!.settings!.grapeCount).toBe(48)
    expect(loaded!.settings!.maxInvadersPerWave).toBe(30)
    expect(loaded!.settings!.wavesPerRound).toBe(12)
  })

  it('corrects invalid speed preset to normal', () => {
    const state = makeState({
      settings: {
        grapeCount: 24,
        speedPreset: 'turbo' as Settings['speedPreset'],
        maxInvadersPerWave: 12,
        wavesPerRound: 8,
        colorBlindMode: 'none',
      },
    })
    saveState(state)

    const loaded = loadState()
    expect(loaded!.settings!.speedPreset).toBe('normal')
  })

  /**
   * Old localStorage data saved before color-blind mode was added will lack the
   * colorBlindMode field. validateSettings must default it to 'none' so the app
   * doesn't crash or pass undefined to color palette functions.
   */
  it('defaults missing colorBlindMode to none for old saved data', () => {
    // Simulate old localStorage data that predates the colorBlindMode feature
    const oldData = {
      schemaVersion: 1,
      keyProfiles: {},
      roundHistory: [],
      calibrationProgress: { completedGroups: [], complete: false },
      currentFocusKeys: [],
      mode: 'calibration',
      settings: {
        grapeCount: 24,
        speedPreset: 'normal',
        maxInvadersPerWave: 12,
        wavesPerRound: 8,
        // colorBlindMode intentionally omitted
      },
    }
    localStorage.setItem('typecraft', JSON.stringify(oldData))

    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded!.settings!.colorBlindMode).toBe('none')
    expect(loaded!.settings!.speedPreset).toBe('normal')
    expect(loaded!.settings!.grapeCount).toBe(24)
  })
})

/**
 * Spec: "Session-level stats (total rounds, total time)" under Stored Data.
 * These lifetime metrics must be persisted across sessions.
 */
describe('session-level stats persistence', () => {
  it('round-trips totalRounds and totalPlayTimeMs through localStorage', () => {
    const state = makeState({ totalRounds: 42, totalPlayTimeMs: 360000 })
    saveState(state)
    const loaded = loadState()
    expect(loaded!.totalRounds).toBe(42)
    expect(loaded!.totalPlayTimeMs).toBe(360000)
  })

  it('defaults to 0 when fields are missing (backward compat)', () => {
    const state = makeState()
    saveState(state)
    const loaded = loadState()
    expect(loaded!.totalRounds ?? 0).toBe(0)
    expect(loaded!.totalPlayTimeMs ?? 0).toBe(0)
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
   * lifetimeKills preserves total kills; correctAttempts resets to 0 so accuracy
   * calculations are correct post-recalibration.
   */
  it('preserves lifetimeKills and resets correctAttempts on recalibration', () => {
    const profile = {
      ...createKeyProfile('a'),
      totalAttempts: 20,
      correctAttempts: 15,
      lifetimeKills: 15,
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
    // lifetimeKills preserved
    expect(loaded!.keyProfiles['a'].lifetimeKills).toBe(15)
    // correctAttempts reset (so accuracy calculations work correctly)
    expect(loaded!.keyProfiles['a'].correctAttempts).toBe(0)
    // Accuracy, speed, trend reset
    expect(loaded!.keyProfiles['a'].totalAttempts).toBe(0)
    expect(loaded!.keyProfiles['a'].averageTimeMs).toBe(0)
    expect(loaded!.keyProfiles['a'].history).toEqual([])
    // Personal bests are lifetime achievements — preserved per spec
    expect(loaded!.keyProfiles['a'].bestAccuracy).toBe(0.9)
    expect(loaded!.keyProfiles['a'].bestSpeedMs).toBe(100)
  })

  /**
   * Bug: clearCalibrationData didn't clear currentFillerKeys, so old practice-mode
   * filler keys (ranked 6-10) leaked into calibration rounds, contaminating the
   * 70/30 split with non-focus characters during calibration.
   */
  it('clears currentFillerKeys on recalibration', () => {
    const state = makeState({
      mode: 'practice',
      currentFillerKeys: ['x', 'c', 'v', 'b', 'n'],
      calibrationProgress: { completedGroups: ['homeRow'], complete: true },
    })
    saveState(state)

    clearCalibrationData()

    const loaded = loadState()
    expect(loaded!.currentFillerKeys).toEqual([])
  })

  it('does nothing when no state exists', () => {
    expect(() => clearCalibrationData()).not.toThrow()
  })
})

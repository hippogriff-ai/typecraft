/**
 * Tests for the settings system.
 * Verifies default settings values, speed presets mapping, and input validation/clamping.
 * Can be simplified if settings ranges change or presets are refactored.
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SPEED_PRESETS,
  validateSettings,
  type Settings,
} from '../lib/settings'

describe('DEFAULT_SETTINGS', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_SETTINGS.grapeCount).toBe(24)
    expect(DEFAULT_SETTINGS.speedPreset).toBe('normal')
    expect(DEFAULT_SETTINGS.maxInvadersPerWave).toBe(12)
    expect(DEFAULT_SETTINGS.wavesPerRound).toBe(8)
  })
})

describe('SPEED_PRESETS', () => {
  it('maps slow to 30, normal to 50, fast to 80 px/s', () => {
    expect(SPEED_PRESETS.slow).toBe(30)
    expect(SPEED_PRESETS.normal).toBe(50)
    expect(SPEED_PRESETS.fast).toBe(80)
  })
})

describe('validateSettings', () => {
  it('clamps grape count to 6-48', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, grapeCount: 2 }).grapeCount).toBe(6)
    expect(validateSettings({ ...DEFAULT_SETTINGS, grapeCount: 100 }).grapeCount).toBe(48)
    expect(validateSettings({ ...DEFAULT_SETTINGS, grapeCount: 24 }).grapeCount).toBe(24)
  })

  it('clamps max invaders per wave to 6-20', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, maxInvadersPerWave: 1 }).maxInvadersPerWave).toBe(6)
    expect(validateSettings({ ...DEFAULT_SETTINGS, maxInvadersPerWave: 50 }).maxInvadersPerWave).toBe(20)
  })

  it('clamps waves per round to 4-12', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, wavesPerRound: 2 }).wavesPerRound).toBe(4)
    expect(validateSettings({ ...DEFAULT_SETTINGS, wavesPerRound: 20 }).wavesPerRound).toBe(12)
  })

  it('rejects invalid speed preset by falling back to normal', () => {
    const s = { ...DEFAULT_SETTINGS, speedPreset: 'turbo' as Settings['speedPreset'] }
    expect(validateSettings(s).speedPreset).toBe('normal')
  })

  it('rejects invalid colorBlindMode by falling back to none', () => {
    const s = { ...DEFAULT_SETTINGS, colorBlindMode: 'invalid' as Settings['colorBlindMode'] }
    expect(validateSettings(s).colorBlindMode).toBe('none')
  })

  it('passes through valid values unchanged', () => {
    const valid: Settings = { grapeCount: 30, speedPreset: 'fast', maxInvadersPerWave: 15, wavesPerRound: 10, colorBlindMode: 'deuteranopia' }
    expect(validateSettings(valid)).toEqual(valid)
  })
})

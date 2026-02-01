export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia'

export interface Settings {
  grapeCount: number
  speedPreset: 'slow' | 'normal' | 'fast' | 'ultra'
  maxInvadersPerWave: number
  wavesPerRound: number
  colorBlindMode: ColorBlindMode
}

export const SPEED_PRESETS: Record<Settings['speedPreset'], number> = {
  slow: 30,
  normal: 50,
  fast: 80,
  ultra: 120,
}

export const DEFAULT_SETTINGS: Settings = {
  grapeCount: 24,
  speedPreset: 'normal',
  maxInvadersPerWave: 12,
  wavesPerRound: 8,
  colorBlindMode: 'none',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function validateSettings(settings: Settings): Settings {
  const validPresets: Settings['speedPreset'][] = ['slow', 'normal', 'fast', 'ultra']
  const validCBModes: ColorBlindMode[] = ['none', 'deuteranopia', 'protanopia']
  return {
    grapeCount: clamp(settings.grapeCount, 6, 48),
    speedPreset: validPresets.includes(settings.speedPreset)
      ? settings.speedPreset
      : 'normal',
    maxInvadersPerWave: clamp(settings.maxInvadersPerWave, 6, 30),
    wavesPerRound: clamp(settings.wavesPerRound, 4, 12),
    colorBlindMode: validCBModes.includes(settings.colorBlindMode)
      ? settings.colorBlindMode
      : 'none',
  }
}

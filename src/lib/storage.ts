import type { KeyProfile } from './scoring'
import { validateSettings } from './settings'
import type { Settings } from './settings'

const STORAGE_KEY = 'typecraft'
const SCHEMA_VERSION = 1

let dataWiped = false

export interface RoundHistoryEntry {
  timestamp: number
  wpm: number
  grapesLeft: number
  focusKeys: string[]
  score?: number
}

export interface CalibrationProgress {
  completedGroups: string[]
  complete: boolean
}

export interface AppState {
  keyProfiles: Record<string, KeyProfile>
  roundHistory: RoundHistoryEntry[]
  calibrationProgress: CalibrationProgress
  currentFocusKeys: string[]
  currentFillerKeys?: string[]
  calibrationOrder?: string[]
  mode: 'calibration' | 'practice'
  highScore?: number
  totalRounds?: number
  totalPlayTimeMs?: number
  settings?: Settings
}

interface StoredData extends AppState {
  schemaVersion: number
}

export function saveState(state: AppState): void {
  const data: StoredData = {
    ...state,
    schemaVersion: SCHEMA_VERSION,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const data: StoredData = JSON.parse(raw)

    if (data.schemaVersion !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      dataWiped = true
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schemaVersion: _, ...state } = data
    if (state.settings) {
      state.settings = validateSettings(state.settings as Settings)
    }
    return state
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    dataWiped = true
    return null
  }
}

export function wasDataWiped(): boolean {
  const result = dataWiped
  dataWiped = false
  return result
}

export function clearCalibrationData(): void {
  const state = loadState()
  if (!state) return

  // Spec: "Resets: accuracy, speed, and trend. Keeps: high score, total kills, round history
  // (lifetime achievements preserved)." Personal bests (bestAccuracy, bestSpeedMs) and
  // lifetimeKills are lifetime achievements and survive recalibration.
  const resetProfiles: Record<string, KeyProfile> = {}
  for (const [key, profile] of Object.entries(state.keyProfiles)) {
    resetProfiles[key] = {
      key: profile.key,
      totalAttempts: 0,
      correctAttempts: 0,
      lifetimeKills: profile.lifetimeKills ?? 0,
      averageTimeMs: 0,
      bestAccuracy: profile.bestAccuracy ?? 0,
      bestSpeedMs: profile.bestSpeedMs ?? 0,
      history: [],
    }
  }

  saveState({
    ...state,
    keyProfiles: resetProfiles,
    calibrationProgress: { completedGroups: [], complete: false },
    currentFocusKeys: [],
    currentFillerKeys: [],
    calibrationOrder: undefined,
    mode: 'calibration',
  })
}

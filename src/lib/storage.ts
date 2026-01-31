import type { KeyProfile } from './scoring'

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
  mode: 'calibration' | 'practice'
  highScore?: number
  settings?: {
    grapeCount: number
    speedPreset: string
    maxInvadersPerWave: number
    wavesPerRound: number
    colorBlindMode?: string
  }
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

    if (data.schemaVersion !== undefined && data.schemaVersion !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      dataWiped = true
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schemaVersion: _, ...state } = data
    return state
  } catch {
    localStorage.removeItem(STORAGE_KEY)
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

  // Spec: "Resets: accuracy, speed, and trend. Keeps: high score, total kills, round history."
  // Preserve correctAttempts (total kills) per key while resetting accuracy/speed/trend.
  const resetProfiles: Record<string, KeyProfile> = {}
  for (const [key, profile] of Object.entries(state.keyProfiles)) {
    resetProfiles[key] = {
      key: profile.key,
      totalAttempts: 0,
      correctAttempts: profile.correctAttempts,
      averageTimeMs: 0,
      bestAccuracy: 0,
      bestSpeedMs: 0,
      history: [],
    }
  }

  saveState({
    ...state,
    keyProfiles: resetProfiles,
    calibrationProgress: { completedGroups: [], complete: false },
    currentFocusKeys: [],
    mode: 'calibration',
  })
}

import { useState, useCallback, useMemo } from 'react'
import { loadState, saveState, clearCalibrationData } from '../lib/storage'
import type { AppState } from '../lib/storage'
import { rankWeaknesses } from '../lib/scoring'
import type { KeyProfile } from '../lib/scoring'
import { calculateLearningSpeed } from '../lib/stats'
import type { SessionRecord } from '../lib/stats'
import { getNextPracticeRound, getCalibrationRounds } from '../lib/wave-generator'

export type Screen = 'menu' | 'demo' | 'playing' | 'calibration-summary' | 'round-summary' | 'stats' | 'settings'
export type GameMode = 'calibration' | 'practice'

export interface GameState {
  screen: Screen
  mode: GameMode
  weakKeys: string[]
  currentWPM: number
  learningSpeed: number
  focusKeys: string[]
  highScore: number
  keyProfiles: Record<string, KeyProfile>
  roundHistory: AppState['roundHistory']
  calibrationProgress: AppState['calibrationProgress']
  settings: NonNullable<AppState['settings']>
  updateSettings: (settings: NonNullable<AppState['settings']>) => void
  startGame: () => void
  completeDemo: () => void
  completeRound: (stats: { grapesLeft: number; accuracy: number; avgReactionMs: number }) => void
  beginPractice: () => void
  recalibrate: () => void
  goToStats: () => void
  goToSettings: () => void
  goToMenu: () => void
}

const DEFAULT_SETTINGS = {
  grapeCount: 24,
  speedPreset: 'normal',
  maxInvadersPerWave: 12,
  wavesPerRound: 8,
}

function makeDefaultState(): AppState {
  return {
    keyProfiles: {},
    roundHistory: [],
    calibrationProgress: { completedGroups: [], complete: false },
    currentFocusKeys: [],
    mode: 'calibration',
  }
}

export function useGameState(): GameState {
  const [appState, setAppState] = useState<AppState>(() => {
    return loadState() ?? makeDefaultState()
  })
  const [screen, setScreen] = useState<Screen>('menu')
  const [isFirstLaunch] = useState(() => loadState() === null)
  const [calibrationRounds] = useState(() => getCalibrationRounds())
  const [calibrationRoundIndex, setCalibrationRoundIndex] = useState(0)

  const mode = appState.mode
  const settings = appState.settings ?? DEFAULT_SETTINGS

  const weakKeys = useMemo(() => {
    const profiles = Object.values(appState.keyProfiles)
    if (profiles.length === 0) return []
    const ranked = rankWeaknesses(profiles, 5)
    return ranked.map((p) => p.key)
  }, [appState.keyProfiles])

  const sessionRecords: SessionRecord[] = useMemo(
    () => appState.roundHistory.map((r) => ({ timestamp: r.timestamp, wpm: r.wpm })),
    [appState.roundHistory],
  )

  const currentWPM = useMemo(() => {
    if (sessionRecords.length === 0) return 0
    const last5 = sessionRecords.slice(-5)
    return Math.round(last5.reduce((s, r) => s + r.wpm, 0) / last5.length)
  }, [sessionRecords])

  const learningSpeed = useMemo(
    () => calculateLearningSpeed(sessionRecords),
    [sessionRecords],
  )

  const focusKeys = appState.currentFocusKeys

  const persist = useCallback((state: AppState) => {
    setAppState(state)
    saveState(state)
  }, [])

  const updateSettings = useCallback(
    (newSettings: NonNullable<AppState['settings']>) => {
      persist({ ...appState, settings: newSettings })
    },
    [appState, persist],
  )

  const startGame = useCallback(() => {
    if (appState.calibrationProgress.complete) {
      const round = getNextPracticeRound(appState.keyProfiles)
      persist({ ...appState, currentFocusKeys: round.focusKeys, mode: 'practice' })
      setScreen('playing')
    } else if (isFirstLaunch) {
      setScreen('demo')
    } else {
      setScreen('playing')
    }
  }, [appState, isFirstLaunch, persist])

  const completeDemo = useCallback(() => {
    persist({ ...appState, mode: 'calibration' })
    setScreen('playing')
  }, [appState, persist])

  const completeRound = useCallback(
    (stats: { grapesLeft: number; accuracy: number; avgReactionMs: number }) => {
      const newHistory = [
        ...appState.roundHistory,
        {
          timestamp: Date.now(),
          wpm: 0,
          grapesLeft: stats.grapesLeft,
          focusKeys: appState.currentFocusKeys,
        },
      ]

      if (mode === 'calibration') {
        const nextIdx = calibrationRoundIndex + 1
        const completedGroups = [
          ...appState.calibrationProgress.completedGroups,
          calibrationRounds[calibrationRoundIndex]?.name ?? '',
        ]
        const allDone = nextIdx >= calibrationRounds.length

        const newState: AppState = {
          ...appState,
          roundHistory: newHistory,
          calibrationProgress: {
            completedGroups,
            complete: allDone,
          },
        }

        persist(newState)
        setCalibrationRoundIndex(nextIdx)

        if (allDone) {
          setScreen('calibration-summary')
        } else {
          setScreen('playing')
        }
      } else {
        persist({ ...appState, roundHistory: newHistory })
        setScreen('round-summary')
      }
    },
    [appState, mode, calibrationRoundIndex, calibrationRounds, persist],
  )

  const beginPractice = useCallback(() => {
    const round = getNextPracticeRound(appState.keyProfiles)
    persist({
      ...appState,
      mode: 'practice',
      currentFocusKeys: round.focusKeys,
    })
    setScreen('playing')
  }, [appState, persist])

  const recalibrate = useCallback(() => {
    clearCalibrationData()
    const newState = loadState() ?? makeDefaultState()
    setAppState(newState)
    setCalibrationRoundIndex(0)
  }, [])

  const goToStats = useCallback(() => setScreen('stats'), [])
  const goToSettings = useCallback(() => setScreen('settings'), [])
  const goToMenu = useCallback(() => setScreen('menu'), [])

  return {
    screen,
    mode,
    weakKeys,
    currentWPM,
    learningSpeed,
    focusKeys,
    highScore: appState.highScore ?? 0,
    keyProfiles: appState.keyProfiles,
    roundHistory: appState.roundHistory,
    calibrationProgress: appState.calibrationProgress,
    settings,
    updateSettings,
    startGame,
    completeDemo,
    completeRound,
    beginPractice,
    recalibrate,
    goToStats,
    goToSettings,
    goToMenu,
  }
}

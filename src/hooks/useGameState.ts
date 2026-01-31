import { useState, useCallback, useMemo, useRef } from 'react'
import { loadState, saveState, clearCalibrationData, wasDataWiped } from '../lib/storage'
import type { AppState } from '../lib/storage'
import { rankWeaknesses, createKeyProfile, recordKeyPress } from '../lib/scoring'
import type { KeyProfile } from '../lib/scoring'
import { calculateLearningSpeed } from '../lib/stats'
import type { SessionRecord } from '../lib/stats'
import { getNextPracticeRound, getCalibrationRounds } from '../lib/wave-generator'
import type { RoundConfig } from '../lib/wave-generator'
import { DEFAULT_SETTINGS } from '../lib/settings'
import { KEY_GROUP_DISPLAY_NAMES, KEY_GROUPS } from '../lib/keys'
import { trackEvent } from '../lib/analytics'

export type Screen = 'menu' | 'demo' | 'playing' | 'calibration-summary' | 'stats' | 'settings'
export type GameMode = 'calibration' | 'practice'

export interface GameState {
  screen: Screen
  mode: GameMode
  weakKeys: string[]
  currentWPM: number
  learningSpeed: number
  focusKeys: string[]
  fillerKeys: string[]
  calibrationRoundName: string | null
  nextCalibrationKeys: string[] | null
  highScore: number
  totalRounds: number
  totalPlayTimeMs: number
  keyProfiles: Record<string, KeyProfile>
  roundHistory: AppState['roundHistory']
  calibrationProgress: AppState['calibrationProgress']
  settings: NonNullable<AppState['settings']>
  dataWasWiped: boolean
  updateSettings: (settings: NonNullable<AppState['settings']>) => void
  recordKeyResult: (key: string, hit: boolean, reactionTimeMs: number) => void
  startGame: () => void
  completeDemo: () => void
  completeRound: (stats: { grapesLeft: number; accuracy: number; avgReactionMs: number; roundScore: number; wpm: number; roundDurationMs?: number }) => void
  beginPractice: () => void
  recalibrate: () => void
  quitRound: () => void
  goToStats: () => void
  goToSettings: () => void
  goToMenu: () => void
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
  // Compute all init-derived values from a single loadState() call (was 4 calls).
  const [initData] = useState(() => {
    const saved = loadState()
    const initial = saved ?? makeDefaultState()
    const isFirst = saved === null
    const wiped = wasDataWiped()

    let rounds: RoundConfig[]
    if (initial.calibrationOrder && !initial.calibrationProgress.complete) {
      rounds = initial.calibrationOrder.map((name) => ({
        name,
        focusKeys: [...(KEY_GROUPS[name as keyof typeof KEY_GROUPS] ?? [])],
      }))
    } else {
      rounds = getCalibrationRounds()
    }

    return {
      initial,
      isFirst,
      wiped,
      rounds,
      roundIndex: initial.calibrationProgress.completedGroups.length,
    }
  })

  const [appState, setAppState] = useState<AppState>(initData.initial)
  const [screen, setScreen] = useState<Screen>('menu')
  const [calibrationRounds, setCalibrationRounds] = useState<RoundConfig[]>(initData.rounds)
  const [calibrationRoundIndex, setCalibrationRoundIndex] = useState(initData.roundIndex)

  // Snapshot of key profiles taken at round start. Used by quitRound() to
  // discard mid-round changes per spec: "Quit to Menu: discards all round data."
  const keyProfileSnapshotRef = useRef<Record<string, KeyProfile> | null>(null)

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

  const calibrationRoundName = mode === 'calibration'
    ? (KEY_GROUP_DISPLAY_NAMES[calibrationRounds[calibrationRoundIndex]?.name ?? ''] ?? null)
    : null

  const nextCalibrationKeys = mode === 'calibration' && calibrationRoundIndex + 1 < calibrationRounds.length
    ? calibrationRounds[calibrationRoundIndex + 1].focusKeys
    : null

  const focusKeys = appState.currentFocusKeys
  const fillerKeys = appState.currentFillerKeys ?? []

  const persist = useCallback((state: AppState) => {
    setAppState(state)
    saveState(state)
  }, [])

  const updateSettings = useCallback(
    (newSettings: NonNullable<AppState['settings']>) => {
      trackEvent('settings_changed', { ...newSettings })
      setAppState((prev) => {
        const updated = { ...prev, settings: newSettings }
        saveState(updated)
        return updated
      })
    },
    [],
  )

  const recordKeyResult = useCallback(
    (key: string, hit: boolean, reactionTimeMs: number) => {
      setAppState((prev) => {
        const existing = prev.keyProfiles[key] ?? createKeyProfile(key)
        const updated = recordKeyPress(existing, { correct: hit, timeMs: reactionTimeMs })
        const newProfiles = { ...prev.keyProfiles, [key]: updated }
        const newState = { ...prev, keyProfiles: newProfiles }
        saveState(newState)
        return newState
      })
    },
    [],
  )

  const startGame = useCallback(() => {
    if (appState.calibrationProgress.complete) {
      trackEvent('game_started', { mode: 'practice', is_first_launch: false })
      keyProfileSnapshotRef.current = { ...appState.keyProfiles }
      const round = getNextPracticeRound(appState.keyProfiles)
      persist({ ...appState, currentFocusKeys: round.focusKeys, currentFillerKeys: round.fillerKeys ?? [], mode: 'practice' })
      setScreen('playing')
    } else if (initData.isFirst) {
      trackEvent('game_started', { mode: 'calibration', is_first_launch: true })
      setScreen('demo')
    } else {
      trackEvent('game_started', { mode: 'calibration', is_first_launch: false })
      keyProfileSnapshotRef.current = { ...appState.keyProfiles }
      const currentRound = calibrationRounds[calibrationRoundIndex]
      persist({
        ...appState,
        currentFocusKeys: currentRound?.focusKeys ?? [],
        currentFillerKeys: [],
        calibrationOrder: calibrationRounds.map((r) => r.name),
      })
      setScreen('playing')
    }
  }, [appState, initData.isFirst, persist, calibrationRounds, calibrationRoundIndex])

  const completeDemo = useCallback(() => {
    trackEvent('demo_completed')
    keyProfileSnapshotRef.current = { ...appState.keyProfiles }
    const firstRound = calibrationRounds[calibrationRoundIndex]
    persist({
      ...appState,
      mode: 'calibration',
      currentFocusKeys: firstRound?.focusKeys ?? [],
      currentFillerKeys: [],
      calibrationOrder: calibrationRounds.map((r) => r.name),
    })
    setScreen('playing')
  }, [appState, persist, calibrationRounds, calibrationRoundIndex])

  const completeRound = useCallback(
    (stats: { grapesLeft: number; accuracy: number; avgReactionMs: number; roundScore: number; wpm: number; roundDurationMs?: number }) => {
      const currentHigh = appState.highScore ?? 0
      const newHighScore = Math.max(currentHigh, stats.roundScore)
      const newTotalRounds = (appState.totalRounds ?? 0) + 1
      const newTotalPlayTimeMs = (appState.totalPlayTimeMs ?? 0) + (stats.roundDurationMs ?? 0)

      const newHistory = [
        ...appState.roundHistory,
        {
          timestamp: Date.now(),
          wpm: stats.wpm,
          grapesLeft: stats.grapesLeft,
          focusKeys: appState.currentFocusKeys,
          score: stats.roundScore,
        },
      ].slice(-200)

      if (mode === 'calibration') {
        const nextIdx = calibrationRoundIndex + 1
        const completedGroups = [
          ...appState.calibrationProgress.completedGroups,
          calibrationRounds[calibrationRoundIndex]?.name ?? '',
        ]
        const allDone = nextIdx >= calibrationRounds.length

        const nextFocusKeys = allDone
          ? appState.currentFocusKeys
          : calibrationRounds[nextIdx]?.focusKeys ?? []

        const newState: AppState = {
          ...appState,
          roundHistory: newHistory,
          highScore: newHighScore,
          totalRounds: newTotalRounds,
          totalPlayTimeMs: newTotalPlayTimeMs,
          calibrationProgress: {
            completedGroups,
            complete: allDone,
          },
          currentFocusKeys: nextFocusKeys,
          currentFillerKeys: [],
        }

        persist(newState)
        setCalibrationRoundIndex(nextIdx)
        // Snapshot for next round (round data is now committed)
        keyProfileSnapshotRef.current = { ...newState.keyProfiles }

        if (allDone) {
          trackEvent('calibration_completed', { total_rounds: completedGroups.length })
          setScreen('calibration-summary')
        } else {
          setScreen('playing')
        }
      } else {
        // In practice mode, re-rank weaknesses and select new focus keys for the next round.
        const updatedState = { ...appState, roundHistory: newHistory, highScore: newHighScore, totalRounds: newTotalRounds, totalPlayTimeMs: newTotalPlayTimeMs }
        const nextRound = getNextPracticeRound(updatedState.keyProfiles)
        const finalState = { ...updatedState, currentFocusKeys: nextRound.focusKeys, currentFillerKeys: nextRound.fillerKeys ?? [] }
        persist(finalState)
        // Snapshot for next round (round data is now committed)
        keyProfileSnapshotRef.current = { ...finalState.keyProfiles }
      }
    },
    [appState, mode, calibrationRoundIndex, calibrationRounds, persist],
  )

  const beginPractice = useCallback(() => {
    const round = getNextPracticeRound(appState.keyProfiles)
    trackEvent('practice_started', { focus_keys: round.focusKeys })
    keyProfileSnapshotRef.current = { ...appState.keyProfiles }
    persist({
      ...appState,
      mode: 'practice',
      currentFocusKeys: round.focusKeys,
      currentFillerKeys: round.fillerKeys ?? [],
    })
    setScreen('playing')
  }, [appState, persist])

  const recalibrate = useCallback(() => {
    trackEvent('recalibration_triggered')
    clearCalibrationData()
    const newState = loadState() ?? makeDefaultState()
    setAppState(newState)
    setCalibrationRoundIndex(0)
    setCalibrationRounds(getCalibrationRounds())
  }, [])

  const quitRound = useCallback(() => {
    trackEvent('round_quit')
    if (keyProfileSnapshotRef.current !== null) {
      const snapshot = keyProfileSnapshotRef.current
      keyProfileSnapshotRef.current = null
      // Use functional updater to get the latest state (avoids stale closure
      // if rapid keypresses and quit happen within the same render batch).
      setAppState((prev) => {
        const restoredState = { ...prev, keyProfiles: snapshot }
        saveState(restoredState)
        return restoredState
      })
    }
    setScreen('menu')
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
    fillerKeys,
    calibrationRoundName,
    nextCalibrationKeys,
    highScore: appState.highScore ?? 0,
    totalRounds: appState.totalRounds ?? 0,
    totalPlayTimeMs: appState.totalPlayTimeMs ?? 0,
    keyProfiles: appState.keyProfiles,
    roundHistory: appState.roundHistory,
    calibrationProgress: appState.calibrationProgress,
    settings,
    dataWasWiped: initData.wiped,
    updateSettings,
    recordKeyResult,
    startGame,
    completeDemo,
    completeRound,
    beginPractice,
    recalibrate,
    quitRound,
    goToStats,
    goToSettings,
    goToMenu,
  }
}

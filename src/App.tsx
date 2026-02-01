import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameState } from './hooks/useGameState'
import { useGameLoop } from './hooks/useGameLoop'
import { createRoundState } from './lib/game-engine'
import type { RoundState } from './lib/game-engine'
import { createAccuracyRing, recordHit, recordMiss } from './lib/accuracy-ring'
import type { AccuracyRing } from './lib/accuracy-ring'
import { SPEED_PRESETS } from './lib/settings'
import { calculateWPM } from './lib/stats'
import { computeTrend } from './lib/scoring'
import { getCharColor } from './lib/sprites'
import { initAnalytics, trackEvent } from './lib/analytics'
import { ALL_KEYS } from './lib/keys'
import { GameBoard } from './components/GameBoard'
import type { Explosion, AbsorbEffect, GrapeBurst } from './components/GameBoard'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { OnboardingDemo } from './components/OnboardingDemo'
import { RoundSummary } from './components/RoundSummary'
import { RoundEnd } from './components/RoundEnd'
import { Countdown } from './components/Countdown'
import { PauseMenu } from './components/PauseMenu'
import { SettingsScreen } from './components/SettingsScreen'
import { StatsScreen } from './components/StatsScreen'
import './App.css'

function useViewportSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth || 800, height: window.innerHeight || 600 }))
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth || 800, height: window.innerHeight || 600 })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return size
}

function App() {
  const gameState = useGameState()
  const settings = gameState.settings
  const viewportSize = useViewportSize()

  // Initialize analytics once on mount
  useEffect(() => { initAnalytics() }, [])

  // Track screen views
  useEffect(() => { trackEvent('screen_viewed', { screen: gameState.screen }) }, [gameState.screen])
  const [paused, setPaused] = useState(false)
  const [pauseAvgReactionMs, setPauseAvgReactionMs] = useState(0)
  const [roundEndResult, setRoundEndResult] = useState<'cleared' | 'grapes_lost' | null>(null)
  const [settingsSource, setSettingsSource] = useState<'hud' | 'pause' | null>(null)
  const [showRecalConfirm, setShowRecalConfirm] = useState(false)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [lastRoundStats, setLastRoundStats] = useState({
    grapesLeft: 0,
    accuracy: 0,
    avgReactionMs: 0,
    roundScore: 0,
    wpm: 0,
    roundDurationMs: 0,
    keysImproved: [] as string[],
    keysDeclined: [] as string[],
  })

  const [liveWpm, setLiveWpm] = useState(0)
  const [accuracyRing, setAccuracyRing] = useState<AccuracyRing>(() => createAccuracyRing())
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [absorbs, setAbsorbs] = useState<AbsorbEffect[]>([])
  const [grapeBursts, setGrapeBursts] = useState<GrapeBurst[]>([])
  const explosionIdRef = useRef(0)
  const absorbIdRef = useRef(0)
  const grapeBurstIdRef = useRef(0)

  // Round metrics tracking
  const roundStartTimeRef = useRef(0)
  const reactionTimesRef = useRef<number[]>([])
  const roundStartAccuracyRef = useRef<Record<string, number>>({})

  // Ref to gameLoop.resetState — bridges the definition order gap
  // (startNewRound is defined before gameLoop, but needs to sync state to it)
  const gameLoopResetRef = useRef<((state: RoundState) => void) | null>(null)

  const [roundState, setRoundState] = useState<RoundState>(() =>
    createRoundState({
      grapeCount: settings.grapeCount ?? 24,
      totalWaves: settings.wavesPerRound ?? 8,
      focusKeys: gameState.focusKeys.length > 0 ? gameState.focusKeys : ['a', 's', 'd', 'f'],
      fillerKeys: gameState.fillerKeys,
      maxInvadersPerWave: settings.maxInvadersPerWave ?? 12,
    }),
  )

  const startNewRound = useCallback(() => {
    const focusKeys = gameState.focusKeys.length > 0 ? gameState.focusKeys : ['a', 's', 'd', 'f']
    const newRoundState = createRoundState({
      grapeCount: settings.grapeCount ?? 24,
      totalWaves: settings.wavesPerRound ?? 8,
      focusKeys,
      fillerKeys: gameState.fillerKeys,
      maxInvadersPerWave: settings.maxInvadersPerWave ?? 12,
    })
    setRoundState(newRoundState)
    // Sync to game loop immediately — bypasses React's async batching so the
    // first rAF tick sees the correct focusKeys (fixes calibration race condition)
    gameLoopResetRef.current?.(newRoundState)
    setRoundEndResult(null)
    setShowRoundSummary(false)
    setAccuracyRing(createAccuracyRing())
    roundStartTimeRef.current = Date.now()
    reactionTimesRef.current = []
    setLiveWpm(0)
    // Snapshot accuracy for each focus key at round start
    const snapshot: Record<string, number> = {}
    for (const k of focusKeys) {
      const p = gameState.keyProfiles[k]
      snapshot[k] = p && p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0
    }
    roundStartAccuracyRef.current = snapshot
  }, [gameState.focusKeys, gameState.fillerKeys, gameState.keyProfiles, settings])

  const handleCloseInGameSettings = useCallback(() => {
    const fromHud = settingsSource === 'hud'
    setSettingsSource(null)
    if (fromHud) {
      setPaused(false)
      // Game loop restarts via the auto-start effect when paused becomes false
    }
  }, [settingsSource])

  const handleCollisions = useCallback((events: import('./lib/game-engine').CollisionEvent[]) => {
    const now = Date.now()
    for (const ev of events) {
      const absorbId = absorbIdRef.current++
      setAbsorbs((prev) => [...prev, { id: absorbId, x: ev.position.x, y: ev.position.y, createdAt: now }])
      if (ev.grapeLost) {
        const burstId = grapeBurstIdRef.current++
        setGrapeBursts((prev) => [...prev, { id: burstId, createdAt: now }])
      }
    }
  }, [])

  const handleRoundEnd = useCallback(
    (state: RoundState) => {
      const kills = state.score
      // Use only invaders that actually appeared on screen, not pending ones
      // that were scheduled but never spawned (round can end while invaders
      // are still in the staggered spawn queue)
      const appearedCount = state.totalSpawned - state.pendingSpawns.length
      const accuracy = appearedCount > 0 ? kills / appearedCount : 0

      const elapsedMs = Date.now() - roundStartTimeRef.current
      const wpm = calculateWPM({ charCount: appearedCount, elapsedMs, accuracy })

      const reactions = reactionTimesRef.current
      const avgReactionMs = reactions.length > 0
        ? Math.round(reactions.reduce((s, t) => s + t, 0) / reactions.length)
        : 0

      // Compute keys improved/declined by comparing current accuracy to round-start snapshot
      const snapshot = roundStartAccuracyRef.current
      const keysImproved: string[] = []
      const keysDeclined: string[] = []
      for (const k of Object.keys(snapshot)) {
        const p = gameState.keyProfiles[k]
        if (!p || p.totalAttempts === 0) continue
        const currentAcc = p.correctAttempts / p.totalAttempts
        if (currentAcc > snapshot[k]) {
          keysImproved.push(k)
        } else if (currentAcc < snapshot[k]) {
          keysDeclined.push(k)
        }
      }

      setLastRoundStats({
        grapesLeft: state.grapes,
        accuracy,
        avgReactionMs,
        roundScore: kills,
        wpm,
        roundDurationMs: elapsedMs,
        keysImproved,
        keysDeclined,
      })

      trackEvent('round_ended', {
        result: state.roundResult ?? 'cleared',
        score: kills,
        grapes: state.grapes,
      })

      setRoundEndResult(state.roundResult ?? 'cleared')
    },
    [gameState.keyProfiles],
  )

  const handleRoundEndDone = useCallback(() => {
    setShowRoundSummary(true)
    setRoundEndResult(null)
  }, [])

  const handleNextRound = useCallback(() => {
    trackEvent('round_completed', {
      mode: gameState.mode,
      accuracy: lastRoundStats.accuracy,
      wpm: lastRoundStats.wpm,
      grapes_left: lastRoundStats.grapesLeft,
      round_duration_ms: lastRoundStats.roundDurationMs,
    })
    gameState.completeRound({
      grapesLeft: lastRoundStats.grapesLeft,
      accuracy: lastRoundStats.accuracy,
      avgReactionMs: lastRoundStats.avgReactionMs,
      roundScore: lastRoundStats.roundScore,
      wpm: lastRoundStats.wpm,
      roundDurationMs: lastRoundStats.roundDurationMs,
    })
    setShowRoundSummary(false)
    setCountdownValue(3)
  }, [gameState, lastRoundStats])

  const countdownRef = useRef<number>(0)
  useEffect(() => {
    if (countdownValue === null) return
    // Cancel countdown if screen transitioned away from playing
    // (e.g., last calibration round → calibration-summary)
    if (gameState.screen !== 'playing') {
      setCountdownValue(null) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }
    if (countdownValue <= 0) {
      countdownRef.current = window.setTimeout(() => {
        setCountdownValue(null)
        startNewRound()
      }, 0)
      return () => clearTimeout(countdownRef.current)
    }
    const timer = setTimeout(() => setCountdownValue((v) => (v !== null ? v - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [countdownValue, startNewRound, gameState.screen])

  // Cleanup explosions after 300ms
  useEffect(() => {
    if (explosions.length === 0) return
    const timer = setTimeout(() => {
      const now = Date.now()
      setExplosions((prev) => prev.filter((e) => now - e.createdAt < 300))
    }, 350)
    return () => clearTimeout(timer)
  }, [explosions])

  // Cleanup absorb effects after 400ms
  useEffect(() => {
    if (absorbs.length === 0) return
    const timer = setTimeout(() => {
      const now = Date.now()
      setAbsorbs((prev) => prev.filter((e) => now - e.createdAt < 400))
    }, 450)
    return () => clearTimeout(timer)
  }, [absorbs])

  // Cleanup grape bursts after 500ms
  useEffect(() => {
    if (grapeBursts.length === 0) return
    const timer = setTimeout(() => {
      const now = Date.now()
      setGrapeBursts((prev) => prev.filter((e) => now - e.createdAt < 500))
    }, 550)
    return () => clearTimeout(timer)
  }, [grapeBursts])

  const handleStateChange = useCallback((state: RoundState) => {
    setRoundState(state)
    // Compute live WPM from current round data
    const appearedCount = state.totalSpawned - state.pendingSpawns.length
    const kills = state.score
    const accuracy = appearedCount > 0 ? kills / appearedCount : 0
    const elapsedMs = Date.now() - roundStartTimeRef.current
    setLiveWpm(calculateWPM({ charCount: appearedCount, elapsedMs, accuracy }))
  }, [])

  const baseSpeed = SPEED_PRESETS[settings.speedPreset] ?? 50

  const gameLoop = useGameLoop({
    roundState,
    onRoundEnd: handleRoundEnd,
    onStateChange: handleStateChange,
    onCollisions: handleCollisions,
    boardSize: viewportSize,
    baseSpeed,
    calibrationMode: gameState.mode === 'calibration',
  })

  useEffect(() => {
    gameLoopResetRef.current = gameLoop.resetState
  }, [gameLoop.resetState])

  const prevScreenRef = useRef(gameState.screen)
  useEffect(() => {
    if (prevScreenRef.current !== 'playing' && gameState.screen === 'playing') {
      startNewRound() // eslint-disable-line react-hooks/set-state-in-effect
    }
    prevScreenRef.current = gameState.screen
  }, [gameState.screen, startNewRound])

  useEffect(() => {
    if (gameState.screen === 'playing' && !paused && !roundEndResult && !showRoundSummary && countdownValue === null) {
      if (!gameLoop.running) {
        gameLoop.start()
      }
    }
  }, [gameState.screen, paused, roundEndResult, showRoundSummary, countdownValue, gameLoop])

  const { screen, recordKeyResult } = gameState
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (screen !== 'playing') return

      if (e.key === 'Escape') {
        // Ignore Escape during transition screens (round-end, countdown, round summary)
        if (roundEndResult || countdownValue !== null || showRoundSummary) return
        if (showRecalConfirm) {
          setShowRecalConfirm(false)
          setPaused(false)
          return
        }
        if (settingsSource !== null) {
          handleCloseInGameSettings()
          return
        }
        if (!paused) {
          const times = reactionTimesRef.current
          setPauseAvgReactionMs(
            times.length > 0
              ? Math.round(times.reduce((s, t) => s + t, 0) / times.length)
              : 0,
          )
          gameLoop.stop()
        } else {
          gameLoop.start()
        }
        setPaused((p) => !p)
        return
      }

      if (e.key === 'Enter' && showRoundSummary) {
        handleNextRound()
        return
      }

      if (!paused && !roundEndResult && !showRoundSummary && countdownValue === null) {
        // Ignore modifier keys, function keys, arrow keys, etc. — only single printable characters
        if (e.key.length !== 1) return
        const key = e.key.toLowerCase()
        // Only process keys that have invader characters (Space, backtick, etc. are not in KEY_GROUPS)
        if (!ALL_KEYS.includes(key)) return

        const result = gameLoop.handleKeyPress(key)
        if (result.hit && result.reactionTimeMs !== undefined) {
          recordKeyResult(key, true, result.reactionTimeMs)
          reactionTimesRef.current.push(result.reactionTimeMs)
        } else {
          recordKeyResult(key, false, 0)
        }
        setAccuracyRing((ring) => (result.hit ? recordHit(ring) : recordMiss(ring)))
        if (result.hit && result.destroyedPosition) {
          const id = explosionIdRef.current++
          const color = getCharColor(key, settings.colorBlindMode).primary
          setExplosions((prev) => [...prev, { id, x: result.destroyedPosition!.x, y: result.destroyedPosition!.y, color, createdAt: Date.now() }])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, recordKeyResult, paused, roundEndResult, showRoundSummary, countdownValue, gameLoop, settingsSource, handleCloseInGameSettings, showRecalConfirm, settings.colorBlindMode, handleNextRound])

  const roundName =
    gameState.mode === 'calibration'
      ? `Calibration: ${gameState.calibrationRoundName ?? 'Unknown'}`
      : `Practice: ${gameState.focusKeys.join(' ')}`

  const keyStats = Object.values(gameState.keyProfiles).map((p) => ({
    key: p.key,
    accuracy: p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0,
    avgSpeedMs: Math.round(p.averageTimeMs),
    totalKills: p.lifetimeKills ?? p.correctAttempts,
    bestAccuracy: p.bestAccuracy ?? (p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0),
    bestSpeedMs: Math.round(p.bestSpeedMs || p.averageTimeMs),
    trend: computeTrend(p),
  }))

  // Screen routing
  const renderScreen = () => {
    switch (gameState.screen) {
      case 'menu':
        return (
          <>
            {gameState.dataWasWiped && (
              <div data-testid="data-wiped-notice" style={{
                textAlign: 'center', padding: '0.5rem', background: '#4a3a00', color: '#ffd700', fontSize: '0.9rem',
              }}>
                Data format updated. Starting fresh calibration.
              </div>
            )}
            <MainMenu
              onStartGame={gameState.startGame}
              onStats={gameState.goToStats}
              onSettings={gameState.goToSettings}
              onRecalibrate={gameState.recalibrate}
            />
          </>
        )

      case 'demo':
        return <OnboardingDemo onComplete={gameState.completeDemo} boardSize={viewportSize} />

      case 'stats':
        return <StatsScreen keyStats={keyStats} onBack={gameState.goToMenu} totalRounds={gameState.totalRounds} totalPlayTimeMs={gameState.totalPlayTimeMs} />

      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdate={gameState.updateSettings}
            onBack={gameState.goToMenu}
          />
        )

      case 'calibration-summary': {
        const profiles = Object.values(gameState.keyProfiles)
        const totalAttempts = profiles.reduce((s, p) => s + p.totalAttempts, 0)
        const totalCorrect = profiles.reduce((s, p) => s + p.correctAttempts, 0)
        const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
        const strongKeys = [...profiles]
          .filter((p) => p.totalAttempts > 0)
          .sort((a, b) => {
            const accA = a.correctAttempts / a.totalAttempts
            const accB = b.correctAttempts / b.totalAttempts
            return accB - accA
          })
          .slice(0, 5)
          .map((p) => p.key)

        return (
          <div data-testid="calibration-summary" className="calibration-summary">
            <h2>Calibration Complete</h2>
            <p data-testid="overall-accuracy">Overall Accuracy: {overallAccuracy}%</p>
            <p data-testid="strongest-keys">Strongest keys: {strongKeys.join(', ') || 'N/A'}</p>
            <p data-testid="weakest-keys">Weakest keys: {gameState.weakKeys.join(', ') || 'None identified yet'}</p>
            <button onClick={gameState.beginPractice}>Begin Practice</button>
          </div>
        )
      }

      case 'playing':
        return (
          <>
            <HUD
              wpm={liveWpm}
              learningSpeed={gameState.roundHistory.length < 10 ? null : gameState.learningSpeed}
              weakKeys={gameState.weakKeys}
              roundName={roundName}
              currentWave={roundState.currentWave}
              totalWaves={roundState.totalWaves}
              grapes={roundState.grapes}
              maxGrapes={roundState.maxGrapes}
              roundScore={roundState.score}
              highScore={gameState.highScore}
              onRecalibrate={() => {
                gameLoop.stop()
                setPaused(true)
                setShowRecalConfirm(true)
              }}
              onOpenSettings={() => {
                gameLoop.stop()
                setPaused(true)
                setSettingsSource('hud')
              }}
            />
            <GameBoard roundState={roundState} accuracyRing={accuracyRing} boardSize={viewportSize} explosions={explosions} absorbs={absorbs} grapeBursts={grapeBursts} colorBlindMode={settings.colorBlindMode} />

            {paused && (
              <PauseMenu
                roundStats={{
                  accuracy: (roundState.totalSpawned - roundState.pendingSpawns.length) > 0
                    ? roundState.score / (roundState.totalSpawned - roundState.pendingSpawns.length)
                    : 0,
                  kills: roundState.score,
                  avgReactionMs: pauseAvgReactionMs,
                }}
                onResume={() => {
                  setPaused(false)
                  gameLoop.start()
                }}
                onSettings={() => setSettingsSource('pause')}
                onQuit={() => {
                  trackEvent('round_abandoned', {
                    mode: gameState.mode,
                    wave: roundState.currentWave,
                    total_waves: roundState.totalWaves,
                  })
                  setPaused(false)
                  gameLoop.stop()
                  gameState.quitRound()
                }}
              />
            )}

            {settingsSource !== null && (
              <div className="in-game-settings-overlay">
                <SettingsScreen
                  settings={settings}
                  onUpdate={gameState.updateSettings}
                  onBack={handleCloseInGameSettings}
                />
              </div>
            )}

            {showRecalConfirm && (
              <div data-testid="recalibrate-confirm-overlay" className="in-game-settings-overlay">
                <div className="confirm-dialog" style={{ textAlign: 'center', padding: '2rem' }}>
                  <h3>Recalibrate?</h3>
                  <p>Reset all key profiles and restart calibration?</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Round progress will be lost.</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button onClick={() => {
                      setShowRecalConfirm(false)
                      setPaused(false)
                      gameState.recalibrate()
                      gameState.goToMenu()
                    }}>Confirm</button>
                    <button onClick={() => {
                      setShowRecalConfirm(false)
                      setPaused(false)
                    }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {roundEndResult && (
              <RoundEnd result={roundEndResult} onDone={handleRoundEndDone} />
            )}

            {countdownValue !== null && (
              <Countdown value={countdownValue} />
            )}

            {showRoundSummary && (
              <RoundSummary
                grapesLeft={lastRoundStats.grapesLeft}
                maxGrapes={roundState.maxGrapes}
                accuracy={lastRoundStats.accuracy}
                avgReactionMs={lastRoundStats.avgReactionMs}
                roundScore={lastRoundStats.roundScore}
                isNewHighScore={lastRoundStats.roundScore > gameState.highScore}
                nextFocusKeys={gameState.nextCalibrationKeys ?? gameState.weakKeys.slice(0, 5)}
                keysImproved={lastRoundStats.keysImproved}
                keysDeclined={lastRoundStats.keysDeclined}
                onNextRound={handleNextRound}
              />
            )}
          </>
        )

      default:
        return null
    }
  }

  return (
    <div data-testid="app" className="dark app">
      {renderScreen()}
      <a
        href="https://github.com/hippogriff-ai/typecraft"
        target="_blank"
        rel="noopener noreferrer"
        className="github-link"
        aria-label="View source on GitHub"
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </a>
    </div>
  )
}

export default App

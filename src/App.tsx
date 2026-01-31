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
import type { Settings } from './lib/settings'
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
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return size
}

function App() {
  const gameState = useGameState()
  const settings = gameState.settings as Settings
  const viewportSize = useViewportSize()
  const [paused, setPaused] = useState(false)
  const [pauseAvgReactionMs, setPauseAvgReactionMs] = useState(0)
  const [roundEndResult, setRoundEndResult] = useState<'cleared' | 'grapes_lost' | null>(null)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [lastRoundStats, setLastRoundStats] = useState({
    grapesLeft: 0,
    accuracy: 0,
    avgReactionMs: 0,
    roundScore: 0,
    wpm: 0,
    keysImproved: [] as string[],
    keysDefined: [] as string[],
  })

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

  const [roundState, setRoundState] = useState<RoundState>(() =>
    createRoundState({
      grapeCount: settings.grapeCount ?? 24,
      totalWaves: settings.wavesPerRound ?? 8,
      focusKeys: gameState.focusKeys.length > 0 ? gameState.focusKeys : ['a', 's', 'd', 'f'],
    }),
  )

  const startNewRound = useCallback(() => {
    const focusKeys = gameState.focusKeys.length > 0 ? gameState.focusKeys : ['a', 's', 'd', 'f']
    setRoundState(
      createRoundState({
        grapeCount: settings.grapeCount ?? 24,
        totalWaves: settings.wavesPerRound ?? 8,
        focusKeys,
      }),
    )
    setRoundEndResult(null)
    setShowRoundSummary(false)
    setAccuracyRing(createAccuracyRing())
    roundStartTimeRef.current = Date.now()
    reactionTimesRef.current = []
    // Snapshot accuracy for each focus key at round start
    const snapshot: Record<string, number> = {}
    for (const k of focusKeys) {
      const p = gameState.keyProfiles[k]
      snapshot[k] = p && p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0
    }
    roundStartAccuracyRef.current = snapshot
  }, [gameState.focusKeys, gameState.keyProfiles, settings])

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
      const totalChars = state.totalSpawned
      const kills = state.score
      const accuracy = totalChars > 0 ? kills / totalChars : 0

      const elapsedMs = Date.now() - roundStartTimeRef.current
      const wpm = calculateWPM({ charCount: totalChars, elapsedMs, accuracy })

      const reactions = reactionTimesRef.current
      const avgReactionMs = reactions.length > 0
        ? Math.round(reactions.reduce((s, t) => s + t, 0) / reactions.length)
        : 0

      // Compute keys improved/declined by comparing current accuracy to round-start snapshot
      const snapshot = roundStartAccuracyRef.current
      const keysDefined: string[] = []
      const keysImproved: string[] = []
      for (const k of Object.keys(snapshot)) {
        const p = gameState.keyProfiles[k]
        if (!p || p.totalAttempts === 0) continue
        keysDefined.push(k)
        const currentAcc = p.correctAttempts / p.totalAttempts
        if (currentAcc > snapshot[k]) {
          keysImproved.push(k)
        }
      }

      setLastRoundStats({
        grapesLeft: state.grapes,
        accuracy,
        avgReactionMs,
        roundScore: kills,
        wpm,
        keysImproved,
        keysDefined,
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
    gameState.completeRound({
      grapesLeft: lastRoundStats.grapesLeft,
      accuracy: lastRoundStats.accuracy,
      avgReactionMs: lastRoundStats.avgReactionMs,
      roundScore: lastRoundStats.roundScore,
      wpm: lastRoundStats.wpm,
    })
    setShowRoundSummary(false)
    setCountdownValue(3)
  }, [gameState, lastRoundStats])

  const countdownRef = useRef<number>(0)
  useEffect(() => {
    if (countdownValue === null) return
    if (countdownValue <= 0) {
      countdownRef.current = window.setTimeout(() => {
        setCountdownValue(null)
        startNewRound()
      }, 0)
      return () => clearTimeout(countdownRef.current)
    }
    const timer = setTimeout(() => setCountdownValue((v) => (v !== null ? v - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [countdownValue, startNewRound])

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
  }, [])

  const baseSpeed = SPEED_PRESETS[(settings.speedPreset as keyof typeof SPEED_PRESETS) ?? 'normal'] ?? 50

  const gameLoop = useGameLoop({
    roundState,
    onRoundEnd: handleRoundEnd,
    onStateChange: handleStateChange,
    onCollisions: handleCollisions,
    boardSize: viewportSize,
    baseSpeed,
    calibrationMode: gameState.mode === 'calibration',
  })

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

      if (!paused && !roundEndResult && !showRoundSummary && countdownValue === null) {
        const result = gameLoop.handleKeyPress(e.key)
        if (result.hit && result.reactionTimeMs !== undefined) {
          recordKeyResult(e.key, true, result.reactionTimeMs)
          reactionTimesRef.current.push(result.reactionTimeMs)
        } else {
          recordKeyResult(e.key, false, 0)
        }
        setAccuracyRing((ring) => (result.hit ? recordHit(ring) : recordMiss(ring)))
        if (result.hit && result.destroyedPosition) {
          const id = explosionIdRef.current++
          const color = getCharColor(e.key).primary
          setExplosions((prev) => [...prev, { id, x: result.destroyedPosition!.x, y: result.destroyedPosition!.y, color, createdAt: Date.now() }])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, recordKeyResult, paused, roundEndResult, showRoundSummary, countdownValue, gameLoop])

  const roundName =
    gameState.mode === 'calibration'
      ? 'Calibration'
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
        return <OnboardingDemo onComplete={gameState.completeDemo} />

      case 'stats':
        return <StatsScreen keyStats={keyStats} onBack={gameState.goToMenu} />

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
              wpm={gameState.currentWPM}
              learningSpeed={gameState.learningSpeed === 0 && gameState.roundHistory.length < 10 ? null : gameState.learningSpeed}
              weakKeys={gameState.weakKeys}
              roundName={roundName}
              currentWave={roundState.currentWave}
              totalWaves={roundState.totalWaves}
              grapes={roundState.grapes}
              maxGrapes={roundState.maxGrapes}
              roundScore={roundState.score}
              highScore={gameState.highScore}
              onRecalibrate={gameState.recalibrate}
              onOpenSettings={gameState.goToSettings}
            />
            <GameBoard roundState={roundState} accuracyRing={accuracyRing} boardSize={viewportSize} explosions={explosions} absorbs={absorbs} grapeBursts={grapeBursts} colorBlindMode={settings.colorBlindMode} onKeyPress={gameLoop.handleKeyPress} />

            {paused && (
              <PauseMenu
                roundStats={{
                  accuracy: roundState.totalSpawned > 0
                    ? roundState.score / roundState.totalSpawned
                    : 0,
                  kills: roundState.score,
                  avgReactionMs: pauseAvgReactionMs,
                }}
                onResume={() => {
                  setPaused(false)
                  gameLoop.start()
                }}
                onSettings={gameState.goToSettings}
                onQuit={() => {
                  setPaused(false)
                  gameLoop.stop()
                  gameState.goToMenu()
                }}
              />
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
                highScore={gameState.highScore}
                isNewHighScore={lastRoundStats.roundScore > gameState.highScore}
                focusKeys={gameState.focusKeys}
                nextFocusKeys={gameState.weakKeys.slice(0, 5)}
                keysImproved={lastRoundStats.keysImproved}
                keysDefined={lastRoundStats.keysDefined}
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
    </div>
  )
}

export default App

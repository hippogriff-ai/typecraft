import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameState } from './hooks/useGameState'
import { useGameLoop } from './hooks/useGameLoop'
import { createRoundState } from './lib/game-engine'
import type { RoundState } from './lib/game-engine'
import { SPEED_PRESETS } from './lib/settings'
import type { Settings } from './lib/settings'
import { GameBoard } from './components/GameBoard'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { OnboardingDemo } from './components/OnboardingDemo'
import { RoundSummary } from './components/RoundSummary'
import { RoundEnd } from './components/RoundEnd'
import { PauseMenu } from './components/PauseMenu'
import { SettingsScreen } from './components/SettingsScreen'
import { StatsScreen } from './components/StatsScreen'
import './App.css'

function App() {
  const gameState = useGameState()
  const settings = gameState.settings as Settings
  const [paused, setPaused] = useState(false)
  const [roundEndResult, setRoundEndResult] = useState<'cleared' | 'grapes_lost' | null>(null)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [lastRoundStats, setLastRoundStats] = useState({
    grapesLeft: 0,
    accuracy: 0,
    avgReactionMs: 0,
    roundScore: 0,
  })

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
  }, [gameState.focusKeys, settings])

  const handleRoundEnd = useCallback(
    (state: RoundState) => {
      const totalChars = state.totalSpawned
      const kills = state.score
      const accuracy = totalChars > 0 ? kills / totalChars : 0

      setLastRoundStats({
        grapesLeft: state.grapes,
        accuracy,
        avgReactionMs: 0,
        roundScore: kills,
      })

      setRoundEndResult(state.roundResult ?? 'cleared')
    },
    [],
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
    })
    setShowRoundSummary(false)
    startNewRound()
  }, [gameState, lastRoundStats, startNewRound])

  const handleStateChange = useCallback((state: RoundState) => {
    setRoundState(state)
  }, [])

  const baseSpeed = SPEED_PRESETS[(settings.speedPreset as keyof typeof SPEED_PRESETS) ?? 'normal'] ?? 50

  const gameLoop = useGameLoop({
    roundState,
    onRoundEnd: handleRoundEnd,
    onStateChange: handleStateChange,
    boardSize: { width: 800, height: 600 },
    baseSpeed,
  })

  const prevScreenRef = useRef(gameState.screen)
  useEffect(() => {
    if (prevScreenRef.current !== 'playing' && gameState.screen === 'playing') {
      startNewRound()
    }
    prevScreenRef.current = gameState.screen
  }, [gameState.screen, startNewRound])

  useEffect(() => {
    if (gameState.screen === 'playing' && !paused && !roundEndResult && !showRoundSummary) {
      if (!gameLoop.running) {
        gameLoop.start()
      }
    }
  }, [gameState.screen, paused, roundEndResult, showRoundSummary, gameLoop])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameState.screen !== 'playing') return

      if (e.key === 'Escape') {
        setPaused((p) => !p)
        if (!paused) {
          gameLoop.stop()
        } else {
          gameLoop.start()
        }
        return
      }

      if (!paused && !roundEndResult && !showRoundSummary) {
        const result = gameLoop.handleKeyPress(e.key)
        gameState.recordKeyResult(e.key, result.hit, result.reactionTimeMs ?? 0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameState.screen, paused, roundEndResult, showRoundSummary, gameLoop])

  const roundName =
    gameState.mode === 'calibration'
      ? 'Calibration'
      : `Practice: ${gameState.focusKeys.join(' ')}`

  const keyStats = Object.values(gameState.keyProfiles).map((p) => ({
    key: p.key,
    accuracy: p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0,
    avgSpeedMs: Math.round(p.averageTimeMs),
    totalKills: p.correctAttempts,
    bestAccuracy: p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts : 0,
    bestSpeedMs: Math.round(p.averageTimeMs),
    trend: 'stable' as const,
  }))

  // Screen routing
  const renderScreen = () => {
    switch (gameState.screen) {
      case 'menu':
        return (
          <MainMenu
            onStartGame={gameState.startGame}
            onStats={gameState.goToStats}
            onSettings={gameState.goToSettings}
            onRecalibrate={gameState.recalibrate}
          />
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

      case 'calibration-summary':
        return (
          <div data-testid="calibration-summary" className="calibration-summary">
            <h2>Calibration Complete</h2>
            <p>Your weakest keys: {gameState.weakKeys.join(', ') || 'None identified yet'}</p>
            <button onClick={gameState.beginPractice}>Begin Practice</button>
          </div>
        )

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
            <GameBoard roundState={roundState} onKeyPress={gameLoop.handleKeyPress} />

            {paused && (
              <PauseMenu
                roundStats={{
                  accuracy: roundState.invaders.length > 0
                    ? roundState.score / roundState.invaders.length
                    : 0,
                  kills: roundState.score,
                  avgReactionMs: 0,
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

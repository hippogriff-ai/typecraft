import { useState, useCallback, useEffect } from 'react'
import { useGameState } from './hooks/useGameState'
import { useGameLoop } from './hooks/useGameLoop'
import { createRoundState } from './lib/game-engine'
import type { RoundState } from './lib/game-engine'
import { SPEED_PRESETS } from './lib/settings'
import type { Settings } from './lib/settings'
import { GameBoard } from './components/GameBoard'
import { HUD } from './components/HUD'
import './App.css'

function App() {
  const gameState = useGameState()
  const settings = gameState.settings as Settings

  const [roundState, setRoundState] = useState<RoundState>(() =>
    createRoundState({
      grapeCount: settings.grapeCount ?? 24,
      totalWaves: settings.wavesPerRound ?? 8,
      focusKeys: gameState.focusKeys.length > 0 ? gameState.focusKeys : ['a', 's', 'd', 'f'],
    }),
  )

  const handleRoundEnd = useCallback((_state: RoundState) => {
    // Will be wired up later for round summary transitions
  }, [])

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return
      gameLoop.handleKeyPress(e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameLoop])

  const roundName =
    gameState.mode === 'calibration'
      ? 'Calibration'
      : `Practice: ${gameState.focusKeys.join(' ')}`

  return (
    <div data-testid="app" className="dark app">
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
    </div>
  )
}

export default App

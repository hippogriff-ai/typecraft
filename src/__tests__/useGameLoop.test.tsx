import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameLoop } from '../hooks/useGameLoop'
import { createRoundState } from '../lib/game-engine'

describe('useGameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts paused and can be started', () => {
    const { result } = renderHook(() =>
      useGameLoop({
        roundState: createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
        onRoundEnd: vi.fn(),
        onStateChange: vi.fn(),
        boardSize: { width: 800, height: 600 },
      }),
    )
    expect(result.current.running).toBe(false)
  })

  it('exposes start and stop controls', () => {
    const { result } = renderHook(() =>
      useGameLoop({
        roundState: createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
        onRoundEnd: vi.fn(),
        onStateChange: vi.fn(),
        boardSize: { width: 800, height: 600 },
      }),
    )
    expect(typeof result.current.start).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.handleKeyPress).toBe('function')
  })

  /**
   * Spec: "Adaptive difficulty: track rolling accuracy over the last 10 invaders.
   * If accuracy > 90%: increase speed by 10%. If accuracy < 50%: decrease speed by 10%."
   * The calibrationMode prop enables adaptive speed adjustments during calibration rounds.
   */
  it('accepts calibrationMode prop without error', () => {
    const { result } = renderHook(() =>
      useGameLoop({
        roundState: createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
        onRoundEnd: vi.fn(),
        onStateChange: vi.fn(),
        boardSize: { width: 800, height: 600 },
        calibrationMode: true,
      }),
    )
    expect(result.current.running).toBe(false)
  })
})

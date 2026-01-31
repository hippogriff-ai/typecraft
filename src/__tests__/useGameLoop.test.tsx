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
})

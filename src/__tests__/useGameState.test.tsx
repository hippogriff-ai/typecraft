import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'

beforeEach(() => {
  localStorage.clear()
})

describe('useGameState — basic state', () => {
  it('starts in calibration mode when no saved state', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.mode).toBe('calibration')
  })

  it('resumes in practice mode when calibration is complete', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: [], complete: true },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.mode).toBe('practice')
  })

  it('provides weak keys ranked by weakness', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.weakKeys).toEqual([])
  })

  it('tracks current WPM from round history', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.currentWPM).toBe(0)
  })

  it('tracks learning speed', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.learningSpeed).toBe(0)
  })

  it('provides current round focus keys', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.focusKeys).toBeDefined()
  })
})

describe('useGameState — first launch flow', () => {
  /**
   * First launch: menu → startGame → demo → completeDemo → calibration playing
   */
  it('starts at menu screen', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.screen).toBe('menu')
  })

  it('transitions to demo on startGame (first time)', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('demo')
  })

  it('transitions from demo to calibration playing', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    act(() => { result.current.completeDemo() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('calibration')
  })

  /**
   * After 5 calibration rounds, transitions to calibration-summary.
   */
  it('transitions to calibration-summary after all 5 calibration rounds', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    act(() => { result.current.completeDemo() })

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300, roundScore: 10 })
      })
    }
    expect(result.current.screen).toBe('calibration-summary')
  })

  /**
   * From calibration-summary, beginPractice transitions to practice mode.
   */
  it('transitions from calibration-summary to practice playing', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    act(() => { result.current.completeDemo() })

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300, roundScore: 10 })
      })
    }

    act(() => { result.current.beginPractice() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('practice')
  })
})

describe('useGameState — returning player', () => {
  /**
   * Returning player with complete calibration starts at menu.
   * Clicking Start Game goes directly to practice playing.
   */
  it('starts at menu and skips demo/calibration on startGame', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.screen).toBe('menu')

    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('practice')
  })
})

describe('useGameState — navigation', () => {
  it('can navigate to stats and back', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.goToStats() })
    expect(result.current.screen).toBe('stats')
    act(() => { result.current.goToMenu() })
    expect(result.current.screen).toBe('menu')
  })

  it('can navigate to settings and back', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.goToSettings() })
    expect(result.current.screen).toBe('settings')
    act(() => { result.current.goToMenu() })
    expect(result.current.screen).toBe('menu')
  })
})

describe('useGameState — recalibrate', () => {
  /**
   * Recalibrate resets to calibration mode but preserves high score.
   * After recalibrate, startGame should go to calibration (no demo since not first launch).
   */
  it('resets to calibration mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: [],
        mode: 'practice',
        highScore: 47,
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.mode).toBe('practice')

    act(() => { result.current.recalibrate() })
    expect(result.current.mode).toBe('calibration')

    // Start game should go to calibration playing (not demo)
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('calibration')
  })
})

describe('useGameState — settings and key profiles', () => {
  it('updateSettings persists changes to localStorage', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.settings.speedPreset).toBe('normal')

    act(() => {
      result.current.updateSettings({ ...result.current.settings, speedPreset: 'fast' })
    })

    expect(result.current.settings.speedPreset).toBe('fast')

    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.settings.speedPreset).toBe('fast')
  })

  /**
   * recordKeyResult updates key profiles with hit/miss data and persists.
   */
  it('recordKeyResult updates key profiles and persists', () => {
    const { result } = renderHook(() => useGameState())
    expect(Object.keys(result.current.keyProfiles)).toHaveLength(0)

    act(() => {
      result.current.recordKeyResult('a', true, 200)
    })

    expect(result.current.keyProfiles['a']).toBeDefined()
    expect(result.current.keyProfiles['a'].correctAttempts).toBe(1)
    expect(result.current.keyProfiles['a'].totalAttempts).toBe(1)

    act(() => {
      result.current.recordKeyResult('a', false, 500)
    })

    expect(result.current.keyProfiles['a'].totalAttempts).toBe(2)
    expect(result.current.keyProfiles['a'].correctAttempts).toBe(1)

    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.keyProfiles['a'].totalAttempts).toBe(2)
  })
})

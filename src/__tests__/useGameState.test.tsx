import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'
import * as waveGenerator from '../lib/wave-generator'

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
        result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300, roundScore: 10, wpm: 30 })
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
        result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300, roundScore: 10, wpm: 30 })
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

describe('useGameState — practice round loop', () => {
  /**
   * In practice mode, completeRound should NOT change the screen away from 'playing'.
   * App.tsx manages round summary overlays and countdown transitions.
   */
  it('completeRound in practice mode keeps screen as playing', () => {
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
        highScore: 0,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('playing')

    act(() => {
      result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300, roundScore: 10, wpm: 30 })
    })
    expect(result.current.screen).toBe('playing')
  })
})

describe('useGameState — practice round updates focus keys', () => {
  /**
   * Spec: "Re-rank weaknesses" and "next round targets current weakest keys"
   * After completing a practice round, focus keys should be re-selected based on updated profiles.
   */
  it('re-ranks focus keys after completing a practice round', () => {
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
        highScore: 0,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })

    // Record some key results to change the weakness rankings
    act(() => {
      result.current.recordKeyResult('(', true, 200)
      result.current.recordKeyResult('(', true, 200)
      result.current.recordKeyResult('[', false, 0)
      result.current.recordKeyResult('[', false, 0)
    })

    // Complete a round
    act(() => {
      result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300, roundScore: 10, wpm: 30 })
    })

    // Focus keys should have been re-selected (they may or may not change,
    // but the completeRound should trigger a re-ranking)
    expect(result.current.focusKeys).toBeDefined()
    expect(result.current.focusKeys.length).toBeGreaterThan(0)
  })
})

describe('useGameState — filler keys from ranked 6-10', () => {
  /**
   * Spec: "Filler source: the player's next-weakest keys (ranked 6-10)."
   * After beginPractice or completeRound in practice mode, fillerKeys should
   * be populated with ranked 6-10 weakest keys (not random ALL_KEYS).
   */
  it('beginPractice sets fillerKeys from ranked weakness profiles', () => {
    // Create 10 key profiles with varying accuracy so getNextPracticeRound
    // can rank them and produce both focusKeys (top 5) and fillerKeys (6-10).
    const profiles: Record<string, unknown> = {}
    const keys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';']
    for (let i = 0; i < keys.length; i++) {
      profiles[keys[i]] = {
        key: keys[i],
        totalAttempts: 20,
        correctAttempts: 2 + i * 2, // a=2/20 (worst), ;=20/20 (best)
        lifetimeKills: 2 + i * 2,
        averageTimeMs: 500 - i * 30,
        bestAccuracy: (2 + i * 2) / 20,
        bestSpeedMs: 500 - i * 30,
        history: [],
      }
    }

    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: profiles,
        roundHistory: [],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: [],
        mode: 'calibration',
        highScore: 0,
      }),
    )

    const { result } = renderHook(() => useGameState())
    act(() => { result.current.beginPractice() })

    expect(result.current.fillerKeys.length).toBeGreaterThan(0)
    expect(result.current.fillerKeys.length).toBeLessThanOrEqual(5)
    // Filler keys should not overlap with focus keys
    for (const fk of result.current.fillerKeys) {
      expect(result.current.focusKeys).not.toContain(fk)
    }
    // Persisted to localStorage
    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.currentFillerKeys).toEqual(result.current.fillerKeys)
  })
})

describe('useGameState — session-level stats', () => {
  /**
   * Spec: "Session-level stats (total rounds, total time)" under Stored Data.
   * completeRound must increment totalRounds and accumulate totalPlayTimeMs.
   */
  it('increments totalRounds and accumulates totalPlayTimeMs on completeRound', () => {
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
        currentFocusKeys: ['a', 's'],
        mode: 'practice',
        totalRounds: 5,
        totalPlayTimeMs: 60000,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })

    act(() => {
      result.current.completeRound({
        grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300,
        roundScore: 10, wpm: 30, roundDurationMs: 45000,
      })
    })

    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.totalRounds).toBe(6)
    expect(stored.totalPlayTimeMs).toBe(105000)
  })
})

describe('useGameState — round history cap', () => {
  /**
   * Defensive: roundHistory should not grow unbounded over long play sessions.
   * Capping prevents localStorage bloat. Learning speed only uses last 10 rounds.
   */
  it('caps roundHistory at 200 entries to prevent localStorage bloat', () => {
    // Pre-fill with 200 history entries
    const history = Array.from({ length: 200 }, (_, i) => ({
      timestamp: 1000 + i,
      wpm: 30,
      grapesLeft: 20,
      focusKeys: ['a'],
      score: 10,
    }))

    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: history,
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: ['a', 's'],
        mode: 'practice',
        highScore: 0,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })

    // Complete a round — should add 1 entry but cap at 200 (oldest dropped)
    act(() => {
      result.current.completeRound({
        grapesLeft: 18, accuracy: 0.9, avgReactionMs: 250,
        roundScore: 15, wpm: 35,
      })
    })

    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.roundHistory.length).toBe(200)
    // Most recent entry should be last
    expect(stored.roundHistory[199].wpm).toBe(35)
    // Oldest entry (timestamp 1000) should have been dropped
    expect(stored.roundHistory[0].timestamp).toBe(1001)
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

  /**
   * Spec: "Order is randomized each time calibration is triggered."
   * recalibrate() must call getCalibrationRounds() again to produce a fresh
   * random order, not reuse the frozen array from initial mount.
   */
  it('regenerates calibration round order on recalibrate', () => {
    const spy = vi.spyOn(waveGenerator, 'getCalibrationRounds')
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
        highScore: 0,
      }),
    )
    const callsBefore = spy.mock.calls.length
    const { result } = renderHook(() => useGameState())
    const callsAfterMount = spy.mock.calls.length
    // getCalibrationRounds called once on mount
    expect(callsAfterMount).toBeGreaterThan(callsBefore)

    act(() => { result.current.recalibrate() })
    // getCalibrationRounds called again on recalibrate
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterMount)
    spy.mockRestore()
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
   * Rapid keypresses within a single React render frame must all be recorded.
   * Bug: recordKeyResult previously read appState from closure, so concurrent
   * calls within one frame would overwrite each other — only the last survived.
   */
  it('rapid keypresses within one act() all update profiles correctly', () => {
    const { result } = renderHook(() => useGameState())

    act(() => {
      result.current.recordKeyResult('a', true, 200)
      result.current.recordKeyResult('s', true, 150)
      result.current.recordKeyResult('d', false, 0)
    })

    expect(result.current.keyProfiles['a']).toBeDefined()
    expect(result.current.keyProfiles['s']).toBeDefined()
    expect(result.current.keyProfiles['d']).toBeDefined()
    expect(result.current.keyProfiles['a'].correctAttempts).toBe(1)
    expect(result.current.keyProfiles['s'].correctAttempts).toBe(1)
    expect(result.current.keyProfiles['d'].totalAttempts).toBe(1)
    expect(result.current.keyProfiles['d'].correctAttempts).toBe(0)

    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.keyProfiles['a']).toBeDefined()
    expect(stored.keyProfiles['s']).toBeDefined()
    expect(stored.keyProfiles['d']).toBeDefined()
  })

  /** updateSettings must not overwrite key profile data recorded in the same render batch. */
  it('updateSettings does not overwrite key profiles from the same batch', () => {
    const { result } = renderHook(() => useGameState())

    act(() => {
      result.current.recordKeyResult('a', true, 200)
      result.current.updateSettings({ ...result.current.settings, speedPreset: 'fast' })
    })

    expect(result.current.keyProfiles['a']).toBeDefined()
    expect(result.current.keyProfiles['a'].correctAttempts).toBe(1)
    expect(result.current.settings.speedPreset).toBe('fast')
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

describe('useGameState — calibration round name', () => {
  /**
   * During calibration, calibrationRoundName should show the display name
   * of the current key group being tested (e.g., "Home Row", "Numbers").
   * In practice mode, it should be null.
   */
  it('exposes calibration group display name during calibration', () => {
    const { result } = renderHook(() => useGameState())
    // Fresh state is calibration mode
    act(() => { result.current.startGame() }) // first launch → demo
    act(() => { result.current.completeDemo() }) // demo → calibration playing
    expect(result.current.calibrationRoundName).not.toBeNull()
    expect(typeof result.current.calibrationRoundName).toBe('string')
    // Should be one of the key group display names
    expect(['Home Row', 'Top Row', 'Bottom Row', 'Numbers', 'Python Symbols']).toContain(
      result.current.calibrationRoundName,
    )
  })

  it('returns null in practice mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: [], complete: true },
        currentFocusKeys: ['a', 's'],
        mode: 'practice',
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.calibrationRoundName).toBeNull()
  })
})

describe('useGameState — nextCalibrationKeys', () => {
  /**
   * During calibration, nextCalibrationKeys should show the focus keys
   * of the NEXT calibration group (not the overall weakest keys).
   * This is used by the round summary to preview the next round correctly.
   */
  it('provides next calibration group keys during calibration', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() }) // first launch → demo
    act(() => { result.current.completeDemo() }) // demo → calibration round 1
    // Before completing any rounds, nextCalibrationKeys should be the 2nd calibration group
    expect(result.current.nextCalibrationKeys).not.toBeNull()
    expect(result.current.nextCalibrationKeys!.length).toBeGreaterThan(0)
    // Must be different from current focusKeys (different calibration group)
    expect(result.current.nextCalibrationKeys).not.toEqual(result.current.focusKeys)
  })

  it('returns null in practice mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: [], complete: true },
        currentFocusKeys: ['a', 's'],
        mode: 'practice',
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.nextCalibrationKeys).toBeNull()
  })
})

describe('useGameState — quit round discards key profile changes', () => {
  /**
   * Spec: "Quit to Menu: confirmation dialog, then discards all round data"
   * When a player quits mid-round, key profile changes accumulated during that
   * round must be rolled back. Only normally completed rounds persist data.
   */
  it('quitRound restores key profiles to pre-round state', () => {
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
        highScore: 0,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('playing')

    // Record some keypresses mid-round (these modify key profiles immediately)
    act(() => {
      result.current.recordKeyResult('(', true, 200)
      result.current.recordKeyResult(')', false, 0)
      result.current.recordKeyResult('[', true, 300)
    })

    // Key profiles should exist now (accumulated during round)
    expect(result.current.keyProfiles['(']).toBeDefined()
    expect(result.current.keyProfiles[')']).toBeDefined()
    expect(result.current.keyProfiles['[']).toBeDefined()

    // Quit mid-round — should discard all round data
    act(() => { result.current.quitRound() })

    // Screen should be menu
    expect(result.current.screen).toBe('menu')

    // Key profiles should be restored to pre-round state (empty since we started fresh)
    expect(Object.keys(result.current.keyProfiles)).toHaveLength(0)

    // localStorage should also be restored
    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(Object.keys(stored.keyProfiles)).toHaveLength(0)
  })

  it('quitRound preserves key profiles from previous completed rounds', () => {
    // Start with an existing key profile from a previously completed round
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {
          'a': {
            key: 'a',
            totalAttempts: 10,
            correctAttempts: 8,
            lifetimeKills: 8,
            averageTimeMs: 250,
            bestAccuracy: 0.8,
            bestSpeedMs: 200,
            history: [],
          },
        },
        roundHistory: [],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
        highScore: 0,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })

    // Record new keypresses during this round
    act(() => {
      result.current.recordKeyResult('a', true, 100)
      result.current.recordKeyResult('(', false, 0)
    })

    // 'a' should have been updated (11 attempts now)
    expect(result.current.keyProfiles['a'].totalAttempts).toBe(11)

    // Quit mid-round
    act(() => { result.current.quitRound() })

    // 'a' should be restored to its pre-round state (10 attempts)
    expect(result.current.keyProfiles['a'].totalAttempts).toBe(10)
    expect(result.current.keyProfiles['a'].correctAttempts).toBe(8)
    // The new '(' profile should be gone
    expect(result.current.keyProfiles['(']).toBeUndefined()

    const stored = JSON.parse(localStorage.getItem('typecraft')!)
    expect(stored.keyProfiles['a'].totalAttempts).toBe(10)
    expect(stored.keyProfiles['(']).toBeUndefined()
  })
})

describe('useGameState — calibration progress survives refresh', () => {
  /**
   * When a player refreshes mid-calibration (e.g., after completing 2 of 5 groups),
   * the calibration order should be restored from localStorage so the player
   * resumes from the correct position without repeating completed groups.
   */
  it('restores calibration round index from completed groups on load', () => {
    // Simulate mid-calibration state: 2 groups completed
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: ['homeRow', 'topRow'], complete: false },
        currentFocusKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
        calibrationOrder: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
        mode: 'calibration',
      }),
    )
    const { result } = renderHook(() => useGameState())
    // Start the game — should resume at round index 2 (bottomRow), not restart at 0
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('calibration')
    // The focus keys should be bottomRow keys (the 3rd group), not homeRow (already done)
    expect(result.current.focusKeys).toEqual(['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'])
    expect(result.current.calibrationRoundName).toBe('Bottom Row')
  })
})

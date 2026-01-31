import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'

beforeEach(() => {
  localStorage.clear()
})

describe('useGameState', () => {
  it('starts in calibration mode when no saved state', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.mode).toBe('calibration')
  })

  it('resumes in practice mode when calibration is complete', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
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

  it('recalibrate resets to calibration mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: [], complete: true },
        currentFocusKeys: [],
        mode: 'practice',
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.mode).toBe('practice')

    act(() => {
      result.current.recalibrate()
    })

    expect(result.current.mode).toBe('calibration')
  })
})

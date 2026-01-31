import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypeCraft } from '../hooks/useTypeCraft'

beforeEach(() => {
  localStorage.clear()
})

describe('useTypeCraft', () => {
  it('starts in calibration mode when no saved state', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.mode).toBe('calibration')
    expect(result.current.calibrationComplete).toBe(false)
  })

  it('resumes in practice mode when saved state has calibration complete', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: ['(', ')'],
      }),
    )
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.mode).toBe('practice')
    expect(result.current.calibrationComplete).toBe(true)
  })

  it('provides weak keys ranked by weakness', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.weakKeys).toEqual([])
  })

  it('tracks current WPM', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.currentWPM).toBe(0)
  })

  it('tracks learning speed', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.learningSpeed).toBe(0)
  })

  it('recalibrate resets to calibration mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: [],
      }),
    )
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.mode).toBe('practice')

    act(() => {
      result.current.recalibrate()
    })

    expect(result.current.mode).toBe('calibration')
    expect(result.current.calibrationComplete).toBe(false)
  })
})

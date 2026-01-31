import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('shows game board on launch', () => {
    render(<App />)
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })

  it('shows HUD with stats', () => {
    render(<App />)
    expect(screen.getByTestId('hud')).toBeInTheDocument()
  })

  it('starts in calibration mode on first launch', () => {
    render(<App />)
    expect(screen.getByTestId('round-name')).toBeDefined()
  })

  it('shows recalibrate button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /recalibrate/i })).toBeInTheDocument()
  })

  it('has dark theme styling', () => {
    render(<App />)
    const app = screen.getByTestId('app')
    expect(app).toHaveClass('dark')
  })

  it('resumes practice mode from localStorage', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {
          a: { key: 'a', totalAttempts: 5, correctAttempts: 5, averageTimeMs: 200, history: [] },
        },
        roundHistory: [{ timestamp: Date.now(), wpm: 30, grapesLeft: 8, focusKeys: ['a'] }],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
      }),
    )
    render(<App />)
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })
})

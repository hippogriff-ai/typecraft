/**
 * Tests for the App shell integration.
 * Verifies screen navigation: menu on launch, demo for first-time, direct play for returning player,
 * dark theme, and stats/settings navigation. Can be simplified if screen flow changes.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

describe('App — first launch', () => {
  it('shows main menu on launch', () => {
    render(<App />)
    expect(screen.getByText(/typecraft/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('has dark theme styling', () => {
    render(<App />)
    const app = screen.getByTestId('app')
    expect(app).toHaveClass('dark')
  })

  it('transitions to demo when Start Game is clicked (first time)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByText(/type the character/i)).toBeInTheDocument()
  })
})

describe('App — returning player', () => {
  it('shows main menu with saved state', () => {
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
    render(<App />)
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('goes directly to playing on Start Game (no demo, no calibration)', async () => {
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
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })
})

/**
 * Spec: "On version mismatch or JSON parse error: wipe all data and restart calibration.
 * Show a brief notice to the player: 'Data format updated. Starting fresh calibration.'"
 */
describe('App — schema wipe notice', () => {
  it('shows data wipe notice when schema version mismatches', () => {
    localStorage.setItem('typecraft', JSON.stringify({ schemaVersion: -1, keyProfiles: {} }))
    render(<App />)
    expect(screen.getByTestId('data-wiped-notice')).toHaveTextContent('Data format updated')
  })

  it('does not show notice on normal first launch', () => {
    render(<App />)
    expect(screen.queryByTestId('data-wiped-notice')).not.toBeInTheDocument()
  })
})

describe('App — navigation', () => {
  it('can navigate to stats and back', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /stats/i }))
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('can navigate to settings and back', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })
})

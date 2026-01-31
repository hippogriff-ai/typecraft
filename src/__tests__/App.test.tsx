/**
 * Tests for the App shell integration.
 * Verifies screen navigation: menu on launch, demo for first-time, direct play for returning player,
 * dark theme, and stats/settings navigation. Can be simplified if screen flow changes.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

/**
 * Spec: "Settings: accessible from main menu, HUD gear icon, and pause menu."
 * Bug fix: Settings opened during gameplay must return to the game, not the main menu.
 * The settings screen renders as an overlay on top of the game board.
 */
describe('App — in-game settings overlay', () => {
  const setupReturningPlayer = () => {
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
  }

  it('HUD gear opens settings overlay without leaving gameplay', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^settings$/i }))
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument()
    // Game board still in DOM behind overlay
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })

  it('closing settings from HUD returns to live game, not menu', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    await user.click(screen.getByRole('button', { name: /^settings$/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))

    // Game board visible, no menu
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument()
    // Settings overlay gone
    expect(screen.queryByTestId('settings-screen')).not.toBeInTheDocument()
  })

  it('settings from pause menu returns to pause, not menu', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))

    await user.keyboard('{Escape}')
    const pauseMenu = screen.getByTestId('pause-menu')
    expect(pauseMenu).toBeInTheDocument()

    // Click Settings within the pause menu (not the HUD gear)
    await user.click(within(pauseMenu).getByRole('button', { name: /settings/i }))
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back/i }))
    // Pause menu visible again, not main menu
    expect(screen.getByTestId('pause-menu')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument()
  })

  it('Escape closes in-game settings overlay', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))

    await user.click(screen.getByRole('button', { name: /^settings$/i }))
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('settings-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })
})

/**
 * Spec: "Recalibrate: confirmation dialog, then resets key profiles and restarts calibration."
 * Bug fix: HUD recalibrate button during gameplay previously called recalibrate() directly
 * without confirmation or screen transition, leaving the game in a broken state.
 * Now it pauses the game and shows a confirmation overlay first.
 */
describe('App — HUD recalibrate confirmation', () => {
  const setupReturningPlayer = () => {
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
  }

  it('HUD recalibrate shows confirmation overlay, not immediate recalibrate', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /recalibrate/i }))
    expect(screen.getByTestId('recalibrate-confirm-overlay')).toBeInTheDocument()
    // Game board still in DOM behind overlay
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })

  it('confirming recalibrate goes to main menu', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    await user.click(screen.getByRole('button', { name: /recalibrate/i }))

    await user.click(screen.getByRole('button', { name: /confirm/i }))
    // Should be back at main menu
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
    expect(screen.queryByTestId('recalibrate-confirm-overlay')).not.toBeInTheDocument()
  })

  it('cancelling recalibrate returns to gameplay', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    await user.click(screen.getByRole('button', { name: /recalibrate/i }))

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    // Game board visible, overlay gone, no menu
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
    expect(screen.queryByTestId('recalibrate-confirm-overlay')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument()
  })
})

/**
 * Spec: Keys are from KEY_GROUPS (homeRow, topRow, bottomRow, numbers, pythonSymbols).
 * Modifier keys (Shift, Control, Alt), function keys (F1-F12), and arrow keys must be
 * ignored during gameplay — they should never create phantom key profiles that would
 * contaminate weakness ranking or become focus keys.
 */
describe('App — keyboard input filtering', () => {
  const setupReturningPlayer = () => {
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
  }

  /**
   * Pressing modifier keys (Shift, Control, Alt) during gameplay must not create
   * phantom key profiles. Without filtering, these would get 100% miss rate and
   * be ranked as the weakest keys, eventually becoming focus keys with unmatchable
   * invader labels.
   */
  it('ignores modifier keys during gameplay — no phantom profiles', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()

    await user.keyboard('{Shift}')
    await user.keyboard('{Control}')
    await user.keyboard('{Alt}')

    const state = JSON.parse(localStorage.getItem('typecraft')!)
    expect(state.keyProfiles['Shift']).toBeUndefined()
    expect(state.keyProfiles['Control']).toBeUndefined()
    expect(state.keyProfiles['Alt']).toBeUndefined()
  })

  /**
   * Space key has e.key.length === 1 but is not a valid invader character from
   * KEY_GROUPS. Without filtering against ALL_KEYS, pressing Space would create
   * a phantom ' ' key profile with 100% miss rate, polluting weakness ranking.
   */
  it('ignores Space key — not a valid invader character', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()

    await user.keyboard(' ')

    const state = JSON.parse(localStorage.getItem('typecraft')!)
    expect(state.keyProfiles[' ']).toBeUndefined()
  })

  /**
   * When CapsLock is on or Shift+letter is pressed, the browser fires e.key='A'
   * (uppercase). Since invaders use lowercase characters from KEY_GROUPS, the input
   * must be normalized to lowercase so it matches correctly.
   */
  it('normalizes uppercase keypresses to lowercase', async () => {
    setupReturningPlayer()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()

    await user.keyboard('A')

    const state = JSON.parse(localStorage.getItem('typecraft')!)
    expect(state.keyProfiles['A']).toBeUndefined()
    expect(state.keyProfiles['a']).toBeDefined()
    expect(state.keyProfiles['a'].totalAttempts).toBe(1)
  })
})

/**
 * Bug fix: HUD displayed gameState.currentWPM (rolling average of last 5 rounds)
 * during gameplay instead of live round WPM. This caused WPM to show the historical
 * average (e.g., 30) at the start of a new round instead of 0, and it never updated
 * during gameplay. Fix: compute live WPM from the current round's appearedCount,
 * accuracy, and elapsed time in handleStateChange, pass to HUD.
 */
describe('App — live WPM during gameplay', () => {
  it('HUD shows live round WPM (0 at start) not between-rounds average', async () => {
    // Set up a returning player with round history averaging ~30 WPM
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: { a: { key: 'a', totalAttempts: 10, correctAttempts: 8, lifetimeKills: 8, averageTimeMs: 250, bestAccuracy: 0, bestSpeedMs: 150, history: [] } },
        roundHistory: [
          { timestamp: 1, wpm: 30, score: 10, focusKeys: ['a'], grapesSurvived: 20 },
          { timestamp: 2, wpm: 32, score: 12, focusKeys: ['a'], grapesSurvived: 18 },
          { timestamp: 3, wpm: 28, score: 9, focusKeys: ['a'], grapesSurvived: 22 },
          { timestamp: 4, wpm: 31, score: 11, focusKeys: ['a'], grapesSurvived: 19 },
          { timestamp: 5, wpm: 29, score: 10, focusKeys: ['a'], grapesSurvived: 21 },
        ],
        calibrationProgress: { completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'], complete: true },
        currentFocusKeys: ['a'],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()

    // HUD WPM should show 0 (live round, no kills yet) not ~30 (between-rounds avg)
    const wpmEl = screen.getByTestId('wpm')
    expect(wpmEl).toHaveTextContent('WPM:0')
  })
})

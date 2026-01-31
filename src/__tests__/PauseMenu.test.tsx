/**
 * Tests for the PauseMenu component.
 * Verifies pause header, round stats display, resume/settings/quit buttons,
 * and quit confirmation flow (confirm/cancel). Can be simplified if pause UI restructures.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseMenu } from '../components/PauseMenu'

describe('PauseMenu', () => {
  const defaultProps = {
    roundStats: { accuracy: 0.82, kills: 15, avgReactionMs: 280 },
    onResume: vi.fn(),
    onSettings: vi.fn(),
    onQuit: vi.fn(),
  }

  it('shows PAUSED header', () => {
    render(<PauseMenu {...defaultProps} />)
    expect(screen.getByText(/paused/i)).toBeInTheDocument()
  })

  it('shows Resume button that calls onResume', async () => {
    const onResume = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onResume={onResume} />)
    await user.click(screen.getByRole('button', { name: /resume/i }))
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  /**
   * Spec lists "Current Round Stats" as a labeled section in the pause menu,
   * showing accuracy, kills, and reaction speed for the current round.
   */
  it('shows current round stats with heading', () => {
    render(<PauseMenu {...defaultProps} />)
    expect(screen.getByText(/current round stats/i)).toBeInTheDocument()
    expect(screen.getByText(/82%/)).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/280/)).toBeInTheDocument()
  })

  it('shows Quit to Menu button', () => {
    render(<PauseMenu {...defaultProps} />)
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })

  it('shows confirmation dialog on quit click', async () => {
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /quit/i }))
    expect(screen.getByText(/round progress will be lost/i)).toBeInTheDocument()
  })

  it('calls onQuit after confirming quit', async () => {
    const onQuit = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onQuit={onQuit} />)
    await user.click(screen.getByRole('button', { name: /quit/i }))
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onQuit).toHaveBeenCalledTimes(1)
  })

  it('cancelling quit returns to pause menu', async () => {
    const onQuit = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onQuit={onQuit} />)
    await user.click(screen.getByRole('button', { name: /quit/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onQuit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
  })

  it('has a Settings button', async () => {
    const onSettings = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onSettings={onSettings} />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })
})

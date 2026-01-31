/**
 * Tests for the MainMenu component.
 * Verifies game title display and all 4 navigation buttons (Start, Stats, Settings, Recalibrate).
 * Can be simplified if menu layout changes — only button presence and callbacks matter.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MainMenu } from '../components/MainMenu'

describe('MainMenu', () => {
  const defaultProps = {
    onStartGame: vi.fn(),
    onStats: vi.fn(),
    onSettings: vi.fn(),
    onRecalibrate: vi.fn(),
  }

  it('shows the game title', () => {
    render(<MainMenu {...defaultProps} />)
    expect(screen.getByText(/typecraft/i)).toBeInTheDocument()
  })

  it('has a Start Game button that calls onStartGame', async () => {
    const onStart = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onStartGame={onStart} />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('has a Stats button that calls onStats', async () => {
    const onStats = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onStats={onStats} />)
    await user.click(screen.getByRole('button', { name: /stats/i }))
    expect(onStats).toHaveBeenCalledTimes(1)
  })

  it('has a Settings button that calls onSettings', async () => {
    const onSettings = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onSettings={onSettings} />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })

  it('has a Recalibrate button that calls onRecalibrate', async () => {
    const onRecal = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onRecalibrate={onRecal} />)
    await user.click(screen.getByRole('button', { name: /recalibrate/i }))
    expect(onRecal).toHaveBeenCalledTimes(1)
  })
})

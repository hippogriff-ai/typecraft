/**
 * Tests for the SettingsScreen component.
 * Verifies display of current settings values, speed preset buttons, and back navigation.
 * Can be simplified if settings UI uses dropdowns instead of buttons.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsScreen } from '../components/SettingsScreen'
import { DEFAULT_SETTINGS } from '../lib/settings'

describe('SettingsScreen', () => {
  const defaultProps = {
    settings: DEFAULT_SETTINGS,
    onUpdate: vi.fn(),
    onBack: vi.fn(),
  }

  it('displays current grape count', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/24/)).toBeInTheDocument()
  })

  it('displays current speed preset', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/Speed: normal/i)).toBeInTheDocument()
  })

  it('displays current max invaders per wave', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/12/)).toBeInTheDocument()
  })

  it('displays current waves per round', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('has a back button', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<SettingsScreen {...defaultProps} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdate when a speed preset is changed', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<SettingsScreen {...defaultProps} onUpdate={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /fast/i }))
    expect(onUpdate).toHaveBeenCalled()
  })
})

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

  /**
   * Spec: "Color-blind modes: 2-3 alternative color palettes (deuteranopia, protanopia). Toggled in settings."
   * Verifies the color-blind mode buttons display, toggle, and report the correct mode.
   */
  it('displays current color-blind mode as Off by default', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/Color-blind Mode: Off/)).toBeInTheDocument()
  })

  it('calls onUpdate with deuteranopia when Deuteranopia button is clicked', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<SettingsScreen {...defaultProps} onUpdate={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /deuteranopia/i }))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ colorBlindMode: 'deuteranopia' }),
    )
  })

  it('calls onUpdate with protanopia when Protanopia button is clicked', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<SettingsScreen {...defaultProps} onUpdate={onUpdate} />)
    await user.click(screen.getByRole('button', { name: /protanopia/i }))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ colorBlindMode: 'protanopia' }),
    )
  })

  /** All range sliders should have aria-labels for screen reader accessibility. */
  it('has aria-labels on all range inputs', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByRole('slider', { name: /grapes: 24/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /max invaders per wave: 12/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /waves per round: 8/i })).toBeInTheDocument()
  })

  it('shows correct aria-pressed state for active color-blind mode', () => {
    render(
      <SettingsScreen
        {...defaultProps}
        settings={{ ...DEFAULT_SETTINGS, colorBlindMode: 'deuteranopia' }}
      />,
    )
    expect(screen.getByRole('button', { name: /^off$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /deuteranopia/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /protanopia/i })).toHaveAttribute('aria-pressed', 'false')
  })
})

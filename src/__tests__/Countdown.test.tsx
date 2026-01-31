import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Countdown } from '../components/Countdown'

describe('Countdown', () => {
  /**
   * The countdown value must be rendered visibly so the player knows
   * how many seconds remain before the next round starts.
   */
  it('renders the countdown value', () => {
    render(<Countdown value={3} />)
    expect(screen.getByTestId('countdown')).toHaveTextContent('3')
  })

  /**
   * Screen readers need role="status" and aria-live="assertive" to
   * announce each tick of the countdown (3, 2, 1) without user interaction.
   */
  it('has accessible live region attributes', () => {
    render(<Countdown value={2} />)
    const el = screen.getByTestId('countdown')
    expect(el).toHaveAttribute('role', 'status')
    expect(el).toHaveAttribute('aria-live', 'assertive')
  })

  it('updates aria-label when value changes', () => {
    const { rerender } = render(<Countdown value={3} />)
    expect(screen.getByTestId('countdown')).toHaveAttribute('aria-label', '3')
    rerender(<Countdown value={1} />)
    expect(screen.getByTestId('countdown')).toHaveAttribute('aria-label', '1')
  })
})

/**
 * Tests for the RoundEnd and Countdown components.
 * Verifies "ROUND CLEAR"/"GAME OVER" display based on result, and countdown number rendering.
 * Can be simplified if round end screen adds animations — only text content matters here.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoundEnd } from '../components/RoundEnd'
import { Countdown } from '../components/Countdown'

describe('RoundEnd', () => {
  it('shows ROUND CLEAR when result is cleared', () => {
    render(<RoundEnd result="cleared" onDone={vi.fn()} />)
    expect(screen.getByText(/round clear/i)).toBeInTheDocument()
  })

  it('shows GAME OVER when result is grapes_lost', () => {
    render(<RoundEnd result="grapes_lost" onDone={vi.fn()} />)
    expect(screen.getByText(/game over/i)).toBeInTheDocument()
  })

  /**
   * Spec: "Grapes lost: 'GAME OVER' with dramatic animation (cluster shatters, 1-2 seconds)"
   * The shatter effect renders grape-colored particles that scatter outward from center.
   */
  it('renders shatter particles on game over', () => {
    render(<RoundEnd result="grapes_lost" onDone={vi.fn()} />)
    const particles = screen.getAllByTestId(/^shatter-particle-/)
    expect(particles.length).toBeGreaterThanOrEqual(8)
  })

  /**
   * Spec: "Waves cleared: brief 'ROUND CLEAR' celebration screen (1-2 seconds)"
   * The celebration effect does NOT render shatter particles.
   */
  it('does not render shatter particles on round clear', () => {
    render(<RoundEnd result="cleared" onDone={vi.fn()} />)
    expect(screen.queryAllByTestId(/^shatter-particle-/)).toHaveLength(0)
  })
})

describe('Countdown', () => {
  it('renders the countdown number', () => {
    render(<Countdown value={3} />)
    expect(screen.getByTestId('countdown')).toHaveTextContent('3')
  })
})

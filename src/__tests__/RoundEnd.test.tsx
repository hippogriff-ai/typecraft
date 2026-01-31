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
})

describe('Countdown', () => {
  it('renders the countdown number', () => {
    render(<Countdown value={3} />)
    expect(screen.getByTestId('countdown')).toHaveTextContent('3')
  })
})

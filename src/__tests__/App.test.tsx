import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('shows calibration drill on first launch', () => {
    render(<App />)
    expect(screen.getByTestId('calibration-drill')).toBeInTheDocument()
  })

  it('shows practice mode when calibration is complete in storage', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {
          a: { key: 'a', totalAttempts: 5, correctAttempts: 5, averageTimeMs: 200, history: [] },
        },
        sessionHistory: [{ timestamp: Date.now(), wpm: 30 }],
        calibrationComplete: true,
        currentDrillKeys: ['a'],
      }),
    )
    render(<App />)
    expect(screen.getByTestId('typing-practice')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })

  it('shows recalibrate button in practice mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: [],
      }),
    )
    render(<App />)
    expect(screen.getByRole('button', { name: /recalibrate/i })).toBeInTheDocument()
  })

  it('switches to calibration when recalibrate is clicked', async () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: [],
      }),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /recalibrate/i }))

    expect(screen.getByTestId('calibration-drill')).toBeInTheDocument()
  })

  it('has dark theme styling', () => {
    render(<App />)
    const app = screen.getByTestId('app')
    expect(app).toHaveClass('dark')
  })
})

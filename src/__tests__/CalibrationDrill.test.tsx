import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalibrationDrill } from '../components/CalibrationDrill'

describe('CalibrationDrill', () => {
  it('displays the current target key prominently', () => {
    render(<CalibrationDrill onComplete={vi.fn()} />)
    const target = screen.getByTestId('target-key')
    expect(target).toBeInTheDocument()
    expect(target.textContent!.length).toBeGreaterThan(0)
  })

  it('shows calibration progress', () => {
    render(<CalibrationDrill onComplete={vi.fn()} />)
    expect(screen.getByTestId('calibration-progress')).toBeInTheDocument()
  })

  it('advances to next key after enough correct presses', async () => {
    const user = userEvent.setup()
    render(<CalibrationDrill onComplete={vi.fn()} keys={['a', 'b']} pressesPerKey={2} />)

    const firstKey = screen.getByTestId('target-key').textContent!

    // Press the key enough times
    for (let i = 0; i < 2; i++) {
      await user.keyboard(firstKey)
    }

    // Should have advanced to next key
    const currentKey = screen.getByTestId('target-key').textContent!
    expect(currentKey).not.toBe(firstKey)
  })

  it('calls onComplete with key profiles when all keys are calibrated', async () => {
    const onComplete = vi.fn()
    render(<CalibrationDrill onComplete={onComplete} keys={['a', 'b']} pressesPerKey={2} />)

    const user = userEvent.setup()

    // Type 'a' twice
    await user.keyboard('a')
    await user.keyboard('a')

    // Type 'b' twice
    await user.keyboard('b')
    await user.keyboard('b')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        a: expect.objectContaining({ key: 'a', totalAttempts: 2 }),
        b: expect.objectContaining({ key: 'b', totalAttempts: 2 }),
      }),
    )
  })

  it('records errors when wrong key is pressed', async () => {
    const onComplete = vi.fn()
    render(<CalibrationDrill onComplete={onComplete} keys={['a']} pressesPerKey={3} />)

    const user = userEvent.setup()
    // Press wrong key, then correct ones
    await user.keyboard('x')
    await user.keyboard('a')
    await user.keyboard('a')
    await user.keyboard('a')

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        a: expect.objectContaining({
          totalAttempts: 4,
          correctAttempts: 3,
        }),
      }),
    )
  })
})

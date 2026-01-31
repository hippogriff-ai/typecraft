import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TypingPractice } from '../components/TypingPractice'

describe('TypingPractice', () => {
  const defaultProps = {
    sequence: 'abc',
    onSequenceComplete: vi.fn(),
  }

  it('displays the target sequence', () => {
    render(<TypingPractice {...defaultProps} />)
    expect(screen.getByTestId('typing-sequence')).toHaveTextContent('abc')
  })

  it('marks correct characters as grey', async () => {
    const user = userEvent.setup()
    render(<TypingPractice {...defaultProps} />)

    await user.keyboard('a')

    const chars = screen.getAllByTestId('char')
    expect(chars[0]).toHaveClass('correct')
  })

  it('marks incorrect characters as red', async () => {
    const user = userEvent.setup()
    render(<TypingPractice {...defaultProps} />)

    await user.keyboard('x')

    const chars = screen.getAllByTestId('char')
    expect(chars[0]).toHaveClass('incorrect')
  })

  it('advances cursor on each keypress', async () => {
    const user = userEvent.setup()
    render(<TypingPractice {...defaultProps} />)

    await user.keyboard('a')
    await user.keyboard('b')

    const chars = screen.getAllByTestId('char')
    expect(chars[0]).toHaveClass('correct')
    expect(chars[1]).toHaveClass('correct')
    expect(chars[2]).toHaveClass('current')
  })

  it('calls onSequenceComplete when all characters typed', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<TypingPractice sequence="ab" onSequenceComplete={onComplete} />)

    await user.keyboard('a')
    await user.keyboard('b')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.arrayContaining([
          expect.objectContaining({ expected: 'a', actual: 'a', correct: true }),
          expect.objectContaining({ expected: 'b', actual: 'b', correct: true }),
        ]),
      }),
    )
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoundSummary } from '../components/RoundSummary'

describe('RoundSummary', () => {
  const defaultProps = {
    grapesLeft: 18,
    maxGrapes: 24,
    accuracy: 0.85,
    avgReactionMs: 320,
    roundScore: 32,
    highScore: 47,
    isNewHighScore: false,
    focusKeys: ['(', ')'],
    nextFocusKeys: ['{', '}'],
    onNextRound: vi.fn(),
  }

  it('shows grapes survived', () => {
    render(<RoundSummary {...defaultProps} />)
    expect(screen.getByTestId('grapes-survived')).toHaveTextContent('18/24')
  })

  it('shows accuracy percentage', () => {
    render(<RoundSummary {...defaultProps} />)
    expect(screen.getByTestId('accuracy')).toHaveTextContent('85%')
  })

  it('shows average reaction time', () => {
    render(<RoundSummary {...defaultProps} />)
    expect(screen.getByTestId('reaction-time')).toHaveTextContent('320ms')
  })

  it('shows next round focus preview', () => {
    render(<RoundSummary {...defaultProps} />)
    const next = screen.getByTestId('next-focus')
    expect(next).toHaveTextContent('{')
    expect(next).toHaveTextContent('}')
  })

  /**
   * Spec: "Round Outcome > Keys improved / Keys declined"
   * keysImproved shows keys that got better, keysDefined minus keysImproved = declined
   */
  it('shows keys improved and keys declined', () => {
    render(
      <RoundSummary
        {...defaultProps}
        keysImproved={['(']}
        keysDefined={['(', ')']}
      />,
    )
    expect(screen.getByTestId('keys-improved')).toHaveTextContent('(')
    expect(screen.getByTestId('keys-declined')).toHaveTextContent(')')
  })

  it('has a next round button that calls onNextRound', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<RoundSummary {...defaultProps} onNextRound={onNext} />)

    await user.click(screen.getByRole('button', { name: /next round/i }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

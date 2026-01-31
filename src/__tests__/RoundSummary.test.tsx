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
    isNewHighScore: false,
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

  it('shows new high score indicator when isNewHighScore is true', () => {
    render(<RoundSummary {...defaultProps} isNewHighScore={true} roundScore={50} />)
    expect(screen.getByTestId('new-high-score')).toHaveTextContent('NEW HIGH SCORE')
  })

  it('does not show high score indicator when isNewHighScore is false', () => {
    render(<RoundSummary {...defaultProps} isNewHighScore={false} />)
    expect(screen.queryByTestId('new-high-score')).not.toBeInTheDocument()
  })

  /**
   * Spec: "Round Outcome > Keys improved / Keys declined"
   * keysImproved and keysDeclined are computed separately — only keys whose
   * accuracy actually dropped appear under "declined". Keys with unchanged
   * accuracy are omitted from both lists.
   */
  it('shows keys improved and keys declined', () => {
    render(
      <RoundSummary
        {...defaultProps}
        keysImproved={['(']}
        keysDeclined={[')']}
      />,
    )
    expect(screen.getByTestId('keys-improved')).toHaveTextContent('(')
    expect(screen.getByTestId('keys-declined')).toHaveTextContent(')')
  })

  /**
   * Keys with unchanged accuracy between round start and end should NOT
   * appear under "Keys declined". Only keys that actually lost accuracy
   * are declined. This prevents misleading negative feedback.
   */
  it('does not show stable keys as declined', () => {
    render(
      <RoundSummary
        {...defaultProps}
        keysImproved={['(']}
        keysDeclined={[]}
      />,
    )
    expect(screen.getByTestId('keys-improved')).toHaveTextContent('(')
    expect(screen.queryByTestId('keys-declined')).not.toBeInTheDocument()
  })

  it('has a next round button that calls onNextRound', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<RoundSummary {...defaultProps} onNextRound={onNext} />)

    await user.click(screen.getByRole('button', { name: /next round/i }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HUD } from '../components/HUD'

describe('HUD', () => {
  const defaultProps = {
    wpm: 45,
    learningSpeed: 3,
    weakKeys: ['(', '{', ':'],
    roundName: 'Python Symbols',
    currentWave: 4,
    totalWaves: 8,
    grapes: 20,
    maxGrapes: 24,
    roundScore: 32,
    highScore: 47,
    onRecalibrate: vi.fn(),
    onOpenSettings: vi.fn(),
  }

  it('displays current WPM', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByTestId('wpm')).toHaveTextContent('45')
  })

  it('displays learning speed with sign', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('+3/5rnd')
  })

  /**
   * Spec layout diagram shows "+3/5rnd" — learning speed includes the "/5rnd"
   * suffix to indicate it's a 5-round rolling window average.
   * Negative speeds should also show the suffix.
   */
  it('displays negative learning speed with /5rnd suffix', () => {
    render(<HUD {...defaultProps} learningSpeed={-2} />)
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('-2/5rnd')
  })

  it('displays weak keys as badges', () => {
    render(<HUD {...defaultProps} />)
    const weakKeys = screen.getByTestId('weak-keys')
    expect(weakKeys).toHaveTextContent('(')
    expect(weakKeys).toHaveTextContent('{')
    expect(weakKeys).toHaveTextContent(':')
  })

  /**
   * Spec layout diagram shows "Weak: [ _ ] [ { ] [ ( ] [ : ] [ # ]" — the "Weak:" prefix
   * label must be present before the badge list.
   */
  it('displays "Weak:" label before weak key badges', () => {
    render(<HUD {...defaultProps} />)
    const weakKeys = screen.getByTestId('weak-keys')
    expect(weakKeys).toHaveTextContent(/^Weak:/)
  })

  it('displays round info', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByTestId('round-name')).toHaveTextContent('Python Symbols')
    expect(screen.getByTestId('wave-progress')).toHaveTextContent('Wave 4/8')
    expect(screen.getByTestId('grape-count')).toHaveTextContent('Grapes: 20/24')
  })

  it('displays round score and high score', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByTestId('round-score')).toHaveTextContent('32')
    expect(screen.getByTestId('high-score')).toHaveTextContent('47')
  })

  it('has a recalibrate button', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByRole('button', { name: /recalibrate/i })).toBeInTheDocument()
  })

  it('has a settings button', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  /**
   * Spec layout: "Wave 4/8" — wave display should never show 0.
   * currentWave starts at 0 in createRoundState before the first wave spawns.
   * The HUD clamps it to 1 so players never see "Wave 0/8".
   */
  it('displays wave 1 minimum even when currentWave is 0', () => {
    render(<HUD {...defaultProps} currentWave={0} />)
    expect(screen.getByTestId('wave-progress')).toHaveTextContent('Wave 1/8')
  })
})

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
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('+3')
  })

  it('displays weak keys as badges', () => {
    render(<HUD {...defaultProps} />)
    const weakKeys = screen.getByTestId('weak-keys')
    expect(weakKeys).toHaveTextContent('(')
    expect(weakKeys).toHaveTextContent('{')
    expect(weakKeys).toHaveTextContent(':')
  })

  it('displays round info', () => {
    render(<HUD {...defaultProps} />)
    expect(screen.getByTestId('round-name')).toHaveTextContent('Python Symbols')
    expect(screen.getByTestId('wave-progress')).toHaveTextContent('4/8')
    expect(screen.getByTestId('grape-count')).toHaveTextContent('20/24')
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
})

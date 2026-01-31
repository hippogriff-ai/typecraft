import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../components/Dashboard'

describe('Dashboard', () => {
  it('displays current WPM', () => {
    render(<Dashboard wpm={45} learningSpeed={3} weakKeys={['(', ')']} />)
    expect(screen.getByTestId('wpm')).toHaveTextContent('45')
  })

  it('displays learning speed with positive direction', () => {
    render(<Dashboard wpm={45} learningSpeed={3} weakKeys={[]} />)
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('+3')
  })

  it('displays negative learning speed', () => {
    render(<Dashboard wpm={45} learningSpeed={-2} weakKeys={[]} />)
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('-2')
  })

  it('displays weak keys', () => {
    render(<Dashboard wpm={0} learningSpeed={0} weakKeys={['(', '{', ':']} />)
    const weakLinks = screen.getByTestId('weak-keys')
    expect(weakLinks).toHaveTextContent('(')
    expect(weakLinks).toHaveTextContent('{')
    expect(weakLinks).toHaveTextContent(':')
  })

  it('shows "No data yet" when no weak keys', () => {
    render(<Dashboard wpm={0} learningSpeed={0} weakKeys={[]} />)
    expect(screen.getByTestId('weak-keys')).toHaveTextContent('No data yet')
  })
})

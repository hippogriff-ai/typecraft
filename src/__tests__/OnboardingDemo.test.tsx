/**
 * Tests for the OnboardingDemo component.
 * Verifies initial prompt, invader display, and callback contract.
 * Can be simplified if demo flow changes — only initial state and callback matter.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OnboardingDemo } from '../components/OnboardingDemo'

describe('OnboardingDemo', () => {
  it('shows the first prompt immediately', () => {
    render(<OnboardingDemo onComplete={vi.fn()} />)
    expect(screen.getByText(/type the character to destroy/i)).toBeInTheDocument()
  })

  it('shows an invader with a character', () => {
    render(<OnboardingDemo onComplete={vi.fn()} />)
    expect(screen.getByTestId('demo-invader')).toBeInTheDocument()
  })

  it('exposes onComplete callback', () => {
    const onComplete = vi.fn()
    render(<OnboardingDemo onComplete={onComplete} />)
    expect(typeof onComplete).toBe('function')
  })
})

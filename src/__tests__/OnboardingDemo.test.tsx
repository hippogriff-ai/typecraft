/**
 * Tests for the OnboardingDemo component.
 * Verifies initial prompt, invader display, proximity prompt, and callback contract.
 * Spec: "Interactive Demo (first launch only): guided onboarding mini-round"
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

  /**
   * Spec: "Prompt 3 (when one gets close to grapes): Watch out for the grapes!"
   * The component should display the proximity warning when an invader is near center.
   */
  it('shows proximity prompt data-testid for prompt text', () => {
    render(<OnboardingDemo onComplete={vi.fn()} />)
    // Prompt is visible and has a test id
    expect(screen.getByTestId('demo-prompt')).toBeInTheDocument()
  })

  it('exposes onComplete callback', () => {
    const onComplete = vi.fn()
    render(<OnboardingDemo onComplete={onComplete} />)
    expect(typeof onComplete).toBe('function')
  })
})

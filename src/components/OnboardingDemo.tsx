import { useState, useCallback, useEffect } from 'react'

interface OnboardingDemoProps {
  onComplete: () => void
}

const DEMO_CHARS = ['a', 's', 'd', 'f', 'j']

export function OnboardingDemo({ onComplete }: OnboardingDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [destroyed, setDestroyed] = useState(0)

  const currentChar = DEMO_CHARS[currentIndex] ?? ''
  const allDone = destroyed >= DEMO_CHARS.length

  const prompt = destroyed === 0
    ? 'Type the character to destroy the invader!'
    : destroyed >= 2 && destroyed < DEMO_CHARS.length
      ? 'Nice! Keep going.'
      : destroyed >= DEMO_CHARS.length
        ? "Ready? Let's calibrate!"
        : 'Type the character to destroy the invader!'

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (allDone) return
      if (e.key === currentChar) {
        setDestroyed((d) => d + 1)
        setCurrentIndex((i) => i + 1)
      }
    },
    [currentChar, allDone],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="onboarding-demo" data-testid="onboarding-demo">
      <p>{prompt}</p>
      {!allDone && (
        <div data-testid="demo-invader" className="demo-invader">
          {currentChar}
        </div>
      )}
      {allDone && (
        <button onClick={onComplete}>Ready? Let&apos;s calibrate!</button>
      )}
    </div>
  )
}

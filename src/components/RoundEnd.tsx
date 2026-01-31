import { useEffect } from 'react'

interface RoundEndProps {
  result: 'cleared' | 'grapes_lost'
  onDone: () => void
}

export function RoundEnd({ result, onDone }: RoundEndProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="round-end" data-testid="round-end" onClick={onDone}>
      <h1>{result === 'cleared' ? 'ROUND CLEAR' : 'GAME OVER'}</h1>
    </div>
  )
}

import { useEffect } from 'react'

interface RoundEndProps {
  result: 'cleared' | 'grapes_lost'
  onDone: () => void
}

// 12 shatter particles scattered in all directions
const SHATTER_ANGLES = Array.from({ length: 12 }, (_, i) => (i * Math.PI * 2) / 12)
const SHATTER_DISTANCES = [80, 120, 100, 140, 90, 130, 110, 150, 95, 135, 105, 125]

export function RoundEnd({ result, onDone }: RoundEndProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="round-end" data-testid="round-end" onClick={onDone}>
      <h1 className={result === 'cleared' ? 'round-clear-text' : 'game-over-text'}>
        {result === 'cleared' ? 'ROUND CLEAR' : 'GAME OVER'}
      </h1>
      {result === 'grapes_lost' && (
        <div className="shatter-container">
          {SHATTER_ANGLES.map((angle, i) => (
            <div
              key={i}
              data-testid={`shatter-particle-${i}`}
              className="shatter-particle"
              style={{
                '--shatter-dx': `${Math.cos(angle) * SHATTER_DISTANCES[i]}px`,
                '--shatter-dy': `${Math.sin(angle) * SHATTER_DISTANCES[i]}px`,
                animationDelay: `${i * 30}ms`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import type { RoundState, Vec2 } from '../lib/game-engine'
import type { AccuracyRing } from '../lib/accuracy-ring'
import { getCharColor } from '../lib/sprites'

interface GameBoardProps {
  roundState: RoundState
  accuracyRing?: AccuracyRing
  onKeyPress: (key: string) => void
}

function distanceToCenter(pos: Vec2, center: Vec2): number {
  return Math.sqrt((pos.x - center.x) ** 2 + (pos.y - center.y) ** 2)
}

export function GameBoard({ roundState, accuracyRing, onKeyPress }: GameBoardProps) {
  const center: Vec2 = { x: 400, y: 300 }
  const maxDist = 500

  return (
    <div
      data-testid="game-board"
      className="game-board"
      tabIndex={0}
      onKeyDown={(e) => onKeyPress(e.key)}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <div data-testid="grape-cluster" className="grape-cluster">
        {accuracyRing && (
          <svg
            data-testid="accuracy-ring"
            className="accuracy-ring"
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ position: 'absolute', left: -10, top: -10 }}
          >
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke="#333"
              strokeWidth="4"
            />
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke={accuracyRing.value > 0.5 ? '#4ade80' : '#ef4444'}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 55}`}
              strokeDashoffset={`${2 * Math.PI * 55 * (1 - accuracyRing.value)}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s' }}
            />
          </svg>
        )}
        {Array.from({ length: roundState.grapes }, (_, i) => (
          <div key={i} data-testid="grape" className="grape" />
        ))}
      </div>

      {roundState.invaders
        .filter((inv) => inv.alive)
        .map((inv) => {
          const dist = distanceToCenter(inv.position, center)
          const zIndex = Math.max(1, Math.round(maxDist - dist))
          const invaderIdx = roundState.invaders.indexOf(inv)

          const charColor = getCharColor(inv.char)

          return (
            <div
              key={invaderIdx}
              data-testid={`invader-${invaderIdx}`}
              className="invader"
              style={{
                position: 'absolute',
                left: inv.position.x,
                top: inv.position.y,
                zIndex,
                color: charColor.primary,
                borderColor: charColor.secondary,
                textShadow: `0 0 6px ${charColor.primary}`,
              }}
            >
              {inv.char}
            </div>
          )
        })}

      <div data-testid="round-info" className="round-info">
        Wave {roundState.currentWave}/{roundState.totalWaves} | Grapes:{' '}
        {roundState.grapes}/{roundState.maxGrapes}
      </div>
    </div>
  )
}

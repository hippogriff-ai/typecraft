import type { RoundState, Vec2 } from '../lib/game-engine'
import type { AccuracyRing } from '../lib/accuracy-ring'
import { getCharColor } from '../lib/sprites'

export interface Explosion {
  id: number
  x: number
  y: number
  color: string
  createdAt: number
}

export interface AbsorbEffect {
  id: number
  x: number
  y: number
  createdAt: number
}

export interface GrapeBurst {
  id: number
  createdAt: number
}

interface GameBoardProps {
  roundState: RoundState
  accuracyRing?: AccuracyRing
  boardSize?: { width: number; height: number }
  explosions?: Explosion[]
  absorbs?: AbsorbEffect[]
  grapeBursts?: GrapeBurst[]
  onKeyPress: (key: string) => void
}

function distanceToCenter(pos: Vec2, center: Vec2): number {
  return Math.sqrt((pos.x - center.x) ** 2 + (pos.y - center.y) ** 2)
}

// 8 particles per explosion, evenly distributed around a circle
const PARTICLE_ANGLES = Array.from({ length: 8 }, (_, i) => (i * Math.PI * 2) / 8)

// 6 juice droplets for grape burst, spread upward/outward
const DROPLET_ANGLES = Array.from({ length: 6 }, (_, i) => -Math.PI / 2 + (i - 2.5) * 0.4)

export function GameBoard({ roundState, accuracyRing, boardSize, explosions, absorbs, grapeBursts, onKeyPress }: GameBoardProps) {
  const w = boardSize?.width ?? 800
  const h = boardSize?.height ?? 600
  const center: Vec2 = { x: w / 2, y: h / 2 }
  const maxDist = Math.sqrt(w * w + h * h) / 2

  return (
    <div
      data-testid="game-board"
      className="game-board"
      tabIndex={0}
      onKeyDown={(e) => onKeyPress(e.key)}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <div data-testid="grape-cluster" className="grape-cluster">
        <div data-testid="grape-vine" className="grape-vine" />
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

      {explosions?.map((exp) => (
        <div
          key={exp.id}
          data-testid={`explosion-${exp.id}`}
          className="explosion"
          style={{ position: 'absolute', left: exp.x, top: exp.y, pointerEvents: 'none' }}
        >
          {PARTICLE_ANGLES.map((angle, i) => (
            <div
              key={i}
              className="explosion-particle"
              style={{
                '--dx': `${Math.cos(angle) * 40}px`,
                '--dy': `${Math.sin(angle) * 40}px`,
                background: exp.color,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}

      {absorbs?.map((ab) => (
        <div
          key={ab.id}
          data-testid={`absorb-${ab.id}`}
          className="absorb-effect"
          style={{ position: 'absolute', left: ab.x, top: ab.y, pointerEvents: 'none' }}
        />
      ))}

      {grapeBursts?.map((burst) => (
        <div
          key={burst.id}
          data-testid={`grape-burst-${burst.id}`}
          className="grape-burst"
          style={{ pointerEvents: 'none' }}
        >
          {DROPLET_ANGLES.map((angle, i) => (
            <div
              key={i}
              className="grape-droplet"
              style={{
                '--dx': `${Math.cos(angle) * 25}px`,
                '--dy': `${Math.sin(angle) * 35}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}

    </div>
  )
}

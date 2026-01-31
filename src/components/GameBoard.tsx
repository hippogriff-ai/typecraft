import type { RoundState, Vec2 } from '../lib/game-engine'
import type { AccuracyRing } from '../lib/accuracy-ring'
import { getCharColor, SPRITE_TEMPLATES } from '../lib/sprites'
import type { ColorBlindMode } from '../lib/settings'
import { SpriteRenderer } from './SpriteRenderer'

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
  colorBlindMode?: ColorBlindMode
}

function distanceToCenter(pos: Vec2, center: Vec2): number {
  return Math.sqrt((pos.x - center.x) ** 2 + (pos.y - center.y) ** 2)
}

// 8 particles per explosion, evenly distributed around a circle
const PARTICLE_ANGLES = Array.from({ length: 8 }, (_, i) => (i * Math.PI * 2) / 8)

// 6 juice droplets for grape burst, spread upward/outward
const DROPLET_ANGLES = Array.from({ length: 6 }, (_, i) => -Math.PI / 2 + (i - 2.5) * 0.4)

// Compute row widths for a triangular grape bunch (wider at top, tapering to a point).
// Produces a natural bunch shape: e.g. 24 grapes → [6, 5, 5, 4, 3, 1]
function computeBunchRows(count: number): number[] {
  if (count <= 0) return []
  if (count <= 2) return [count]
  if (count <= 4) return [Math.ceil(count / 2), Math.floor(count / 2)]

  // Start wide, taper down
  const maxPerRow = Math.max(3, Math.round(Math.sqrt(count * 1.5)))
  const rows: number[] = []
  let remaining = count
  let width = maxPerRow

  while (remaining > 0) {
    const rowCount = Math.min(remaining, width)
    rows.push(rowCount)
    remaining -= rowCount
    // Shrink every other row for a natural taper
    if (rows.length % 2 === 0 && width > 1) {
      width--
    }
  }

  return rows
}

// Inline SVG grape leaf
export function GrapeLeaf() {
  return (
    <svg
      className="grape-leaf"
      width="44"
      height="38"
      viewBox="0 0 44 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stem curving from bunch up to leaf */}
      <path
        d="M22 38 C22 30, 20 22, 16 16"
        stroke="#4a6a28"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf body — 5-lobed grape leaf shape */}
      <path
        d="M16 16 C10 14, 4 10, 2 5 C5 3, 10 4, 14 6
           C11 3, 12 0, 16 0 C19 0, 22 2, 22 5
           C22 2, 25 0, 28 0 C32 0, 33 3, 30 6
           C34 4, 39 3, 42 5 C40 10, 34 14, 28 16
           C30 20, 26 22, 22 20 C18 22, 14 20, 16 16 Z"
        fill="#3d9b35"
      />
      {/* Leaf highlight */}
      <path
        d="M16 16 C10 14, 4 10, 2 5 C5 3, 10 4, 14 6
           C11 3, 12 0, 16 0 C19 0, 22 2, 22 5
           C22 2, 25 0, 28 0 C32 0, 33 3, 30 6
           C34 4, 39 3, 42 5 C40 10, 34 14, 28 16
           C30 20, 26 22, 22 20 C18 22, 14 20, 16 16 Z"
        fill="url(#leafGrad)"
        opacity="0.4"
      />
      {/* Leaf veins */}
      <path
        d="M22 18 L22 6 M22 12 L15 8 M22 12 L29 8 M22 15 L17 14 M22 15 L27 14"
        stroke="#2d7a22"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <radialGradient id="leafGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#8fff80" />
          <stop offset="100%" stopColor="#3d9b35" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export function GameBoard({ roundState, accuracyRing, boardSize, explosions, absorbs, grapeBursts, colorBlindMode }: GameBoardProps) {
  const w = boardSize?.width ?? 800
  const h = boardSize?.height ?? 600
  const center: Vec2 = { x: w / 2, y: h / 2 }
  const maxDist = Math.sqrt(w * w + h * h) / 2

  return (
    <div
      data-testid="game-board"
      className="game-board"
      tabIndex={0}
      aria-label="Game board - type keys to destroy invaders"
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {(() => {
        const bunchRows = computeBunchRows(roundState.maxGrapes)
        const GRAPE_W = 16
        const GAP_X = 6
        const maxRowWidth = bunchRows.length > 0 ? Math.max(...bunchRows) : 1
        const clusterW = maxRowWidth * (GRAPE_W + GAP_X) - GAP_X
        const ringR = Math.max(65, clusterW / 2 + 15)
        const ringSize = ringR * 2 + 10

        // Precompute visible grapes per row to avoid mutation during render
        const visiblePerRow: number[] = []
        let remaining = roundState.grapes
        for (const rowCount of bunchRows) {
          const visible = Math.min(rowCount, remaining)
          visiblePerRow.push(visible)
          remaining -= visible
        }

        return (
          <div
            data-testid="grape-cluster"
            className="grape-cluster"
          >
            <GrapeLeaf />
            {accuracyRing && (
              <svg
                data-testid="accuracy-ring"
                className="accuracy-ring"
                width={ringSize}
                height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringR}
                  fill="none"
                  stroke="#333"
                  strokeWidth="4"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringR}
                  fill="none"
                  stroke={accuracyRing.value > 0.5 ? '#4ade80' : '#ef4444'}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * ringR}`}
                  strokeDashoffset={`${2 * Math.PI * ringR * (1 - accuracyRing.value)}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s' }}
                />
              </svg>
            )}
            <div className="grape-trunk" />
            {visiblePerRow.map((visible, rowIdx) => {
              if (visible === 0) return null
              return (
                <div key={rowIdx} className="grape-row">
                  {Array.from({ length: visible }, (_, i) => (
                    <div key={i} data-testid="grape" className="grape" />
                  ))}
                </div>
              )
            })}
            {grapeBursts?.map((burst) => (
              <div key={`squash-${burst.id}`} data-testid="grape-squashing" className="grape grape-squashing" />
            ))}
          </div>
        )
      })()}

      {roundState.invaders
        .filter((inv) => inv.alive)
        .map((inv) => {
          const dist = distanceToCenter(inv.position, center)
          // Cap at 99 so invaders never render above overlays (round-end: 200, pause: 300)
          const zIndex = Math.min(99, Math.max(1, Math.round(maxDist - dist)))

          const charColor = getCharColor(inv.char, colorBlindMode)
          const spriteTemplate = SPRITE_TEMPLATES[inv.spriteIndex % SPRITE_TEMPLATES.length]

          return (
            <div
              key={inv.id}
              data-testid={`invader-${inv.id}`}
              className="invader"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${inv.position.x}px, ${inv.position.y}px) translate(-50%, -50%)`,
                zIndex,
                color: charColor.primary,
                borderColor: charColor.secondary,
                textShadow: `0 0 6px ${charColor.primary}`,
              }}
            >
              <SpriteRenderer
                template={spriteTemplate}
                primaryColor={charColor.primary}
                secondaryColor={charColor.secondary}
                size={44}
              />
              <span className="invader-char">{inv.char}</span>
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
                '--particle-color': exp.color,
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

import type { RoundState, Vec2 } from '../lib/game-engine'

interface GameBoardProps {
  roundState: RoundState
  onKeyPress: (key: string) => void
}

function distanceToCenter(pos: Vec2, center: Vec2): number {
  return Math.sqrt((pos.x - center.x) ** 2 + (pos.y - center.y) ** 2)
}

export function GameBoard({ roundState, onKeyPress }: GameBoardProps) {
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

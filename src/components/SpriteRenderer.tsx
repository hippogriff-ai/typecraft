import { memo } from 'react'
import type { SpriteTemplate } from '../lib/sprites'

interface SpriteRendererProps {
  template: SpriteTemplate
  primaryColor: string
  secondaryColor: string
  size?: number
}

export const SpriteRenderer = memo(function SpriteRenderer({ template, primaryColor, secondaryColor, size = 32 }: SpriteRendererProps) {
  const cols = template[0]?.length ?? 0
  const rows = template.length
  const cellSize = size / Math.max(cols, rows)

  return (
    <div
      data-testid="sprite-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        width: size,
        height: cellSize * rows,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      {template.flatMap((row, y) =>
        row.map((val, x) => (
          <div
            key={`${y}-${x}`}
            style={{
              backgroundColor: val === 0 ? 'transparent' : val === 1 ? primaryColor : secondaryColor,
              width: '100%',
              aspectRatio: '1',
            }}
          />
        )),
      )}
    </div>
  )
})

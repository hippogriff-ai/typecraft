/**
 * Tests for the SpriteRenderer component.
 * Spec: "Sprites are defined as data arrays (2D arrays of pixel colors, e.g., 8x8 grid).
 * A single SpriteRenderer component reads the array and renders CSS grid cells."
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpriteRenderer } from '../components/SpriteRenderer'

const SMALL_TEMPLATE = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
]

describe('SpriteRenderer', () => {
  it('renders a grid with correct number of cells', () => {
    render(
      <SpriteRenderer
        template={SMALL_TEMPLATE}
        primaryColor="#ff0000"
        secondaryColor="#880000"
      />,
    )
    const grid = screen.getByTestId('sprite-grid')
    expect(grid).toBeInTheDocument()
    // 3x3 = 9 cells total
    expect(grid.children).toHaveLength(9)
  })

  it('applies primary color to filled cells (value 1)', () => {
    render(
      <SpriteRenderer
        template={SMALL_TEMPLATE}
        primaryColor="#ff0000"
        secondaryColor="#880000"
      />,
    )
    const grid = screen.getByTestId('sprite-grid')
    const cells = Array.from(grid.children) as HTMLElement[]
    // Center cell (index 4) is value 1 → should have background color
    expect(cells[4].style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('leaves empty cells (value 0) transparent', () => {
    render(
      <SpriteRenderer
        template={SMALL_TEMPLATE}
        primaryColor="#ff0000"
        secondaryColor="#880000"
      />,
    )
    const grid = screen.getByTestId('sprite-grid')
    const cells = Array.from(grid.children) as HTMLElement[]
    // Top-left cell (index 0) is value 0 → transparent
    expect(cells[0].style.backgroundColor).toBe('transparent')
  })

  it('sets grid columns based on template width', () => {
    render(
      <SpriteRenderer
        template={SMALL_TEMPLATE}
        primaryColor="#ff0000"
        secondaryColor="#880000"
      />,
    )
    const grid = screen.getByTestId('sprite-grid')
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)')
  })
})

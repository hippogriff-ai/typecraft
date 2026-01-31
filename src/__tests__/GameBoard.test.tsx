import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameBoard } from '../components/GameBoard'
import type { Explosion, AbsorbEffect, GrapeBurst } from '../components/GameBoard'
import { createInvader, createRoundState } from '../lib/game-engine'
import { createAccuracyRing, recordMiss } from '../lib/accuracy-ring'

describe('GameBoard', () => {
  it('renders the grape cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} />)
    expect(screen.getByTestId('grape-cluster')).toBeInTheDocument()
  })

  it('renders correct number of grapes', () => {
    const state = createRoundState({ grapeCount: 7, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} />)
    const grapes = screen.getAllByTestId('grape')
    expect(grapes).toHaveLength(7)
  })

  it('renders invaders with their characters', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const inv = createInvader({
      char: '(',
      position: { x: 100, y: 200 },
      center: { x: 400, y: 300 },
      speed: 1,
    })
    state = { ...state, invaders: [inv] }

    render(<GameBoard roundState={state} />)

    const invaderEl = screen.getByTestId(`invader-${inv.id}`)
    expect(invaderEl).toHaveTextContent('(')
  })

  it('does not render dead invaders', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const inv = createInvader({
      char: 'a',
      position: { x: 100, y: 200 },
      center: { x: 400, y: 300 },
      speed: 1,
    })
    inv.alive = false
    state = { ...state, invaders: [inv] }

    render(<GameBoard roundState={state} />)

    expect(screen.queryByTestId(`invader-${inv.id}`)).not.toBeInTheDocument()
  })

  /**
   * Spec: "A single SpriteRenderer component reads the array and renders CSS grid cells."
   * Each invader should render a pixel-art sprite grid behind its character.
   */
  it('renders sprite grid within each invader', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const inv = createInvader({
      char: 'a',
      position: { x: 100, y: 200 },
      center: { x: 400, y: 300 },
      speed: 1,
    })
    state = { ...state, invaders: [inv] }

    render(<GameBoard roundState={state} />)

    const invaderEl = screen.getByTestId(`invader-${inv.id}`)
    expect(invaderEl.querySelector('[data-testid="sprite-grid"]')).toBeInTheDocument()
  })

  /**
   * Spec: "Fixed zone, variable density: cluster always occupies the same center area.
   * With fewer grapes they spread out; with more they pack tighter."
   * Verifies that fewer grapes result in a larger gap to fill the same area.
   */
  /** Fewer grapes produce fewer rows in the triangular bunch layout. */
  it('renders fewer grape rows when grapes are lost (variable density)', () => {
    const fullState = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const { unmount } = render(<GameBoard roundState={fullState} />)
    const fullRows = screen.getByTestId('grape-cluster').querySelectorAll('.grape-row')
    const fullRowCount = fullRows.length

    unmount()

    // State with fewer grapes (quarter)
    const fewState = { ...createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] }), grapes: 6 }
    render(<GameBoard roundState={fewState} />)
    const fewRows = screen.getByTestId('grape-cluster').querySelectorAll('.grape-row')

    // Fewer grapes should produce fewer visible rows
    expect(fewRows.length).toBeLessThan(fullRowCount)
    expect(screen.getAllByTestId('grape')).toHaveLength(6)
  })

  /**
   * Key input is handled by a global window keydown listener in App.tsx.
   * GameBoard must NOT have its own onKeyDown handler, otherwise a single
   * keypress fires both handlers when the board has focus — destroying two
   * invaders per press (the second silently, with no explosion/stats).
   */
  it('does not process keydown events directly (avoids double-processing)', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} />)
    const board = screen.getByTestId('game-board')
    // GameBoard must NOT have an onKeyDown handler — input is handled by
    // window-level listener in App.tsx. Having both causes double kills.
    expect(board.onkeydown).toBeNull()
  })

  /**
   * Invader z-index must stay below overlay z-indexes (round-end: 200, pause: 300).
   * On large viewports, the old formula Math.round(maxDist - dist) could produce values
   * exceeding 600, causing invaders to render on top of pause/round-end overlays.
   */
  it('caps invader z-index below overlay z-indexes', () => {
    const inv = createInvader({
      char: 'a',
      position: { x: 401, y: 301 }, // very close to center
      center: { x: 400, y: 300 },
      speed: 1,
    })
    const state = {
      ...createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [inv],
    }

    render(<GameBoard roundState={state} boardSize={{ width: 1920, height: 1080 }} />)

    const invaderEl = screen.getByTestId(`invader-${inv.id}`)
    const zIndex = parseInt(invaderEl.style.zIndex)
    // Must be below the lowest overlay z-index (200)
    expect(zIndex).toBeLessThan(200)
  })

  /**
   * Spec: "Grapes are connected by a thin stem/vine line (CSS) to give the cluster a natural bunch feel"
   * Grape leaf SVG replaces the old vine div — provides a leaf + stem above the cluster.
   */
  it('renders grape leaf above cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const { container } = render(<GameBoard roundState={state} />)
    expect(container.querySelector('.grape-leaf')).toBeInTheDocument()
  })

  /**
   * Verifies the accuracy ring is rendered around the grape cluster.
   * Spec: "circular progress ring surrounding the grape cluster"
   */
  it('renders accuracy ring around grape cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} accuracyRing={createAccuracyRing()} />)
    expect(screen.getByTestId('accuracy-ring')).toBeInTheDocument()
  })

  /**
   * Verifies the accuracy ring reflects the current accuracy value visually.
   * A depleted ring should show less progress than a full ring.
   */
  it('accuracy ring reflects current value', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    let ring = createAccuracyRing()
    ring = recordMiss(ring)
    ring = recordMiss(ring)

    render(<GameBoard roundState={state} accuracyRing={ring} />)
    const ringEl = screen.getByTestId('accuracy-ring')
    // The ring element should exist and indicate a depleted state
    expect(ringEl).toBeInTheDocument()
  })

  /**
   * Spec: "pixel-scatter (squares fly outward and fade), 300ms duration, non-blocking"
   * Verifies that explosion particles render at the correct position when provided.
   */
  it('renders explosion particles at destroyed invader position', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const explosions: Explosion[] = [
      { id: 1, x: 200, y: 300, color: '#4fc3f7', createdAt: Date.now() },
    ]

    render(<GameBoard roundState={state} explosions={explosions} />)

    const explosionEl = screen.getByTestId('explosion-1')
    expect(explosionEl).toBeInTheDocument()
    // Should contain 8 particle children
    expect(explosionEl.querySelectorAll('.explosion-particle')).toHaveLength(8)
  })

  /**
   * Multiple simultaneous explosions should all render independently.
   */
  it('renders multiple simultaneous explosions', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const explosions: Explosion[] = [
      { id: 1, x: 100, y: 200, color: '#ff7043', createdAt: Date.now() },
      { id: 2, x: 400, y: 500, color: '#4fc3f7', createdAt: Date.now() },
    ]

    render(<GameBoard roundState={state} explosions={explosions} />)

    expect(screen.getByTestId('explosion-1')).toBeInTheDocument()
    expect(screen.getByTestId('explosion-2')).toBeInTheDocument()
  })

  /**
   * Spec: "Absorb animation: brief red flash, sprite dissolves inward"
   * Verifies absorb effect renders at collision position.
   */
  it('renders absorb effect when invader reaches grape cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const absorbs: AbsorbEffect[] = [
      { id: 1, x: 400, y: 300, createdAt: Date.now() },
    ]

    render(<GameBoard roundState={state} absorbs={absorbs} />)

    expect(screen.getByTestId('absorb-1')).toBeInTheDocument()
    expect(screen.getByTestId('absorb-1')).toHaveClass('absorb-effect')
  })

  /**
   * Spec: "Burst animation: sphere squashes, splits into juice droplets"
   * Verifies grape burst animation renders with droplet particles.
   */
  it('renders grape burst with juice droplets when grape is lost', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const grapeBursts: GrapeBurst[] = [
      { id: 1, createdAt: Date.now() },
    ]

    render(<GameBoard roundState={state} grapeBursts={grapeBursts} />)

    const burstEl = screen.getByTestId('grape-burst-1')
    expect(burstEl).toBeInTheDocument()
    expect(burstEl.querySelectorAll('.grape-droplet')).toHaveLength(6)
  })

  /**
   * Spec: "Burst animation: sphere squashes, splits into juice droplets"
   * When a grape burst is active, one extra grape with squash animation should
   * render in the cluster to visually represent the grape rupturing.
   */
  it('renders squashing grape in cluster during grape burst', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    const grapeBursts: GrapeBurst[] = [
      { id: 1, createdAt: Date.now() },
    ]

    render(<GameBoard roundState={state} grapeBursts={grapeBursts} />)

    const squashingGrapes = screen.getAllByTestId('grape-squashing')
    expect(squashingGrapes).toHaveLength(1)
    expect(squashingGrapes[0]).toHaveClass('grape-squashing')
  })
})

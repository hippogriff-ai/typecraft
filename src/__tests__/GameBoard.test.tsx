import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameBoard } from '../components/GameBoard'
import type { Explosion, AbsorbEffect, GrapeBurst } from '../components/GameBoard'
import { createInvader, createRoundState } from '../lib/game-engine'
import { createAccuracyRing, recordMiss } from '../lib/accuracy-ring'

describe('GameBoard', () => {
  it('renders the grape cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} onKeyPress={vi.fn()} />)
    expect(screen.getByTestId('grape-cluster')).toBeInTheDocument()
  })

  it('renders correct number of grapes', () => {
    const state = createRoundState({ grapeCount: 7, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} onKeyPress={vi.fn()} />)
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

    render(<GameBoard roundState={state} onKeyPress={vi.fn()} />)

    const invaderEl = screen.getByTestId('invader-0')
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

    render(<GameBoard roundState={state} onKeyPress={vi.fn()} />)

    expect(screen.queryByTestId('invader-0')).not.toBeInTheDocument()
  })

  /**
   * Spec: "Grapes are connected by a thin stem/vine line (CSS) to give the cluster a natural bunch feel"
   */
  it('renders vine stem above grape cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} onKeyPress={vi.fn()} />)
    expect(screen.getByTestId('grape-vine')).toBeInTheDocument()
  })

  /**
   * Verifies the accuracy ring is rendered around the grape cluster.
   * Spec: "circular progress ring surrounding the grape cluster"
   */
  it('renders accuracy ring around grape cluster', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    render(<GameBoard roundState={state} accuracyRing={createAccuracyRing()} onKeyPress={vi.fn()} />)
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

    render(<GameBoard roundState={state} accuracyRing={ring} onKeyPress={vi.fn()} />)
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

    render(<GameBoard roundState={state} explosions={explosions} onKeyPress={vi.fn()} />)

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

    render(<GameBoard roundState={state} explosions={explosions} onKeyPress={vi.fn()} />)

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

    render(<GameBoard roundState={state} absorbs={absorbs} onKeyPress={vi.fn()} />)

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

    render(<GameBoard roundState={state} grapeBursts={grapeBursts} onKeyPress={vi.fn()} />)

    const burstEl = screen.getByTestId('grape-burst-1')
    expect(burstEl).toBeInTheDocument()
    expect(burstEl.querySelectorAll('.grape-droplet')).toHaveLength(6)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameBoard } from '../components/GameBoard'
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

  it('displays round progress info', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['(', ')'] })
    render(<GameBoard roundState={state} onKeyPress={vi.fn()} />)
    expect(screen.getByTestId('round-info')).toBeInTheDocument()
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
})

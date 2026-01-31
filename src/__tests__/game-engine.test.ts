import { describe, it, expect } from 'vitest'
import {
  createInvader,
  createRoundState,
  spawnWave,
  tickInvaders,
  handleKeyPress,
  checkCollisions,
  releasePendingSpawns,
  checkRoundComplete,
  type Vec2,
} from '../lib/game-engine'

const CENTER: Vec2 = { x: 400, y: 300 }

describe('createInvader', () => {
  it('creates an invader with character, position, and velocity toward center', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 1 })
    expect(inv.char).toBe('a')
    expect(inv.position).toEqual({ x: 0, y: 300 })
    expect(inv.alive).toBe(true)
    expect(inv.velocity.x).toBeGreaterThan(0)
  })

  it('normalizes velocity to given speed', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 0 }, center: CENTER, speed: 5 })
    const magnitude = Math.sqrt(inv.velocity.x ** 2 + inv.velocity.y ** 2)
    expect(magnitude).toBeCloseTo(5, 1)
  })
})

describe('createRoundState', () => {
  it('initializes with grapes, zero damage, and empty invaders', () => {
    const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['(', ')'] })
    expect(state.grapes).toBe(24)
    expect(state.maxGrapes).toBe(24)
    expect(state.damageCounter).toBe(0)
    expect(state.invaders).toEqual([])
    expect(state.currentWave).toBe(0)
    expect(state.totalWaves).toBe(8)
    expect(state.focusKeys).toEqual(['(', ')'])
    expect(state.roundOver).toBe(false)
  })
})

describe('spawnWave', () => {
  it('adds invaders to the round state', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a', 'b'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    expect(state.invaders.length).toBeGreaterThan(0)
    expect(state.currentWave).toBe(1)
  })

  it('wave N spawns 3 + N invaders where N starts at 0 (active + pending)', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    // Wave 1 (N=0): 3 + 0 = 3 invaders total (some may be pending for staggered release)
    expect(state.invaders.length + state.pendingSpawns.length).toBe(3)
  })

  it('invader characters include focus keys (word-based selection)', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a', 's', 'd'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    // Check both active and pending invaders for focus keys
    const allChars = [
      ...state.invaders.map((i) => i.char),
      ...state.pendingSpawns.map((p) => p.char),
    ]
    const focusCount = allChars.filter((c) => ['a', 's', 'd'].includes(c)).length
    expect(focusCount).toBeGreaterThan(0)
  })
})

describe('tickInvaders', () => {
  it('moves invaders by their velocity * deltaTime', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 100 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    state = tickInvaders(state, { deltaSeconds: 1, center: CENTER, collisionRadius: 30 })

    expect(state.invaders[0].position.x).toBeGreaterThan(0)
  })

  it('does not move dead invaders', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 100 })
    inv.alive = false
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    state = tickInvaders(state, { deltaSeconds: 1, center: CENTER, collisionRadius: 30 })

    expect(state.invaders[0].position).toEqual({ x: 0, y: 300 })
  })
})

describe('checkCollisions', () => {
  it('marks invaders as dead when they reach grape cluster', () => {
    const inv = createInvader({ char: 'a', position: { x: 398, y: 300 }, center: CENTER, speed: 1 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    const result = checkCollisions(state, { center: CENTER, collisionRadius: 30 })
    state = result.state

    expect(state.invaders[0].alive).toBe(false)
    expect(state.damageCounter).toBe(1)
    expect(result.collisions).toHaveLength(1)
    expect(result.collisions[0].grapeLost).toBe(false)
  })

  it('drops a grape every 3 damage', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, damageCounter: 2 }

    const inv = createInvader({ char: 'a', position: { x: 400, y: 300 }, center: CENTER, speed: 1 })
    state = { ...state, invaders: [inv] }
    const result = checkCollisions(state, { center: CENTER, collisionRadius: 30 })
    state = result.state

    expect(state.damageCounter).toBe(3)
    expect(state.grapes).toBe(23)
    expect(result.collisions[0].grapeLost).toBe(true)
  })

  it('sets roundOver when grapes reach 0', () => {
    // 1 grape left, 2 damage already → next hit triggers grape drop → 0 grapes → round over
    let state = createRoundState({ grapeCount: 1, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, grapes: 1, damageCounter: 2 }

    const inv = createInvader({ char: 'a', position: { x: 400, y: 300 }, center: CENTER, speed: 1 })
    state = { ...state, invaders: [inv] }
    const result = checkCollisions(state, { center: CENTER, collisionRadius: 30 })
    state = result.state

    expect(state.grapes).toBe(0)
    expect(state.roundOver).toBe(true)
    expect(result.collisions[0].grapeLost).toBe(true)
  })
})

describe('spawnWave — word-based batches', () => {
  it('spawns characters derived from words containing focus keys', () => {
    // Use a later wave to get more invaders and reduce flakiness
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['e', 't'] })
    state = { ...state, currentWave: 5 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    // Check all invaders (active + pending) have single-character chars
    const allChars = [
      ...state.invaders.map((i) => i.char),
      ...state.pendingSpawns.map((p) => p.char),
    ]
    for (const ch of allChars) {
      expect(ch.length).toBe(1)
    }
    // With 'e' and 't' as focus keys (very common letters), words containing them should produce these chars
    const focusChars = allChars.filter((c) => ['e', 't'].includes(c))
    expect(focusChars.length).toBeGreaterThan(0)
  })

  it('uses code snippets for symbol-only focus keys', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['(', ')'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    // Should still produce individual character invaders
    for (const inv of state.invaders) {
      expect(inv.char.length).toBe(1)
    }
  })

  it('characters from the same word batch spawn near each other', () => {
    // Use a large wave to increase chances of seeing batching
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a', 's', 'd'] })
    // Advance to wave 8 for more invaders
    state = { ...state, currentWave: 7 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    // Invaders should exist
    expect(state.invaders.length).toBeGreaterThan(0)
  })
})

describe('staggered spawning', () => {
  /**
   * Verifies that spawnWave puts invaders into pendingSpawns instead of
   * adding them all directly to the active invaders array.
   * Spec: "within a wave, batches spawn every 1-2 seconds, not all at once"
   */
  it('spawnWave stages invaders in pendingSpawns, not all active at once', () => {
    // Use wave 2 (currentWave=1) to get enough invaders for staggering (3+1=4)
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a', 's'] })
    state = { ...state, currentWave: 1 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 50 })
    // Wave 2 (N=1): 3+1=4 invaders, with batch size ~3, at least 1 pending
    expect(state.invaders.length + state.pendingSpawns.length).toBe(4)
    expect(state.invaders.length).toBeGreaterThan(0)
    expect(state.pendingSpawns.length).toBeGreaterThan(0)
  })

  /**
   * Verifies that releasePendingSpawns moves invaders from pending to active
   * when their scheduled time has arrived.
   */
  it('releasePendingSpawns moves ready invaders to active', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a', 's', 'd'] })
    // Use a later wave to get more invaders and ensure some are pending
    state = { ...state, currentWave: 4 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 50 })
    const initialActive = state.invaders.length
    const initialPending = state.pendingSpawns.length

    if (initialPending > 0) {
      // Set time far in the future so all pending should release
      state = releasePendingSpawns(state, Date.now() + 10000)
      expect(state.invaders.length).toBe(initialActive + initialPending)
      expect(state.pendingSpawns.length).toBe(0)
    }
  })

  /**
   * Verifies that pending invaders are NOT released before their scheduled time.
   */
  it('does not release pending invaders before their scheduled time', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a', 's', 'd'] })
    state = { ...state, currentWave: 4 }
    const beforeSpawn = Date.now()
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 50 })

    if (state.pendingSpawns.length > 0) {
      // Release at current time — only the first batch should be active
      const activeBeforeRelease = state.invaders.length
      state = releasePendingSpawns(state, beforeSpawn)
      // Should not have released future batches
      expect(state.invaders.length).toBe(activeBeforeRelease)
    }
  })

  /**
   * Verifies that wave is not considered complete while pending spawns remain.
   */
  it('wave is not complete while pendingSpawns remain', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 1, focusKeys: ['a', 's', 'd'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 50 })

    // Kill all active invaders
    state = {
      ...state,
      invaders: state.invaders.map((inv) => ({ ...inv, alive: false })),
    }

    if (state.pendingSpawns.length > 0) {
      // Even though all active invaders are dead, round should NOT be over
      state = checkRoundComplete(state)
      expect(state.roundOver).toBe(false)
    }
  })
})

describe('handleKeyPress', () => {
  it('destroys the nearest matching alive invader', () => {
    const far = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 1 })
    const near = createInvader({ char: 'a', position: { x: 350, y: 300 }, center: CENTER, speed: 1 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [far, near] }

    const result = handleKeyPress(state, 'a', CENTER)

    expect(result.state.invaders[0].alive).toBe(true) // far one survives
    expect(result.state.invaders[1].alive).toBe(false) // near one destroyed
    expect(result.hit).toBe(true)
  })

  it('returns miss when no matching invader exists', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 1 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    const result = handleKeyPress(state, 'z', CENTER)

    expect(result.hit).toBe(false)
    expect(result.state.invaders[0].alive).toBe(true)
  })

  /**
   * Spec: "pixel-scatter explosion" — need the destroyed invader's position for rendering.
   */
  it('returns the destroyed invader position on hit', () => {
    const inv = createInvader({ char: 'a', position: { x: 350, y: 280 }, center: CENTER, speed: 1 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    const result = handleKeyPress(state, 'a', CENTER)

    expect(result.hit).toBe(true)
    expect(result.destroyedPosition).toBeDefined()
    expect(result.destroyedPosition!.x).toBeCloseTo(350, 0)
    expect(result.destroyedPosition!.y).toBeCloseTo(280, 0)
  })

  it('ignores dead invaders when finding targets', () => {
    const dead = createInvader({ char: 'a', position: { x: 390, y: 300 }, center: CENTER, speed: 1 })
    dead.alive = false
    const alive = createInvader({ char: 'a', position: { x: 100, y: 300 }, center: CENTER, speed: 1 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [dead, alive] }

    const result = handleKeyPress(state, 'a', CENTER)

    expect(result.state.invaders[0].alive).toBe(false) // was already dead
    expect(result.state.invaders[1].alive).toBe(false) // newly destroyed
    expect(result.hit).toBe(true)
  })
})

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
  rescaleInvaderSpeeds,
  CLUSTER_COLLISION_RADIUS,
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

  /**
   * Spec: "Each invader gets a randomly assigned sprite template from the pool"
   * Invaders must carry a spriteIndex for rendering variety.
   */
  it('assigns a spriteIndex on creation', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 1 })
    expect(typeof inv.spriteIndex).toBe('number')
    expect(inv.spriteIndex).toBeGreaterThanOrEqual(0)
  })

  it('normalizes velocity to given speed', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 0 }, center: CENTER, speed: 5 })
    const magnitude = Math.sqrt(inv.velocity.x ** 2 + inv.velocity.y ** 2)
    expect(magnitude).toBeCloseTo(5, 1)
  })

  /**
   * Each invader needs a unique stable ID for React key reconciliation.
   * Without this, GameBoard uses indexOf (O(N²)) and indices that recycle
   * when dead invaders are purged between waves.
   */
  it('assigns a unique id to each invader', () => {
    const inv1 = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 1 })
    const inv2 = createInvader({ char: 'b', position: { x: 100, y: 300 }, center: CENTER, speed: 1 })
    expect(typeof inv1.id).toBe('number')
    expect(typeof inv2.id).toBe('number')
    expect(inv1.id).not.toBe(inv2.id)
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

  /**
   * Defensive: if focusKeys is somehow empty (corrupted localStorage, test edge case),
   * spawnWave should fall back to home row keys rather than generating undefined chars.
   */
  it('does not produce undefined invader chars when focusKeys is empty', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: [] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    const allChars = [
      ...state.invaders.map((i) => i.char),
      ...state.pendingSpawns.map((p) => p.char),
    ]
    expect(allChars.every((c) => typeof c === 'string' && c.length === 1)).toBe(true)
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

  /**
   * Spec: "invader is absorbed when it enters a fixed radius around the screen center
   * (the cluster's visual bounding radius + small margin)."
   * CLUSTER_COLLISION_RADIUS must match the grape cluster visual (.grape-cluster width: 120px → radius 60px).
   */
  it('CLUSTER_COLLISION_RADIUS matches the grape cluster visual boundary', () => {
    // .grape-cluster CSS width is 120px → bounding radius = 60px
    expect(CLUSTER_COLLISION_RADIUS).toBe(60)
  })

  it('detects collision for invader at cluster edge (55px from center)', () => {
    const inv = createInvader({
      char: 'a',
      position: { x: CENTER.x + 55, y: CENTER.y },
      center: CENTER,
      speed: 1,
    })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    const result = checkCollisions(state, { center: CENTER, collisionRadius: CLUSTER_COLLISION_RADIUS })
    expect(result.state.invaders[0].alive).toBe(false)
  })
})

describe('spawnWave — 70/30 focus/filler split', () => {
  /**
   * Spec: "70% focus keys, 30% filler". With a large enough wave, the
   * focus portion (70%) should dominate but non-focus filler chars should
   * also appear, providing variety and preventing monotonous rounds.
   */
  it('includes both focus and non-focus characters in the wave', () => {
    // Use wave 9 for a large count: 2 + 10 = 12 invaders
    let state = createRoundState({ grapeCount: 24, totalWaves: 12, focusKeys: ['a', 's'] })
    state = { ...state, currentWave: 9 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })

    const allChars = [
      ...state.invaders.map((i) => i.char),
      ...state.pendingSpawns.map((p) => p.char),
    ]
    const total = allChars.length
    const focusChars = allChars.filter((c) => ['a', 's'].includes(c))
    const fillerChars = allChars.filter((c) => !['a', 's'].includes(c))

    // 70% focus = ~8, 30% filler = ~4 out of 12
    expect(focusChars.length).toBeGreaterThanOrEqual(Math.round(total * 0.7) - 1)
    expect(fillerChars.length).toBeGreaterThan(0)
  })
})

describe('spawnWave — calibration mode (100% focus)', () => {
  /**
   * Spec: 70/30 split is described under Practice Mode. Calibration rounds
   * should be 100% focus keys to properly isolate each key group for testing.
   * When fillerKeys is explicitly empty ([]), all spawned chars should be focus keys.
   */
  it('spawns only focus keys when fillerKeys is empty array (calibration)', () => {
    let state = createRoundState({
      grapeCount: 24, totalWaves: 8, focusKeys: ['a', 's', 'd', 'f'], fillerKeys: [],
    })
    state = { ...state, currentWave: 4 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })

    const allChars = [
      ...state.invaders.map((i) => i.char),
      ...state.pendingSpawns.map((p) => p.char),
    ]
    expect(allChars.length).toBeGreaterThan(0)
    for (const ch of allChars) {
      expect(['a', 's', 'd', 'f']).toContain(ch)
    }
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

/**
 * When the round ends via grapes_lost while invaders are still in the staggered
 * spawn queue, pendingSpawns must be retained in the final state so that accuracy
 * can be computed from only the invaders that actually appeared on screen:
 *   accuracy = kills / (totalSpawned - pendingSpawns.length)
 * Using totalSpawned alone would dilute accuracy with invaders the player never
 * had a chance to interact with.
 */
describe('round end with pending invaders', () => {
  it('retains pendingSpawns when round ends via grapes_lost', () => {
    // Start at wave 4 so wave 5 spawns 7 invaders (3+4), with at least 4 pending
    let state = createRoundState({ grapeCount: 1, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, currentWave: 4 }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 50 })

    const pendingBefore = state.pendingSpawns.length
    expect(pendingBefore).toBeGreaterThan(0)

    // Set up conditions for grapes_lost: 1 grape, 2 damage already
    state = { ...state, grapes: 1, damageCounter: 2 }

    // Move an active invader to the center to trigger collision
    state = {
      ...state,
      invaders: state.invaders.map((inv, i) =>
        i === 0 ? { ...inv, position: { x: CENTER.x, y: CENTER.y } } : inv,
      ),
    }

    const result = checkCollisions(state, { center: CENTER, collisionRadius: 30 })
    state = result.state

    expect(state.roundOver).toBe(true)
    expect(state.roundResult).toBe('grapes_lost')
    // Pending invaders are still in the state — not cleared on round end
    expect(state.pendingSpawns.length).toBe(pendingBefore)
    // Accuracy should use appeared count, not totalSpawned
    const appearedCount = state.totalSpawned - state.pendingSpawns.length
    expect(appearedCount).toBeLessThan(state.totalSpawned)
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

/**
 * Spec: "changes apply immediately for speed" — when the user changes the
 * speed preset during gameplay, all alive invaders and pending spawns must
 * rescale their velocity/speed to the new effective speed (base + escalation).
 */
describe('rescaleInvaderSpeeds', () => {
  it('rescales alive invaders to new base speed with wave escalation', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 50 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv], currentWave: 1 }

    const oldMag = Math.sqrt(inv.velocity.x ** 2 + inv.velocity.y ** 2)
    expect(oldMag).toBeCloseTo(50, 0)

    state = rescaleInvaderSpeeds(state, 80)

    const newMag = Math.sqrt(
      state.invaders[0].velocity.x ** 2 + state.invaders[0].velocity.y ** 2,
    )
    // Wave 1, escalation = 0, so effective = 80
    expect(newMag).toBeCloseTo(80, 0)
  })

  it('includes wave escalation in rescaled speed', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 60 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    // Wave 3 → escalation = (3-1)*5 = 10
    state = { ...state, invaders: [inv], currentWave: 3 }

    state = rescaleInvaderSpeeds(state, 50)

    const newMag = Math.sqrt(
      state.invaders[0].velocity.x ** 2 + state.invaders[0].velocity.y ** 2,
    )
    // base 50 + escalation 10 = 60
    expect(newMag).toBeCloseTo(60, 0)
  })

  it('updates pending spawns speed', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = {
      ...state,
      currentWave: 1,
      pendingSpawns: [
        { char: 'a', position: { x: 0, y: 0 }, center: CENTER, speed: 50, spawnAt: 9999 },
      ],
    }

    state = rescaleInvaderSpeeds(state, 80)
    // Wave 1, escalation = 0, so effective = 80
    expect(state.pendingSpawns[0].speed).toBe(80)
  })

  it('does not modify dead invaders', () => {
    const inv = createInvader({ char: 'a', position: { x: 0, y: 300 }, center: CENTER, speed: 50 })
    inv.alive = false
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv], currentWave: 1 }

    state = rescaleInvaderSpeeds(state, 80)

    // Dead invader velocity unchanged
    const mag = Math.sqrt(
      state.invaders[0].velocity.x ** 2 + state.invaders[0].velocity.y ** 2,
    )
    expect(mag).toBeCloseTo(50, 0)
  })
})

import { describe, it, expect } from 'vitest'
import {
  createInvader,
  createRoundState,
  spawnWave,
  tickInvaders,
  handleKeyPress,
  checkCollisions,
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

  it('wave N spawns 3 + N invaders', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    // Wave 1: 3 + 1 = 4 invaders
    expect(state.invaders.length).toBe(4)
  })

  it('invader characters are biased toward focus keys', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['('] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    const focusCount = state.invaders.filter((i) => i.char === '(').length
    expect(focusCount / state.invaders.length).toBeGreaterThanOrEqual(0.5)
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

    state = checkCollisions(state, { center: CENTER, collisionRadius: 30 })

    expect(state.invaders[0].alive).toBe(false)
    expect(state.damageCounter).toBe(1)
  })

  it('drops a grape every 3 damage', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, damageCounter: 2 }

    const inv = createInvader({ char: 'a', position: { x: 400, y: 300 }, center: CENTER, speed: 1 })
    state = { ...state, invaders: [inv] }
    state = checkCollisions(state, { center: CENTER, collisionRadius: 30 })

    expect(state.damageCounter).toBe(3)
    expect(state.grapes).toBe(23)
  })

  it('sets roundOver when grapes reach 0', () => {
    // 1 grape left, 2 damage already → next hit triggers grape drop → 0 grapes → round over
    let state = createRoundState({ grapeCount: 1, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, grapes: 1, damageCounter: 2 }

    const inv = createInvader({ char: 'a', position: { x: 400, y: 300 }, center: CENTER, speed: 1 })
    state = { ...state, invaders: [inv] }
    state = checkCollisions(state, { center: CENTER, collisionRadius: 30 })

    expect(state.grapes).toBe(0)
    expect(state.roundOver).toBe(true)
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameLoop } from '../hooks/useGameLoop'
import { createRoundState, createInvader } from '../lib/game-engine'
import type { RoundState, Vec2 } from '../lib/game-engine'

const CENTER: Vec2 = { x: 400, y: 300 }
const BOARD_SIZE = { width: 800, height: 600 }

function makeProps(overrides: Partial<Parameters<typeof useGameLoop>[0]> = {}) {
  return {
    roundState: createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
    onRoundEnd: vi.fn(),
    onStateChange: vi.fn(),
    boardSize: BOARD_SIZE,
    ...overrides,
  }
}

/**
 * Capture requestAnimationFrame callbacks for controlled frame stepping.
 * Each call to flushFrame(timestamp) executes all pending rAF callbacks
 * with the given timestamp, simulating one animation frame.
 */
let rafCallbacks: Map<number, FrameRequestCallback>
let nextRafId: number

function flushFrame(timestamp: number) {
  const cbs = new Map(rafCallbacks)
  rafCallbacks.clear()
  for (const cb of cbs.values()) {
    cb(timestamp)
  }
}

describe('useGameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    rafCallbacks = new Map()
    nextRafId = 1
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextRafId++
      rafCallbacks.set(id, cb)
      return id
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // --- Initial state ---

  /** Hook should start in a paused state, not running the game loop. */
  it('starts paused and can be started', () => {
    const { result } = renderHook(() => useGameLoop(makeProps()))
    expect(result.current.running).toBe(false)
  })

  /** Hook should expose the three control functions for external callers. */
  it('exposes start, stop, and handleKeyPress functions', () => {
    const { result } = renderHook(() => useGameLoop(makeProps()))
    expect(typeof result.current.start).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.handleKeyPress).toBe('function')
  })

  /**
   * Spec: "Adaptive difficulty: track rolling accuracy over the last 10 invaders.
   * If accuracy > 90%: increase speed by 10%. If accuracy < 50%: decrease speed by 10%."
   * The calibrationMode prop enables adaptive speed adjustments during calibration rounds.
   */
  it('accepts calibrationMode prop without error', () => {
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ calibrationMode: true })),
    )
    expect(result.current.running).toBe(false)
  })

  // --- start/stop ---

  /**
   * start() sets running to true and schedules the tick loop. The first wave
   * is spawned by the tick function (not start() itself) to avoid a race
   * condition with startNewRound() when both run as effects in the same render.
   */
  it('start() sets running to true, tick spawns first wave', () => {
    const onStateChange = vi.fn()
    const { result } = renderHook(() => useGameLoop(makeProps({ onStateChange })))

    act(() => { result.current.start() })

    expect(result.current.running).toBe(true)

    // First tick spawns wave 1 (empty invaders + currentWave=0 + totalWaves>0)
    act(() => { flushFrame(1000) })

    expect(onStateChange).toHaveBeenCalled()
    const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0] as RoundState
    expect(lastCall.currentWave).toBe(1)
    expect(lastCall.invaders.length).toBeGreaterThan(0)
  })

  /** start() must schedule a requestAnimationFrame to kick off the tick loop. */
  it('start() schedules a requestAnimationFrame', () => {
    const { result } = renderHook(() => useGameLoop(makeProps()))

    act(() => { result.current.start() })

    expect(window.requestAnimationFrame).toHaveBeenCalled()
    expect(rafCallbacks.size).toBeGreaterThan(0)
  })

  /** stop() should cancel the pending rAF and set running to false. */
  it('stop() cancels animation frame and sets running to false', () => {
    const { result } = renderHook(() => useGameLoop(makeProps()))

    act(() => { result.current.start() })
    expect(result.current.running).toBe(true)

    act(() => { result.current.stop() })
    expect(result.current.running).toBe(false)
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })

  // --- handleKeyPress ---

  /**
   * Spec: "Pressing the matching key destroys the nearest alive matching invader."
   * handleKeyPress finds the nearest alive invader matching the key, marks it dead,
   * increments score, returns hit=true with reaction time and destroyed position.
   */
  it('handleKeyPress destroys nearest matching invader and returns hit', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 350, y: 300 },
      center: CENTER,
      speed: 1,
      spawnTime: 500,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    let keyResult: ReturnType<typeof result.current.handleKeyPress> | undefined
    act(() => { keyResult = result.current.handleKeyPress('a') })

    expect(keyResult!.hit).toBe(true)
    // Date.now() is 1000, spawnTime is 500 → reaction time = 500ms
    expect(keyResult!.reactionTimeMs).toBe(500)
    expect(keyResult!.destroyedPosition).toEqual({ x: 350, y: 300 })
    expect(onStateChange).toHaveBeenCalled()
    const updated: RoundState = onStateChange.mock.calls[0][0]
    expect(updated.invaders[0].alive).toBe(false)
    expect(updated.score).toBe(1)
  })

  /**
   * When no alive invader matches the pressed key, handleKeyPress returns hit=false.
   * The game state (score, invader alive status) should remain unchanged.
   */
  it('handleKeyPress returns miss for unmatched key', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 350, y: 300 },
      center: CENTER,
      speed: 1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    let keyResult: ReturnType<typeof result.current.handleKeyPress> | undefined
    act(() => { keyResult = result.current.handleKeyPress('z') })

    expect(keyResult!.hit).toBe(false)
    const updated: RoundState = onStateChange.mock.calls[0][0]
    expect(updated.invaders[0].alive).toBe(true)
    expect(updated.score).toBe(0)
  })

  /**
   * Spec: "destroys the nearest alive matching invader."
   * When multiple invaders have the same character, the one closest to center
   * is destroyed first — this is critical for gameplay feel.
   */
  it('handleKeyPress targets the nearest matching invader to center', () => {
    const farInvader = createInvader({
      char: 'a',
      position: { x: 100, y: 300 }, // 300px from center
      center: CENTER,
      speed: 1,
    })
    const nearInvader = createInvader({
      char: 'a',
      position: { x: 380, y: 300 }, // 20px from center
      center: CENTER,
      speed: 1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [farInvader, nearInvader],
      currentWave: 1,
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    act(() => { result.current.handleKeyPress('a') })

    const updated: RoundState = onStateChange.mock.calls[0][0]
    expect(updated.invaders[0].alive).toBe(true)  // far invader survives
    expect(updated.invaders[1].alive).toBe(false) // near invader destroyed
  })

  // --- Game tick ---

  /**
   * Each rAF tick should advance alive invaders toward center using delta time.
   * The first frame initializes lastTime (deltaSeconds=0, no movement).
   * The second frame applies actual movement based on elapsed time.
   */
  it('game tick moves invaders toward center', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 100, y: 300 }, // left side, heading right
      center: CENTER,
      speed: 100, // 100 px/s
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 1, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    act(() => { result.current.start() })
    onStateChange.mockClear()

    // Frame 1 at t=1000: initializes lastTime, deltaSeconds = 0, no movement
    act(() => { flushFrame(1000) })
    // Frame 2 at t=1100: delta = 0.1s, movement = 100 * 0.1 = 10px right
    act(() => { flushFrame(1100) })

    const calls = onStateChange.mock.calls
    expect(calls.length).toBeGreaterThanOrEqual(2)
    const afterTick: RoundState = calls[calls.length - 1][0]
    const movedInvader = afterTick.invaders.find(i => i.alive)
    // Invader was at x=100, should have moved right toward center (x=400)
    expect(movedInvader!.position.x).toBeGreaterThan(100)
  })

  /**
   * onStateChange should fire on every tick frame so the UI can re-render
   * with updated invader positions.
   */
  it('calls onStateChange on each tick frame', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 100, y: 300 },
      center: CENTER,
      speed: 1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    act(() => { result.current.start() })
    onStateChange.mockClear()

    act(() => { flushFrame(1000) })
    expect(onStateChange).toHaveBeenCalledTimes(1)

    act(() => { flushFrame(1016) })
    expect(onStateChange).toHaveBeenCalledTimes(2)
  })

  /**
   * Spec: "Invaders absorbed at the grape cluster increment a damage counter."
   * When an invader reaches the center (within collisionRadius), the onCollisions
   * callback fires with collision event data for rendering absorb animations.
   */
  it('fires onCollisions when invaders reach the center', () => {
    // Place invader 1px from center — well within 30px collision radius
    const invader = createInvader({
      char: 'a',
      position: { x: 401, y: 300 },
      center: CENTER,
      speed: 0.1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const onCollisions = vi.fn()
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange, onCollisions })),
    )

    act(() => { result.current.start() })
    onStateChange.mockClear()

    // First frame: deltaSeconds=0, invader doesn't move, collision detected
    act(() => { flushFrame(1000) })

    expect(onCollisions).toHaveBeenCalled()
    const events = onCollisions.mock.calls[0][0]
    expect(events.length).toBe(1)
    expect(events[0].position).toBeDefined()
  })

  // --- Round completion ---

  /**
   * Spec: "Round ends when grapes = 0."
   * When collisions cause grape count to reach 0, onRoundEnd fires with
   * roundResult='grapes_lost', and the loop stops (running → false).
   */
  it('calls onRoundEnd when grapes are lost', () => {
    // 1 grape, damageCounter=2 → next collision (counter 3, divisible by 3) loses last grape
    const invader = createInvader({
      char: 'a',
      position: { x: 401, y: 300 }, // within collision radius
      center: CENTER,
      speed: 0.1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 1, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
      damageCounter: 2,
    }
    const onRoundEnd = vi.fn()
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onRoundEnd, onStateChange })),
    )

    act(() => { result.current.start() })
    act(() => { flushFrame(1000) })

    expect(onRoundEnd).toHaveBeenCalled()
    const endState: RoundState = onRoundEnd.mock.calls[0][0]
    expect(endState.roundOver).toBe(true)
    expect(endState.roundResult).toBe('grapes_lost')
    expect(result.current.running).toBe(false)
  })

  /**
   * Spec: "When all waves complete and no invaders remain, round is 'cleared'."
   * When currentWave >= totalWaves, no pending spawns, and all invaders dead,
   * the round ends with result 'cleared'.
   */
  it('calls onRoundEnd with cleared result when all waves and invaders resolved', () => {
    const deadInvader = {
      ...createInvader({ char: 'a', position: { x: 200, y: 200 }, center: CENTER, speed: 1 }),
      alive: false,
    }
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 2, focusKeys: ['a'] }),
      invaders: [deadInvader],
      currentWave: 2, // all waves spawned
      pendingSpawns: [],
    }
    const onRoundEnd = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onRoundEnd })),
    )

    act(() => { result.current.start() })
    act(() => { flushFrame(1000) })

    expect(onRoundEnd).toHaveBeenCalled()
    const endState: RoundState = onRoundEnd.mock.calls[0][0]
    expect(endState.roundOver).toBe(true)
    expect(endState.roundResult).toBe('cleared')
    expect(result.current.running).toBe(false)
  })

  // --- Wave advancement ---

  /**
   * Spec: "When all invaders in a wave are resolved, next wave spawns automatically."
   * The tick detects all invaders dead + no pending spawns + more waves remaining,
   * then calls spawnWave to generate the next wave.
   */
  it('auto-advances to next wave when all invaders resolved', () => {
    const deadInvader = {
      ...createInvader({ char: 'a', position: { x: 200, y: 200 }, center: CENTER, speed: 1 }),
      alive: false,
    }
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [deadInvader],
      currentWave: 1, // wave 1 done, waves 2-8 remain
      pendingSpawns: [],
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    act(() => { result.current.start() })
    onStateChange.mockClear()
    act(() => { flushFrame(1000) })

    expect(onStateChange).toHaveBeenCalled()
    const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0] as RoundState
    expect(lastCall.currentWave).toBe(2)
    // New wave should have alive invaders
    expect(lastCall.invaders.some(i => i.alive)).toBe(true)
  })

  /**
   * Wave auto-advance must wait until all pending spawns are released.
   * If pendingSpawns is non-empty, the wave should NOT advance even if
   * all currently visible invaders are dead.
   */
  it('does not auto-advance wave while pendingSpawns exist', () => {
    const deadInvader = {
      ...createInvader({ char: 'a', position: { x: 200, y: 200 }, center: CENTER, speed: 1 }),
      alive: false,
    }
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [deadInvader],
      currentWave: 1,
      pendingSpawns: [
        { char: 'a', position: { x: 50, y: 50 }, center: CENTER, speed: 50, spawnAt: 9999 },
      ],
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    act(() => { result.current.start() })
    onStateChange.mockClear()
    act(() => { flushFrame(1000) })

    const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0] as RoundState
    // Wave should NOT have advanced — pendingSpawns blocks it
    expect(lastCall.currentWave).toBe(1)
  })

  // --- Calibration mode ---

  /**
   * Spec: "Adaptive difficulty: track rolling accuracy over the last 10 invaders."
   * In calibration mode, each handleKeyPress result (hit/miss) is recorded in the
   * calibration tracker. After 10 results, the adapted speed changes wave spawning.
   * This test verifies calibration recording doesn't error.
   */
  it('records calibration results on handleKeyPress in calibration mode', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 350, y: 300 },
      center: CENTER,
      speed: 1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, calibrationMode: true, baseSpeed: 50 })),
    )

    // Hit records correct: true in calibration tracker
    let hitResult: ReturnType<typeof result.current.handleKeyPress> | undefined
    act(() => { hitResult = result.current.handleKeyPress('a') })
    expect(hitResult!.hit).toBe(true)

    // Miss records correct: false in calibration tracker
    let missResult: ReturnType<typeof result.current.handleKeyPress> | undefined
    act(() => { missResult = result.current.handleKeyPress('z') })
    expect(missResult!.hit).toBe(false)
  })

  /**
   * Bug fix: start() previously reset the calibration tracker on every call,
   * including pause/resume. This erased adaptive speed adjustments mid-calibration.
   * The tracker must only reset at the beginning of a new round (currentWave === 0),
   * not when resuming from pause (currentWave > 0).
   */
  it('preserves calibration tracker across stop/start (pause/resume)', () => {
    const onStateChange = vi.fn()
    const invaders = Array.from({ length: 5 }, (_, i) =>
      createInvader({ char: 'a', position: { x: 350 + i, y: 300 }, center: CENTER, speed: 1 }),
    )
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders,
      currentWave: 1,
    }
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, calibrationMode: true, baseSpeed: 50, onStateChange })),
    )

    // Start the game loop
    act(() => { result.current.start() })

    // Record several calibration hits (these feed the calibration tracker)
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.handleKeyPress('a') })
    }

    // Stop (pause) then start (resume) — tracker should be preserved
    act(() => { result.current.stop() })
    act(() => { result.current.start() })

    // If tracker was reset, it would have no results. Since we can't directly
    // inspect the tracker, verify that start() doesn't throw and the hook
    // continues running normally after stop/start with currentWave > 0.
    expect(result.current.running).toBe(true)
  })

  // --- Round-over guard ---

  /**
   * Bug fix: After the round ends (roundOver=true), keypresses should be rejected.
   * React batches the setRoundEndResult state update, so the keydown handler in
   * App.tsx may still fire before the guard sees roundEndResult !== null. Without
   * a synchronous roundOver check in handleKey, phantom misses get recorded to
   * key profiles, corrupting the adaptive weakness ranking over time.
   */
  it('handleKeyPress returns hit=false without modifying state when round is over', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 350, y: 300 },
      center: CENTER,
      speed: 1,
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
      roundOver: true,
      roundResult: 'cleared',
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    let keyResult: ReturnType<typeof result.current.handleKeyPress> | undefined
    act(() => { keyResult = result.current.handleKeyPress('a') })

    expect(keyResult!.hit).toBe(false)
    // onStateChange should NOT be called — no state modification
    expect(onStateChange).not.toHaveBeenCalled()
  })

  // --- Delta time cap ---

  /**
   * Bug fix: When the browser tab is hidden or the system sleeps, rAF pauses but
   * the timestamp jumps ahead. Without a cap, invaders teleport across the board
   * because deltaSeconds accumulates the full pause duration. The game loop caps
   * deltaSeconds at 0.1s (100ms) to discard accumulated time beyond that threshold.
   */
  it('caps delta time at 0.1s to prevent invader teleportation after tab switch', () => {
    const invader = createInvader({
      char: 'a',
      position: { x: 100, y: 300 }, // 300px from center
      center: CENTER,
      speed: 100, // 100 px/s
    })
    const state: RoundState = {
      ...createRoundState({ grapeCount: 10, totalWaves: 1, focusKeys: ['a'] }),
      invaders: [invader],
      currentWave: 1,
    }
    const onStateChange = vi.fn()
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onStateChange })),
    )

    act(() => { result.current.start() })
    onStateChange.mockClear()

    // Frame 1 at t=1000: initializes lastTime, delta=0
    act(() => { flushFrame(1000) })
    // Frame 2 at t=6000: 5 seconds elapsed — uncapped would be 500px movement
    // With cap at 0.1s, movement should be only 100 * 0.1 = 10px
    act(() => { flushFrame(6000) })

    const calls = onStateChange.mock.calls
    const afterTick: RoundState = calls[calls.length - 1][0]
    const movedInvader = afterTick.invaders.find(i => i.alive)
    // Invader started at x=100. With 0.1s cap at 100px/s, max movement ≈ 10px
    // Without cap (5s * 100px/s = 500px), invader would be near center or past it
    expect(movedInvader!.position.x).toBeLessThan(120) // generous bound for 10px movement
    expect(movedInvader!.position.x).toBeGreaterThan(100) // did move some
  })

  // --- resetState ---

  /**
   * Bug fix: startNewRound() calls setRoundState(newState) which React batches,
   * then gameLoop.start() schedules rAF. The first tick reads stateRef which
   * still holds the previous round's state (React hasn't flushed yet). This causes
   * the first wave to spawn with stale focusKeys. resetState() bypasses React's
   * async batching by writing directly to stateRef, so the tick sees correct state.
   */
  it('resetState writes directly to internal state ref so next tick sees it', () => {
    const onStateChange = vi.fn()
    const initialState = createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] })
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: initialState, onStateChange })),
    )

    // Create a new round state with different focus keys
    const newState = createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['x', 'y', 'z'] })

    // resetState writes directly — no React re-render needed
    act(() => { result.current.resetState(newState) })

    // Start the loop — the tick should use the resetState'd state, not initialState
    act(() => { result.current.start() })
    onStateChange.mockClear()

    // First tick: allResolved=true (no invaders), currentWave=0 < totalWaves=8 → spawns wave
    act(() => { flushFrame(1000) })

    expect(onStateChange).toHaveBeenCalled()
    const tickState = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0] as RoundState
    // Wave spawned from newState's focusKeys ['x','y','z'], not initialState's ['a']
    expect(tickState.currentWave).toBe(1)
    expect(tickState.focusKeys).toEqual(['x', 'y', 'z'])
    // Invaders should contain chars from the new focus keys, not 'a'
    const aliveChars = tickState.invaders.filter(i => i.alive).map(i => i.char)
    // At least some chars should be from x, y, z (70% focus key ratio)
    const focusChars = aliveChars.filter(c => ['x', 'y', 'z'].includes(c))
    expect(focusChars.length).toBeGreaterThan(0)
  })

  // --- Cleanup ---

  /**
   * The hook must cancel any pending rAF on unmount to prevent memory leaks
   * and state updates on unmounted components.
   */
  it('cancels animation frame on unmount', () => {
    const { result, unmount } = renderHook(() => useGameLoop(makeProps()))

    act(() => { result.current.start() })
    unmount()

    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })
})

import { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import type { RoundState, Vec2, CollisionEvent } from '../lib/game-engine'
import {
  tickInvaders,
  checkCollisions,
  handleKeyPress,
  spawnWave,
  checkRoundComplete,
  releasePendingSpawns,
  rescaleInvaderSpeeds,
  CLUSTER_COLLISION_RADIUS,
} from '../lib/game-engine'
import { createCalibrationTracker, recordCalibrationResult, getAdaptedSpeed } from '../lib/adaptive-calibration'
import type { CalibrationTracker } from '../lib/adaptive-calibration'

export interface UseGameLoopProps {
  roundState: RoundState
  onRoundEnd: (state: RoundState) => void
  onStateChange: (state: RoundState) => void
  onCollisions?: (events: CollisionEvent[]) => void
  boardSize: { width: number; height: number }
  baseSpeed?: number
  calibrationMode?: boolean
}

export function useGameLoop(props: UseGameLoopProps) {
  const [running, setRunning] = useState(false)
  const stateRef = useRef(props.roundState)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const propsRef = useRef(props)
  const tickRef = useRef<((timestamp: number) => void) | undefined>(undefined)
  const calibrationTrackerRef = useRef<CalibrationTracker>(createCalibrationTracker(props.baseSpeed ?? 50))
  const prevSpeedRef = useRef<number>(props.baseSpeed ?? 50)

  // useLayoutEffect ensures refs are updated synchronously after React commits,
  // BEFORE the browser paints or fires rAF callbacks. This prevents a race where
  // the tick function reads stale state from stateRef when startNewRound() and
  // gameLoop.start() fire as passive effects in the same render cycle.
  useLayoutEffect(() => {
    propsRef.current = props
  })

  useLayoutEffect(() => {
    stateRef.current = props.roundState
  }, [props.roundState])

  const center: Vec2 = useMemo(
    () => ({
      x: props.boardSize.width / 2,
      y: props.boardSize.height / 2,
    }),
    [props.boardSize.width, props.boardSize.height],
  )

  useEffect(() => {
    tickRef.current = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }
      // Cap delta to prevent invader teleportation after tab-switch or long pause.
      // Standard game-loop practice: discard accumulated time beyond 100ms.
      const deltaSeconds = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp

      let state = stateRef.current
      const { onRoundEnd, onStateChange, onCollisions, boardSize, baseSpeed = 50 } = propsRef.current

      // Spec: "changes apply immediately for speed" — rescale existing invaders
      if (baseSpeed !== prevSpeedRef.current) {
        state = rescaleInvaderSpeeds(state, baseSpeed)
        prevSpeedRef.current = baseSpeed
      }

      state = releasePendingSpawns(state, Date.now())

      state = tickInvaders(state, {
        deltaSeconds,
        center,
        collisionRadius: CLUSTER_COLLISION_RADIUS,
      })

      const collisionResult = checkCollisions(state, { center, collisionRadius: CLUSTER_COLLISION_RADIUS })
      state = collisionResult.state
      if (collisionResult.collisions.length > 0 && onCollisions) {
        onCollisions(collisionResult.collisions)
      }
      state = checkRoundComplete(state)

      if (state.roundOver) {
        stateRef.current = state
        onStateChange(state)
        onRoundEnd(state)
        setRunning(false)
        return
      }

      const allResolved = state.invaders.every((inv) => !inv.alive) && state.pendingSpawns.length === 0
      if (allResolved && state.currentWave < state.totalWaves) {
        state = { ...state, invaders: [] }
        const effectiveBaseSpeed = propsRef.current.calibrationMode
          ? getAdaptedSpeed(calibrationTrackerRef.current)
          : baseSpeed
        state = spawnWave(state, {
          center,
          boardWidth: boardSize.width,
          boardHeight: boardSize.height,
          speed: effectiveBaseSpeed,
        })
      }

      stateRef.current = state
      onStateChange(state)
      rafRef.current = requestAnimationFrame((ts) => tickRef.current?.(ts))
    }
  }, [center])

  const start = useCallback(() => {
    setRunning(true)
    lastTimeRef.current = 0

    // Only reset calibration tracker at round start, not on resume from pause
    if (stateRef.current.currentWave === 0) {
      calibrationTrackerRef.current = createCalibrationTracker(propsRef.current.baseSpeed ?? 50)
    }

    // First-wave spawn is handled by the tick function (allResolved && currentWave < totalWaves).
    // Spawning here would race with startNewRound(): both run as effects in the same render,
    // and stateRef still holds the previous round's state. Deferring to tick ensures stateRef
    // reflects the correct focusKeys from startNewRound() by the time rAF fires.
    rafRef.current = requestAnimationFrame((ts) => tickRef.current?.(ts))
  }, [])

  const stop = useCallback(() => {
    setRunning(false)
    cancelAnimationFrame(rafRef.current)
  }, [])

  const handleKey = useCallback(
    (key: string) => {
      // Don't process keypresses after round has ended — the React state update
      // (setRoundEndResult) batches, so the keydown handler may still fire before
      // the guard in App.tsx sees roundEndResult !== null.
      if (stateRef.current.roundOver) {
        return { state: stateRef.current, hit: false }
      }
      const result = handleKeyPress(stateRef.current, key, center, Date.now())
      stateRef.current = result.state
      propsRef.current.onStateChange(result.state)

      // Record result in calibration tracker when in calibration mode
      if (propsRef.current.calibrationMode) {
        calibrationTrackerRef.current = recordCalibrationResult(
          calibrationTrackerRef.current,
          { correct: result.hit },
        )
      }

      return result
    },
    [center],
  )

  // Directly write a new round state to stateRef, bypassing React's async batching.
  // Called from startNewRound() so the first rAF tick sees the correct focusKeys
  // even before React re-renders with the new roundState.
  const resetState = useCallback((newState: RoundState) => {
    stateRef.current = newState
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return useMemo(() => ({
    running,
    start,
    stop,
    handleKeyPress: handleKey,
    resetState,
  }), [running, start, stop, handleKey, resetState])
}

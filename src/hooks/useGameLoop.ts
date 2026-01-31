import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { RoundState, Vec2 } from '../lib/game-engine'
import {
  tickInvaders,
  checkCollisions,
  handleKeyPress,
  spawnWave,
  checkRoundComplete,
  releasePendingSpawns,
} from '../lib/game-engine'

export interface UseGameLoopProps {
  roundState: RoundState
  onRoundEnd: (state: RoundState) => void
  onStateChange: (state: RoundState) => void
  boardSize: { width: number; height: number }
  baseSpeed?: number
}

export function useGameLoop(props: UseGameLoopProps) {
  const [running, setRunning] = useState(false)
  const stateRef = useRef(props.roundState)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const propsRef = useRef(props)
  const tickRef = useRef<((timestamp: number) => void) | undefined>(undefined)

  useEffect(() => {
    propsRef.current = props
  })

  useEffect(() => {
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
      const deltaSeconds = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      let state = stateRef.current
      const { onRoundEnd, onStateChange, boardSize, baseSpeed = 50 } = propsRef.current

      state = releasePendingSpawns(state, Date.now())

      state = tickInvaders(state, {
        deltaSeconds,
        center,
        collisionRadius: 30,
      })

      state = checkCollisions(state, { center, collisionRadius: 30 })
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
        state = spawnWave(state, {
          center,
          boardWidth: boardSize.width,
          boardHeight: boardSize.height,
          speed: baseSpeed,
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

    let state = stateRef.current
    if (state.currentWave === 0) {
      state = spawnWave(state, {
        center,
        boardWidth: propsRef.current.boardSize.width,
        boardHeight: propsRef.current.boardSize.height,
        speed: propsRef.current.baseSpeed ?? 50,
      })
      stateRef.current = state
      propsRef.current.onStateChange(state)
    }

    rafRef.current = requestAnimationFrame((ts) => tickRef.current?.(ts))
  }, [center])

  const stop = useCallback(() => {
    setRunning(false)
    cancelAnimationFrame(rafRef.current)
  }, [])

  const handleKey = useCallback(
    (key: string) => {
      const result = handleKeyPress(stateRef.current, key, center)
      stateRef.current = result.state
      propsRef.current.onStateChange(result.state)
      return result
    },
    [center],
  )

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return {
    running,
    start,
    stop,
    handleKeyPress: handleKey,
  }
}

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { GrapeLeaf } from './GameBoard'
import { SpriteRenderer } from './SpriteRenderer'
import { getCharColor, SPRITE_TEMPLATES } from '../lib/sprites'

interface OnboardingDemoProps {
  onComplete: () => void
  boardSize?: { width: number; height: number }
}

interface DemoInvader {
  char: string
  x: number
  y: number
  alive: boolean
  spawnTime: number
  spriteIndex: number
}

const DEMO_CHARS = ['a', 's', 'd', 'f', 'j']
const DEMO_SPEED = 30 // px/s — slow for demo
const PROXIMITY_THRESHOLD = 80 // px from center to trigger "Watch out!" prompt
const SPAWN_INTERVAL = 3000 // ms between invader spawns

function getSpawnPositions(w: number, h: number) {
  return [
    { x: 0, y: h * 0.25 },
    { x: w, y: h * 0.5 },
    { x: w * 0.25, y: 0 },
    { x: w * 0.75, y: h },
    { x: 0, y: h * 0.75 },
  ]
}

export function OnboardingDemo({ onComplete, boardSize }: OnboardingDemoProps) {
  const W = boardSize?.width ?? 800
  const H = boardSize?.height ?? 600
  const centerX = W / 2
  const centerY = H / 2
  const spawnPositions = useMemo(() => getSpawnPositions(W, H), [W, H])

  // Refs for values read inside the rAF animation tick
  const centerRef = useRef({ x: centerX, y: centerY })
  useEffect(() => {
    centerRef.current = { x: centerX, y: centerY }
  }, [centerX, centerY])

  const [invaders, setInvaders] = useState<DemoInvader[]>([])
  const [destroyed, setDestroyed] = useState(0)
  const [nextSpawnIndex, setNextSpawnIndex] = useState(0)
  const [proximityTriggered, setProximityTriggered] = useState(false)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const spawnTimerRef = useRef(0)
  const spawnedCountRef = useRef(0)

  const allDone = destroyed >= DEMO_CHARS.length

  // Determine prompt based on spec rules (hidden when allDone — the button shows instead)
  let prompt: string
  if (proximityTriggered) {
    prompt = 'Watch out for the grapes!'
  } else if (destroyed >= 2) {
    prompt = 'Nice! Keep going.'
  } else {
    prompt = 'Type the character to destroy the invader!'
  }

  // Spawn invaders one at a time
  useEffect(() => {
    if (nextSpawnIndex >= DEMO_CHARS.length || allDone) return

    const spawnOne = () => {
      const idx = nextSpawnIndex
      // Guard against double-spawning (effect can re-fire if spawnPositions ref changes)
      if (spawnedCountRef.current > idx) return
      spawnedCountRef.current = idx + 1
      const pos = spawnPositions[idx]
      setInvaders((prev) => [
        ...prev,
        {
          char: DEMO_CHARS[idx],
          x: pos.x,
          y: pos.y,
          alive: true,
          spawnTime: Date.now(),
          spriteIndex: Math.floor(Math.random() * SPRITE_TEMPLATES.length),
        },
      ])
      setNextSpawnIndex((i) => i + 1)
    }

    if (nextSpawnIndex === 0) {
      // Spawn first invader immediately
      spawnOne()
    } else {
      // Spawn subsequent invaders after interval
      spawnTimerRef.current = window.setTimeout(spawnOne, SPAWN_INTERVAL)
      return () => clearTimeout(spawnTimerRef.current)
    }
  }, [nextSpawnIndex, allDone, spawnPositions])

  // Use a ref to track proximity so the rAF callback can set state only once
  const proximityFiredRef = useRef(false)

  // Animation loop — move invaders toward center
  useEffect(() => {
    if (allDone) {
      cancelAnimationFrame(animRef.current)
      return
    }

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      const cx = centerRef.current.x
      const cy = centerRef.current.y

      setInvaders((prev) => {
        const next = prev.map((inv) => {
          if (!inv.alive) return inv
          const dx = cx - inv.x
          const dy = cy - inv.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 2) return inv // close enough, stop
          const move = Math.min(DEMO_SPEED * dt, dist)
          return {
            ...inv,
            x: inv.x + (dx / dist) * move,
            y: inv.y + (dy / dist) * move,
          }
        })

        // Check proximity inside the updater to trigger prompt
        if (!proximityFiredRef.current) {
          for (const inv of next) {
            if (!inv.alive) continue
            const dx = cx - inv.x
            const dy = cy - inv.y
            if (Math.sqrt(dx * dx + dy * dy) < PROXIMITY_THRESHOLD) {
              proximityFiredRef.current = true
              // Schedule state update outside of this updater
              queueMicrotask(() => setProximityTriggered(true))
              break
            }
          }
        }

        return next
      })

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [allDone])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && allDone) {
        onComplete()
        return
      }
      if (allDone) return
      if (e.key.length !== 1) return
      const key = e.key.toLowerCase()
      const cx = centerRef.current.x
      const cy = centerRef.current.y
      // Find the nearest alive invader matching the key
      let bestIdx = -1
      let bestDist = Infinity
      for (let i = 0; i < invaders.length; i++) {
        const inv = invaders[i]
        if (!inv.alive || inv.char !== key) continue
        const dx = cx - inv.x
        const dy = cy - inv.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }
      if (bestIdx >= 0) {
        setInvaders((prev) =>
          prev.map((inv, i) => (i === bestIdx ? { ...inv, alive: false } : inv)),
        )
        setDestroyed((d) => d + 1)
      }
    },
    [invaders, allDone, onComplete],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="onboarding-demo" data-testid="onboarding-demo" style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
      {!allDone && <p className="demo-prompt" data-testid="demo-prompt">{prompt}</p>}

      {/* Mini grape cluster at center — matches the real game look */}
      <div
        className="demo-grape-target grape-cluster"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        <GrapeLeaf />
        <div className="grape-trunk" />
        <div className="grape-row">
          <div className="grape" />
          <div className="grape" />
          <div className="grape" />
        </div>
        <div className="grape-row">
          <div className="grape" />
          <div className="grape" />
        </div>
      </div>

      {invaders
        .filter((inv) => inv.alive)
        .map((inv) => {
          const charColor = getCharColor(inv.char)
          const spriteTemplate = SPRITE_TEMPLATES[inv.spriteIndex % SPRITE_TEMPLATES.length]
          return (
            <div
              key={inv.char}
              data-testid="demo-invader"
              className="invader"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${inv.x}px, ${inv.y}px) translate(-50%, -50%)`,
                color: charColor.primary,
                borderColor: charColor.secondary,
                textShadow: `0 0 6px ${charColor.primary}`,
              }}
            >
              <SpriteRenderer
                template={spriteTemplate}
                primaryColor={charColor.primary}
                secondaryColor={charColor.secondary}
                size={44}
              />
              <span className="invader-char">{inv.char}</span>
            </div>
          )
        })}

      {allDone && (
        <button
          className="demo-ready-btn"
          onClick={onComplete}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '15%',
            transform: 'translateX(-50%)',
          }}
        >
          Ready? Let&apos;s calibrate!
        </button>
      )}
    </div>
  )
}

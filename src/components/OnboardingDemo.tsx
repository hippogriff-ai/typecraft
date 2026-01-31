import { useState, useCallback, useEffect, useRef } from 'react'

interface OnboardingDemoProps {
  onComplete: () => void
}

interface DemoInvader {
  char: string
  x: number
  y: number
  alive: boolean
  spawnTime: number
}

const DEMO_CHARS = ['a', 's', 'd', 'f', 'j']
const CENTER_X = 400
const CENTER_Y = 300
const DEMO_SPEED = 30 // px/s — slow for demo
const PROXIMITY_THRESHOLD = 80 // px from center to trigger "Watch out!" prompt
const SPAWN_INTERVAL = 3000 // ms between invader spawns

// Spawn positions along edges of an 800x600 viewport
const SPAWN_POSITIONS = [
  { x: 0, y: 150 },
  { x: 800, y: 300 },
  { x: 200, y: 0 },
  { x: 600, y: 600 },
  { x: 0, y: 450 },
]

export function OnboardingDemo({ onComplete }: OnboardingDemoProps) {
  const [invaders, setInvaders] = useState<DemoInvader[]>([])
  const [destroyed, setDestroyed] = useState(0)
  const [nextSpawnIndex, setNextSpawnIndex] = useState(0)
  const [proximityTriggered, setProximityTriggered] = useState(false)
  const animRef = useRef(0)
  const lastTimeRef = useRef(0)
  const spawnTimerRef = useRef(0)

  const allDone = destroyed >= DEMO_CHARS.length

  // Determine prompt based on spec rules
  let prompt: string
  if (allDone) {
    prompt = "Ready? Let's calibrate!"
  } else if (proximityTriggered) {
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
      const pos = SPAWN_POSITIONS[idx]
      setInvaders((prev) => [
        ...prev,
        {
          char: DEMO_CHARS[idx],
          x: pos.x,
          y: pos.y,
          alive: true,
          spawnTime: Date.now(),
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
  }, [nextSpawnIndex, allDone])

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

      setInvaders((prev) => {
        const next = prev.map((inv) => {
          if (!inv.alive) return inv
          const dx = CENTER_X - inv.x
          const dy = CENTER_Y - inv.y
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
            const dx = CENTER_X - inv.x
            const dy = CENTER_Y - inv.y
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
      if (allDone) return
      // Find the nearest alive invader matching the key
      let bestIdx = -1
      let bestDist = Infinity
      for (let i = 0; i < invaders.length; i++) {
        const inv = invaders[i]
        if (!inv.alive || inv.char !== e.key) continue
        const dx = CENTER_X - inv.x
        const dy = CENTER_Y - inv.y
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
    [invaders, allDone],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="onboarding-demo" data-testid="onboarding-demo" style={{ position: 'relative', width: 800, height: 600, margin: '0 auto' }}>
      <p className="demo-prompt" data-testid="demo-prompt">{prompt}</p>

      {/* Center grape indicator */}
      <div
        className="demo-grape-target"
        style={{
          position: 'absolute',
          left: CENTER_X - 20,
          top: CENTER_Y - 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #9b4dca, #6b2fa0)',
          border: '2px solid #4ade80',
        }}
      />

      {invaders
        .filter((inv) => inv.alive)
        .map((inv, i) => (
          <div
            key={i}
            data-testid="demo-invader"
            className="demo-invader invader"
            style={{
              position: 'absolute',
              left: inv.x,
              top: inv.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {inv.char}
          </div>
        ))}

      {allDone && (
        <button className="demo-ready-btn" onClick={onComplete}>
          Ready? Let&apos;s calibrate!
        </button>
      )}
    </div>
  )
}

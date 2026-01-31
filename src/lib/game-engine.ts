import { selectWordsForFocus } from './word-list'

export interface Vec2 {
  x: number
  y: number
}

export interface Invader {
  char: string
  position: Vec2
  velocity: Vec2
  alive: boolean
  spawnTime: number
}

export interface PendingInvader {
  char: string
  position: Vec2
  center: Vec2
  speed: number
  spawnAt: number
}

export interface RoundState {
  grapes: number
  maxGrapes: number
  damageCounter: number
  invaders: Invader[]
  pendingSpawns: PendingInvader[]
  currentWave: number
  totalWaves: number
  focusKeys: string[]
  roundOver: boolean
  roundResult?: 'cleared' | 'grapes_lost'
  score: number
  totalSpawned: number
  maxInvadersPerWave: number
}

function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function normalize(v: Vec2, speed: number): Vec2 {
  const mag = Math.sqrt(v.x ** 2 + v.y ** 2)
  if (mag === 0) return { x: 0, y: 0 }
  return { x: (v.x / mag) * speed, y: (v.y / mag) * speed }
}

export function createInvader(opts: {
  char: string
  position: Vec2
  center: Vec2
  speed: number
  spawnTime?: number
}): Invader {
  const direction = {
    x: opts.center.x - opts.position.x,
    y: opts.center.y - opts.position.y,
  }
  const velocity = normalize(direction, opts.speed)

  return {
    char: opts.char,
    position: { ...opts.position },
    velocity,
    alive: true,
    spawnTime: opts.spawnTime ?? 0,
  }
}

export function createRoundState(opts: {
  grapeCount: number
  totalWaves: number
  focusKeys: string[]
  maxInvadersPerWave?: number
}): RoundState {
  return {
    grapes: opts.grapeCount,
    maxGrapes: opts.grapeCount,
    damageCounter: 0,
    invaders: [],
    pendingSpawns: [],
    currentWave: 0,
    totalWaves: opts.totalWaves,
    focusKeys: opts.focusKeys,
    roundOver: false,
    score: 0,
    totalSpawned: 0,
    maxInvadersPerWave: opts.maxInvadersPerWave ?? 12,
  }
}

function randomEdgePosition(
  boardWidth: number,
  boardHeight: number,
): Vec2 {
  const edge = Math.floor(Math.random() * 4)
  switch (edge) {
    case 0: return { x: Math.random() * boardWidth, y: 0 }
    case 1: return { x: Math.random() * boardWidth, y: boardHeight }
    case 2: return { x: 0, y: Math.random() * boardHeight }
    default: return { x: boardWidth, y: Math.random() * boardHeight }
  }
}

export function spawnWave(
  state: RoundState,
  opts: {
    center: Vec2
    boardWidth: number
    boardHeight: number
    speed: number
  },
): RoundState {
  const nextWave = state.currentWave + 1
  const escalation = (nextWave - 1) * 5
  const effectiveSpeed = opts.speed + escalation
  const rawCount = 3 + nextWave
  const count = Math.min(rawCount, state.maxInvadersPerWave)

  const words = selectWordsForFocus({ focusKeys: state.focusKeys, count: Math.ceil(count / 3) })

  const chars: { char: string; batchOrigin: Vec2 }[] = []
  for (const word of words) {
    const origin = randomEdgePosition(opts.boardWidth, opts.boardHeight)
    for (const ch of word) {
      chars.push({ char: ch, batchOrigin: origin })
    }
  }

  // Trim or pad to exact count, preferring to keep focus characters
  while (chars.length > count) {
    let removed = false
    for (let i = chars.length - 1; i >= 0; i--) {
      if (!state.focusKeys.includes(chars[i].char)) {
        chars.splice(i, 1)
        removed = true
        break
      }
    }
    if (!removed) chars.pop()
  }
  while (chars.length < count) {
    const char = state.focusKeys[Math.floor(Math.random() * state.focusKeys.length)]
    const origin = randomEdgePosition(opts.boardWidth, opts.boardHeight)
    chars.push({ char, batchOrigin: origin })
  }

  // Split into batches of ~3 characters, staggered 1-2s apart
  const BATCH_SIZE = 3
  const now = Date.now()
  const immediateInvaders: Invader[] = []
  const pending: PendingInvader[] = []

  for (let i = 0; i < chars.length; i++) {
    const batchIndex = Math.floor(i / BATCH_SIZE)
    const { char, batchOrigin } = chars[i]
    const spread = 30
    const position = {
      x: batchOrigin.x + (Math.random() - 0.5) * spread,
      y: batchOrigin.y + (Math.random() - 0.5) * spread,
    }

    if (batchIndex === 0) {
      // First batch spawns immediately
      immediateInvaders.push(
        createInvader({ char, position, center: opts.center, speed: effectiveSpeed, spawnTime: now }),
      )
    } else {
      // Subsequent batches delayed by 1-2s per batch
      const delay = batchIndex * (1000 + Math.random() * 1000)
      pending.push({ char, position, center: opts.center, speed: effectiveSpeed, spawnAt: now + delay })
    }
  }

  return {
    ...state,
    invaders: [...state.invaders, ...immediateInvaders],
    pendingSpawns: [...state.pendingSpawns, ...pending],
    currentWave: nextWave,
    totalSpawned: state.totalSpawned + count,
  }
}

export function releasePendingSpawns(state: RoundState, currentTime: number): RoundState {
  const ready: PendingInvader[] = []
  const stillPending: PendingInvader[] = []

  for (const p of state.pendingSpawns) {
    if (currentTime >= p.spawnAt) {
      ready.push(p)
    } else {
      stillPending.push(p)
    }
  }

  if (ready.length === 0) return state

  const newInvaders = ready.map((p) =>
    createInvader({ char: p.char, position: p.position, center: p.center, speed: p.speed, spawnTime: currentTime }),
  )

  return {
    ...state,
    invaders: [...state.invaders, ...newInvaders],
    pendingSpawns: stillPending,
  }
}

export function tickInvaders(
  state: RoundState,
  opts: {
    deltaSeconds: number
    center: Vec2
    collisionRadius: number
  },
): RoundState {
  const invaders = state.invaders.map((inv) => {
    if (!inv.alive) return inv
    return {
      ...inv,
      position: {
        x: inv.position.x + inv.velocity.x * opts.deltaSeconds,
        y: inv.position.y + inv.velocity.y * opts.deltaSeconds,
      },
    }
  })

  return { ...state, invaders }
}

export function checkCollisions(
  state: RoundState,
  opts: { center: Vec2; collisionRadius: number },
): RoundState {
  let damageCounter = state.damageCounter
  let grapes = state.grapes
  let roundOver = state.roundOver
  let roundResult = state.roundResult

  const invaders = state.invaders.map((inv) => {
    if (!inv.alive) return inv
    const dist = distance(inv.position, opts.center)
    if (dist <= opts.collisionRadius) {
      damageCounter++
      if (damageCounter % 3 === 0) {
        grapes = Math.max(0, grapes - 1)
      }
      if (grapes <= 0) {
        roundOver = true
        roundResult = 'grapes_lost'
      }
      return { ...inv, alive: false }
    }
    return inv
  })

  return { ...state, invaders, damageCounter, grapes, roundOver, roundResult }
}

export function handleKeyPress(
  state: RoundState,
  key: string,
  center: Vec2,
  currentTime?: number,
): { state: RoundState; hit: boolean; reactionTimeMs?: number; destroyedPosition?: Vec2 } {
  const matchingAlive = state.invaders
    .map((inv, idx) => ({ inv, idx }))
    .filter(({ inv }) => inv.alive && inv.char === key)

  if (matchingAlive.length === 0) {
    return { state, hit: false }
  }

  matchingAlive.sort(
    (a, b) => distance(a.inv.position, center) - distance(b.inv.position, center),
  )

  const nearest = matchingAlive[0]
  const invaders = state.invaders.map((inv, idx) =>
    idx === nearest.idx ? { ...inv, alive: false } : inv,
  )

  const reactionTimeMs =
    currentTime !== undefined
      ? currentTime - nearest.inv.spawnTime
      : undefined

  return {
    state: { ...state, invaders, score: state.score + 1 },
    hit: true,
    reactionTimeMs,
    destroyedPosition: { ...nearest.inv.position },
  }
}

export function checkRoundComplete(state: RoundState): RoundState {
  if (state.roundOver) return state

  if (state.grapes <= 0) {
    return { ...state, roundOver: true, roundResult: 'grapes_lost' }
  }

  if (
    state.currentWave >= state.totalWaves &&
    state.pendingSpawns.length === 0 &&
    state.invaders.every((inv) => !inv.alive)
  ) {
    return { ...state, roundOver: true, roundResult: 'cleared' }
  }

  return state
}

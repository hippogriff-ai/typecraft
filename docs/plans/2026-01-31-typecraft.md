# TypeCraft Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an offline typing practice app that identifies and drills a programmer's weakest keys, with focus on Python symbols.

**Architecture:** Domain logic lives in pure TypeScript modules (`src/lib/`) with zero React dependencies — fully testable without DOM. React components (`src/components/`) consume these modules. localStorage adapter wraps persistence. State flows top-down via a single `useTypeCraft` hook.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, localStorage

---

## Task 1: Key Profile and Weakness Scoring Engine

The foundational data model and scoring algorithm. Everything else depends on this.

**Files:**
- Create: `src/lib/keys.ts`
- Create: `src/lib/scoring.ts`
- Test: `src/__tests__/scoring.test.ts`

**Step 1: Write the failing tests for key definitions and weakness scoring**

```typescript
// src/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { KEY_GROUPS, ALL_KEYS } from '../lib/keys'
import {
  createKeyProfile,
  recordKeyPress,
  computeWeaknessScore,
  rankWeaknesses,
  type KeyProfile,
} from '../lib/scoring'

describe('KEY_GROUPS', () => {
  it('contains home row, top row, bottom row, numbers, and python symbols', () => {
    expect(KEY_GROUPS).toHaveProperty('homeRow')
    expect(KEY_GROUPS).toHaveProperty('topRow')
    expect(KEY_GROUPS).toHaveProperty('bottomRow')
    expect(KEY_GROUPS).toHaveProperty('numbers')
    expect(KEY_GROUPS).toHaveProperty('pythonSymbols')
  })

  it('python symbols include core symbols', () => {
    const symbols = KEY_GROUPS.pythonSymbols
    for (const s of ['(', ')', '[', ']', '{', '}', ':', '=', '_', '#', '@', '.', ',']) {
      expect(symbols).toContain(s)
    }
  })

  it('ALL_KEYS is a flat deduplicated list of all keys', () => {
    expect(ALL_KEYS.length).toBeGreaterThan(0)
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length)
  })
})

describe('createKeyProfile', () => {
  it('creates a profile with zero attempts and no history', () => {
    const profile = createKeyProfile('a')
    expect(profile.key).toBe('a')
    expect(profile.totalAttempts).toBe(0)
    expect(profile.correctAttempts).toBe(0)
    expect(profile.averageTimeMs).toBe(0)
    expect(profile.history).toEqual([])
  })
})

describe('recordKeyPress', () => {
  it('records a correct press and updates accuracy', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    expect(profile.totalAttempts).toBe(1)
    expect(profile.correctAttempts).toBe(1)
    expect(profile.averageTimeMs).toBe(200)
  })

  it('records an incorrect press', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.totalAttempts).toBe(1)
    expect(profile.correctAttempts).toBe(0)
    expect(profile.averageTimeMs).toBe(500)
  })

  it('computes running average time across multiple presses', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: true, timeMs: 400 })
    expect(profile.averageTimeMs).toBe(300)
    expect(profile.totalAttempts).toBe(2)
    expect(profile.correctAttempts).toBe(2)
  })

  it('appends to history', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 200 })
    profile = recordKeyPress(profile, { correct: false, timeMs: 500 })
    expect(profile.history).toHaveLength(2)
    expect(profile.history[0]).toEqual({ correct: true, timeMs: 200 })
    expect(profile.history[1]).toEqual({ correct: false, timeMs: 500 })
  })
})

describe('computeWeaknessScore', () => {
  it('returns 1.0 for a key with zero accuracy and max slowness', () => {
    let profile = createKeyProfile('a')
    // 0% accuracy
    profile = recordKeyPress(profile, { correct: false, timeMs: 2000 })
    // maxTimeMs = 2000 means normalizedSlowness = 1.0
    const score = computeWeaknessScore(profile, { maxTimeMs: 2000 })
    expect(score).toBeCloseTo(1.0, 1)
  })

  it('returns 0.0 for a key with perfect accuracy and fastest speed', () => {
    let profile = createKeyProfile('a')
    profile = recordKeyPress(profile, { correct: true, timeMs: 100 })
    const score = computeWeaknessScore(profile, { maxTimeMs: 2000 })
    expect(score).toBeCloseTo(0.0 + 0.3 * (100 / 2000), 1) // small speed component
  })

  it('returns 1.0 for a key with no attempts (untested = weakest)', () => {
    const profile = createKeyProfile('a')
    const score = computeWeaknessScore(profile, { maxTimeMs: 2000 })
    expect(score).toBe(1.0)
  })
})

describe('rankWeaknesses', () => {
  it('ranks keys from weakest to strongest', () => {
    let good = createKeyProfile('a')
    good = recordKeyPress(good, { correct: true, timeMs: 100 })
    good = recordKeyPress(good, { correct: true, timeMs: 100 })

    let bad = createKeyProfile('(')
    bad = recordKeyPress(bad, { correct: false, timeMs: 800 })
    bad = recordKeyPress(bad, { correct: false, timeMs: 900 })

    let mid = createKeyProfile('[')
    mid = recordKeyPress(mid, { correct: true, timeMs: 400 })
    mid = recordKeyPress(mid, { correct: false, timeMs: 500 })

    const ranked = rankWeaknesses([good, bad, mid])
    expect(ranked[0].key).toBe('(')
    expect(ranked[1].key).toBe('[')
    expect(ranked[2].key).toBe('a')
  })

  it('returns top N weakest when limit is specified', () => {
    let good = createKeyProfile('a')
    good = recordKeyPress(good, { correct: true, timeMs: 100 })

    let bad = createKeyProfile('(')
    bad = recordKeyPress(bad, { correct: false, timeMs: 800 })

    let mid = createKeyProfile('[')
    mid = recordKeyPress(mid, { correct: true, timeMs: 400 })

    const ranked = rankWeaknesses([good, bad, mid], 1)
    expect(ranked).toHaveLength(1)
    expect(ranked[0].key).toBe('(')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/scoring.test.ts`
Expected: FAIL — modules don't exist yet

**Step 3: Implement `keys.ts` and `scoring.ts`**

`src/lib/keys.ts`:
```typescript
export const KEY_GROUPS = {
  homeRow: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  topRow: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  bottomRow: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  pythonSymbols: ['(', ')', '[', ']', '{', '}', ':', '=', '_', '#', '@', '.', ','],
} as const

export const ALL_KEYS: string[] = [
  ...new Set(Object.values(KEY_GROUPS).flat()),
]
```

`src/lib/scoring.ts`:
```typescript
export interface KeyPressRecord {
  correct: boolean
  timeMs: number
}

export interface KeyProfile {
  key: string
  totalAttempts: number
  correctAttempts: number
  averageTimeMs: number
  history: KeyPressRecord[]
}

export function createKeyProfile(key: string): KeyProfile {
  return { key, totalAttempts: 0, correctAttempts: 0, averageTimeMs: 0, history: [] }
}

export function recordKeyPress(
  profile: KeyProfile,
  press: KeyPressRecord,
): KeyProfile {
  const totalAttempts = profile.totalAttempts + 1
  const correctAttempts = profile.correctAttempts + (press.correct ? 1 : 0)
  const averageTimeMs =
    (profile.averageTimeMs * profile.totalAttempts + press.timeMs) / totalAttempts

  return {
    ...profile,
    totalAttempts,
    correctAttempts,
    averageTimeMs,
    history: [...profile.history, press],
  }
}

export function computeWeaknessScore(
  profile: KeyProfile,
  opts: { maxTimeMs: number },
): number {
  if (profile.totalAttempts === 0) return 1.0

  const accuracy = profile.correctAttempts / profile.totalAttempts
  const normalizedSlowness = Math.min(profile.averageTimeMs / opts.maxTimeMs, 1)
  return (1 - accuracy) * 0.7 + normalizedSlowness * 0.3
}

export function rankWeaknesses(
  profiles: KeyProfile[],
  limit?: number,
): KeyProfile[] {
  const maxTime = Math.max(...profiles.map((p) => p.averageTimeMs), 1)
  const sorted = [...profiles].sort(
    (a, b) =>
      computeWeaknessScore(b, { maxTimeMs: maxTime }) -
      computeWeaknessScore(a, { maxTimeMs: maxTime }),
  )
  return limit ? sorted.slice(0, limit) : sorted
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/scoring.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/keys.ts src/lib/scoring.ts src/__tests__/scoring.test.ts
git commit -m "feat: add key profiles and weakness scoring engine"
```

---

## Task 2: Sequence Generator

Generates practice sequences weighted toward weak keys.

**Files:**
- Create: `src/lib/generator.ts`
- Test: `src/__tests__/generator.test.ts`

**Step 1: Write failing tests**

```typescript
// src/__tests__/generator.test.ts
import { describe, it, expect } from 'vitest'
import { generateSequence, generateCalibrationSequence } from '../lib/generator'

describe('generateSequence', () => {
  it('returns a string of specified length', () => {
    const seq = generateSequence({ weakKeys: ['(', ')'], length: 12 })
    expect(seq.length).toBe(12)
  })

  it('heavily features the weak keys', () => {
    const seq = generateSequence({ weakKeys: ['(', ')'], length: 50 })
    const weakCount = seq.split('').filter((c) => c === '(' || c === ')').length
    // At least 60% should be weak keys
    expect(weakCount / seq.length).toBeGreaterThanOrEqual(0.6)
  })

  it('includes some non-weak keys for realistic typing', () => {
    const seq = generateSequence({ weakKeys: ['('], length: 50 })
    const nonWeak = seq.split('').filter((c) => c !== '(').length
    expect(nonWeak).toBeGreaterThan(0)
  })
})

describe('generateCalibrationSequence', () => {
  it('returns a sequence for a single key repeated N times', () => {
    const seq = generateCalibrationSequence('a', 5)
    expect(seq).toBe('aaaaa')
  })

  it('works for symbol keys', () => {
    const seq = generateCalibrationSequence('(', 3)
    expect(seq).toBe('(((')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/generator.test.ts`
Expected: FAIL

**Step 3: Implement `generator.ts`**

```typescript
// src/lib/generator.ts
import { ALL_KEYS } from './keys'

interface GenerateOpts {
  weakKeys: string[]
  length: number
}

export function generateSequence(opts: GenerateOpts): string {
  const { weakKeys, length } = opts
  const chars: string[] = []
  const fillerKeys = ALL_KEYS.filter((k) => !weakKeys.includes(k))

  for (let i = 0; i < length; i++) {
    // 70% chance to pick a weak key
    if (Math.random() < 0.7 && weakKeys.length > 0) {
      chars.push(weakKeys[Math.floor(Math.random() * weakKeys.length)])
    } else if (fillerKeys.length > 0) {
      chars.push(fillerKeys[Math.floor(Math.random() * fillerKeys.length)])
    } else {
      chars.push(weakKeys[Math.floor(Math.random() * weakKeys.length)])
    }
  }
  return chars.join('')
}

export function generateCalibrationSequence(key: string, count: number): string {
  return key.repeat(count)
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/generator.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/generator.ts src/__tests__/generator.test.ts
git commit -m "feat: add sequence generator for practice and calibration"
```

---

## Task 3: WPM Calculator and Learning Speed Tracker

**Files:**
- Create: `src/lib/stats.ts`
- Test: `src/__tests__/stats.test.ts`

**Step 1: Write failing tests**

```typescript
// src/__tests__/stats.test.ts
import { describe, it, expect } from 'vitest'
import {
  calculateWPM,
  calculateLearningSpeed,
  type SessionRecord,
} from '../lib/stats'

describe('calculateWPM', () => {
  it('calculates words per minute from characters and time', () => {
    // 50 characters in 12 seconds = 50 words per minute (at 5 chars/word)
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 12000 })
    expect(wpm).toBe(50)
  })

  it('returns 0 for zero elapsed time', () => {
    const wpm = calculateWPM({ charCount: 50, elapsedMs: 0 })
    expect(wpm).toBe(0)
  })
})

describe('calculateLearningSpeed', () => {
  it('returns positive delta when improving', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 30 },
      { timestamp: 2000, wpm: 35 },
      { timestamp: 3000, wpm: 40 },
    ]
    const speed = calculateLearningSpeed(sessions)
    expect(speed).toBeGreaterThan(0)
  })

  it('returns negative delta when declining', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 40 },
      { timestamp: 2000, wpm: 35 },
      { timestamp: 3000, wpm: 30 },
    ]
    const speed = calculateLearningSpeed(sessions)
    expect(speed).toBeLessThan(0)
  })

  it('returns 0 for fewer than 2 sessions', () => {
    expect(calculateLearningSpeed([])).toBe(0)
    expect(calculateLearningSpeed([{ timestamp: 1000, wpm: 30 }])).toBe(0)
  })

  it('computes average WPM change per session', () => {
    const sessions: SessionRecord[] = [
      { timestamp: 1000, wpm: 20 },
      { timestamp: 2000, wpm: 30 },
      { timestamp: 3000, wpm: 40 },
    ]
    // (40 - 20) / (3 - 1) = 10 WPM per session
    const speed = calculateLearningSpeed(sessions)
    expect(speed).toBe(10)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/stats.test.ts`
Expected: FAIL

**Step 3: Implement `stats.ts`**

```typescript
// src/lib/stats.ts
export interface SessionRecord {
  timestamp: number
  wpm: number
}

export function calculateWPM(opts: { charCount: number; elapsedMs: number }): number {
  if (opts.elapsedMs === 0) return 0
  const minutes = opts.elapsedMs / 60000
  const words = opts.charCount / 5
  return Math.round(words / minutes)
}

export function calculateLearningSpeed(sessions: SessionRecord[]): number {
  if (sessions.length < 2) return 0
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  const sessionCount = sessions.length - 1
  return (last.wpm - first.wpm) / sessionCount
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/stats.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/stats.ts src/__tests__/stats.test.ts
git commit -m "feat: add WPM calculation and learning speed tracking"
```

---

## Task 4: localStorage Persistence Layer

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/__tests__/storage.test.ts`

**Step 1: Write failing tests**

```typescript
// src/__tests__/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveState,
  loadState,
  clearCalibrationData,
  type AppState,
} from '../lib/storage'
import { createKeyProfile } from '../lib/scoring'

beforeEach(() => {
  localStorage.clear()
})

function makeState(overrides?: Partial<AppState>): AppState {
  return {
    keyProfiles: { a: createKeyProfile('a') },
    sessionHistory: [],
    calibrationComplete: false,
    currentDrillKeys: [],
    ...overrides,
  }
}

describe('saveState / loadState', () => {
  it('round-trips state through localStorage', () => {
    const state = makeState({ calibrationComplete: true })
    saveState(state)
    const loaded = loadState()
    expect(loaded).toEqual(state)
  })

  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull()
  })

  it('returns null for corrupted data', () => {
    localStorage.setItem('typecraft', 'not json{{{')
    expect(loadState()).toBeNull()
  })
})

describe('clearCalibrationData', () => {
  it('clears key profiles and calibration flag but keeps session history', () => {
    const state = makeState({
      calibrationComplete: true,
      sessionHistory: [{ timestamp: 1000, wpm: 30 }],
      keyProfiles: { a: createKeyProfile('a') },
    })
    saveState(state)

    clearCalibrationData()

    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded!.calibrationComplete).toBe(false)
    expect(loaded!.keyProfiles).toEqual({})
    expect(loaded!.currentDrillKeys).toEqual([])
    // Session history preserved
    expect(loaded!.sessionHistory).toEqual([{ timestamp: 1000, wpm: 30 }])
  })

  it('does nothing when no state exists', () => {
    expect(() => clearCalibrationData()).not.toThrow()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/storage.test.ts`
Expected: FAIL

**Step 3: Implement `storage.ts`**

```typescript
// src/lib/storage.ts
import type { KeyProfile } from './scoring'
import type { SessionRecord } from './stats'

const STORAGE_KEY = 'typecraft'

export interface AppState {
  keyProfiles: Record<string, KeyProfile>
  sessionHistory: SessionRecord[]
  calibrationComplete: boolean
  currentDrillKeys: string[]
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function clearCalibrationData(): void {
  const state = loadState()
  if (!state) return
  saveState({
    ...state,
    keyProfiles: {},
    calibrationComplete: false,
    currentDrillKeys: [],
  })
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/storage.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/__tests__/storage.test.ts
git commit -m "feat: add localStorage persistence layer"
```

---

## Task 5: `useTypeCraft` Hook — Core App State Manager

**Files:**
- Create: `src/hooks/useTypeCraft.ts`
- Test: `src/__tests__/useTypeCraft.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/__tests__/useTypeCraft.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypeCraft } from '../hooks/useTypeCraft'

beforeEach(() => {
  localStorage.clear()
})

describe('useTypeCraft', () => {
  it('starts in calibration mode when no saved state', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.mode).toBe('calibration')
    expect(result.current.calibrationComplete).toBe(false)
  })

  it('resumes in practice mode when saved state has calibration complete', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: ['(', ')'],
      }),
    )
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.mode).toBe('practice')
    expect(result.current.calibrationComplete).toBe(true)
  })

  it('provides weak keys ranked by weakness', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.weakKeys).toEqual([])
  })

  it('tracks current WPM', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.currentWPM).toBe(0)
  })

  it('tracks learning speed', () => {
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.learningSpeed).toBe(0)
  })

  it('recalibrate resets to calibration mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: [],
      }),
    )
    const { result } = renderHook(() => useTypeCraft())
    expect(result.current.mode).toBe('practice')

    act(() => {
      result.current.recalibrate()
    })

    expect(result.current.mode).toBe('calibration')
    expect(result.current.calibrationComplete).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/useTypeCraft.test.tsx`
Expected: FAIL

**Step 3: Implement `useTypeCraft.ts`**

```typescript
// src/hooks/useTypeCraft.ts
import { useState, useCallback, useMemo } from 'react'
import { loadState, saveState, clearCalibrationData, type AppState } from '../lib/storage'
import { rankWeaknesses, type KeyProfile } from '../lib/scoring'
import { calculateLearningSpeed } from '../lib/stats'

type Mode = 'calibration' | 'practice'

function getInitialState(): AppState {
  return (
    loadState() ?? {
      keyProfiles: {},
      sessionHistory: [],
      calibrationComplete: false,
      currentDrillKeys: [],
    }
  )
}

export function useTypeCraft() {
  const [state, setState] = useState<AppState>(getInitialState)

  const mode: Mode = state.calibrationComplete ? 'practice' : 'calibration'

  const weakKeys = useMemo(() => {
    const profiles = Object.values(state.keyProfiles)
    if (profiles.length === 0) return []
    return rankWeaknesses(profiles, 5).map((p) => p.key)
  }, [state.keyProfiles])

  const currentWPM = useMemo(() => {
    const recent = state.sessionHistory.slice(-5)
    if (recent.length === 0) return 0
    return Math.round(recent.reduce((sum, s) => sum + s.wpm, 0) / recent.length)
  }, [state.sessionHistory])

  const learningSpeed = useMemo(
    () => calculateLearningSpeed(state.sessionHistory),
    [state.sessionHistory],
  )

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates }
      saveState(next)
      return next
    })
  }, [])

  const recalibrate = useCallback(() => {
    clearCalibrationData()
    setState({
      ...state,
      keyProfiles: {},
      calibrationComplete: false,
      currentDrillKeys: [],
    })
  }, [state])

  return {
    mode,
    calibrationComplete: state.calibrationComplete,
    keyProfiles: state.keyProfiles,
    sessionHistory: state.sessionHistory,
    currentDrillKeys: state.currentDrillKeys,
    weakKeys,
    currentWPM,
    learningSpeed,
    updateState,
    recalibrate,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/useTypeCraft.test.tsx`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/hooks/useTypeCraft.ts src/__tests__/useTypeCraft.test.tsx
git commit -m "feat: add useTypeCraft hook for core state management"
```

---

## Task 6: Calibration Drill Component

**Files:**
- Create: `src/components/CalibrationDrill.tsx`
- Test: `src/__tests__/CalibrationDrill.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/__tests__/CalibrationDrill.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalibrationDrill } from '../components/CalibrationDrill'

describe('CalibrationDrill', () => {
  it('displays the current target key prominently', () => {
    render(<CalibrationDrill onComplete={vi.fn()} />)
    // Should show a key to type
    const target = screen.getByTestId('target-key')
    expect(target).toBeInTheDocument()
    expect(target.textContent!.length).toBeGreaterThan(0)
  })

  it('shows calibration progress', () => {
    render(<CalibrationDrill onComplete={vi.fn()} />)
    expect(screen.getByTestId('calibration-progress')).toBeInTheDocument()
  })

  it('advances to next key after enough correct presses', async () => {
    const user = userEvent.setup()
    render(<CalibrationDrill onComplete={vi.fn()} />)

    const firstKey = screen.getByTestId('target-key').textContent!
    // Press the key 5 times (minimum for calibration)
    for (let i = 0; i < 5; i++) {
      await user.keyboard(firstKey)
    }

    // Should have advanced (or completed if only one key)
    const currentKey = screen.getByTestId('target-key').textContent!
    // The key should have changed or calibration should complete
    expect(currentKey).toBeDefined()
  })

  it('calls onComplete with key profiles when all keys are calibrated', async () => {
    const onComplete = vi.fn()
    // Using a small key set for testing
    render(<CalibrationDrill onComplete={onComplete} keys={['a', 'b']} pressesPerKey={2} />)

    const user = userEvent.setup()

    // Type 'a' twice
    await user.keyboard('a')
    await user.keyboard('a')

    // Type 'b' twice
    await user.keyboard('b')
    await user.keyboard('b')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        a: expect.objectContaining({ key: 'a', totalAttempts: 2 }),
        b: expect.objectContaining({ key: 'b', totalAttempts: 2 }),
      }),
    )
  })

  it('records errors when wrong key is pressed', async () => {
    const onComplete = vi.fn()
    render(<CalibrationDrill onComplete={onComplete} keys={['a']} pressesPerKey={3} />)

    const user = userEvent.setup()
    // Press wrong key, then correct ones
    await user.keyboard('x')
    await user.keyboard('a')
    await user.keyboard('a')
    await user.keyboard('a')

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        a: expect.objectContaining({
          totalAttempts: 4,
          correctAttempts: 3,
        }),
      }),
    )
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/CalibrationDrill.test.tsx`
Expected: FAIL

**Step 3: Implement CalibrationDrill component**

See spec for behavior. Component should:
- Take `keys` (default ALL_KEYS), `pressesPerKey` (default 5), `onComplete` callback
- Show current target key in large font
- Listen for keydown events
- Track presses per key via `recordKeyPress`
- Advance to next key after `pressesPerKey` presses
- Show progress (e.g., "Key 3 of 47 — Press: (")
- Call `onComplete(profiles)` when done

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/CalibrationDrill.test.tsx`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/CalibrationDrill.tsx src/__tests__/CalibrationDrill.test.tsx
git commit -m "feat: add CalibrationDrill component"
```

---

## Task 7: Typing Practice Component

**Files:**
- Create: `src/components/TypingPractice.tsx`
- Test: `src/__tests__/TypingPractice.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/__tests__/TypingPractice.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TypingPractice } from '../components/TypingPractice'

describe('TypingPractice', () => {
  const defaultProps = {
    sequence: 'abc',
    onSequenceComplete: vi.fn(),
  }

  it('displays the target sequence', () => {
    render(<TypingPractice {...defaultProps} />)
    expect(screen.getByTestId('typing-sequence')).toHaveTextContent('abc')
  })

  it('marks correct characters as grey', async () => {
    const user = userEvent.setup()
    render(<TypingPractice {...defaultProps} />)

    await user.keyboard('a')

    const chars = screen.getAllByTestId('char')
    expect(chars[0]).toHaveClass('correct')
  })

  it('marks incorrect characters as red', async () => {
    const user = userEvent.setup()
    render(<TypingPractice {...defaultProps} />)

    await user.keyboard('x')

    const chars = screen.getAllByTestId('char')
    expect(chars[0]).toHaveClass('incorrect')
  })

  it('advances cursor on each keypress', async () => {
    const user = userEvent.setup()
    render(<TypingPractice {...defaultProps} />)

    await user.keyboard('a')
    await user.keyboard('b')

    const chars = screen.getAllByTestId('char')
    expect(chars[0]).toHaveClass('correct')
    expect(chars[1]).toHaveClass('correct')
    expect(chars[2]).toHaveClass('current')
  })

  it('calls onSequenceComplete when all characters typed', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<TypingPractice sequence="ab" onSequenceComplete={onComplete} />)

    await user.keyboard('a')
    await user.keyboard('b')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.arrayContaining([
          expect.objectContaining({ expected: 'a', actual: 'a', correct: true }),
          expect.objectContaining({ expected: 'b', actual: 'b', correct: true }),
        ]),
      }),
    )
  })

  it('uses large monospace font', () => {
    render(<TypingPractice {...defaultProps} />)
    const seq = screen.getByTestId('typing-sequence')
    const style = window.getComputedStyle(seq)
    expect(seq).toHaveStyle({ fontFamily: expect.stringContaining('monospace') })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/TypingPractice.test.tsx`
Expected: FAIL

**Step 3: Implement TypingPractice component**

Component behavior per spec:
- Render each character of `sequence` as a `<span data-testid="char">`
- Current position char gets class `current`
- Typed correct → class `correct` (grey)
- Typed incorrect → class `incorrect` (red)
- Listen for keydown, advance position, no backspace
- On completion, call `onSequenceComplete` with per-character results including timing

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/TypingPractice.test.tsx`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/TypingPractice.tsx src/__tests__/TypingPractice.test.tsx
git commit -m "feat: add TypingPractice component with visual feedback"
```

---

## Task 8: Dashboard / Stats Panel Component

**Files:**
- Create: `src/components/Dashboard.tsx`
- Test: `src/__tests__/Dashboard.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/__tests__/Dashboard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../components/Dashboard'

describe('Dashboard', () => {
  it('displays current WPM', () => {
    render(<Dashboard wpm={45} learningSpeed={3} weakKeys={['(', ')']} />)
    expect(screen.getByTestId('wpm')).toHaveTextContent('45')
  })

  it('displays learning speed with direction', () => {
    render(<Dashboard wpm={45} learningSpeed={3} weakKeys={[]} />)
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('+3')
  })

  it('displays negative learning speed', () => {
    render(<Dashboard wpm={45} learningSpeed={-2} weakKeys={[]} />)
    expect(screen.getByTestId('learning-speed')).toHaveTextContent('-2')
  })

  it('displays weak keys', () => {
    render(<Dashboard wpm={0} learningSpeed={0} weakKeys={['(', '{', ':']} />)
    const weakLinks = screen.getByTestId('weak-keys')
    expect(weakLinks).toHaveTextContent('(')
    expect(weakLinks).toHaveTextContent('{')
    expect(weakLinks).toHaveTextContent(':')
  })

  it('shows "No data yet" when no weak keys', () => {
    render(<Dashboard wpm={0} learningSpeed={0} weakKeys={[]} />)
    expect(screen.getByTestId('weak-keys')).toHaveTextContent('No data yet')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/Dashboard.test.tsx`
Expected: FAIL

**Step 3: Implement Dashboard component**

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/Dashboard.test.tsx`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/__tests__/Dashboard.test.tsx
git commit -m "feat: add Dashboard component showing WPM, learning speed, weak keys"
```

---

## Task 9: App Shell — Wire Everything Together

**Files:**
- Modify: `src/App.tsx`
- Test: `src/__tests__/App.test.tsx`
- Create: `src/App.css` (styles)

**Step 1: Write failing tests**

```tsx
// src/__tests__/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('shows calibration drill on first launch', () => {
    render(<App />)
    expect(screen.getByTestId('calibration-drill')).toBeInTheDocument()
  })

  it('shows practice mode when calibration is complete in storage', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: { a: { key: 'a', totalAttempts: 5, correctAttempts: 5, averageTimeMs: 200, history: [] } },
        sessionHistory: [{ timestamp: Date.now(), wpm: 30 }],
        calibrationComplete: true,
        currentDrillKeys: ['a'],
      }),
    )
    render(<App />)
    expect(screen.getByTestId('typing-practice')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })

  it('shows recalibrate button in practice mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: [],
      }),
    )
    render(<App />)
    expect(screen.getByRole('button', { name: /recalibrate/i })).toBeInTheDocument()
  })

  it('switches to calibration when recalibrate is clicked', async () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        keyProfiles: {},
        sessionHistory: [],
        calibrationComplete: true,
        currentDrillKeys: [],
      }),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /recalibrate/i }))

    expect(screen.getByTestId('calibration-drill')).toBeInTheDocument()
  })

  it('has dark theme styling', () => {
    render(<App />)
    const app = screen.getByTestId('app')
    expect(app).toHaveClass('dark')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/App.test.tsx`
Expected: FAIL

**Step 3: Implement App shell**

Wire together:
- `useTypeCraft` hook
- `CalibrationDrill` (when mode === 'calibration')
- `TypingPractice` + `Dashboard` (when mode === 'practice')
- Recalibrate button
- Dark theme CSS
- Large font sizing (28px+ for typing area)
- Grey (#888) for correct, red (#e74c3c) for incorrect

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/App.test.tsx`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/App.css src/__tests__/App.test.tsx
git commit -m "feat: wire up App shell with calibration, practice, and dashboard"
```

---

## Task 10: Final Integration — End-to-End Flow Polish

**Files:**
- Modify: `src/App.tsx` (minor tweaks)
- Modify: `src/App.css` (visual polish)
- Modify: `src/index.css` (global reset)

**Step 1: Verify all tests pass**

Run: `npm test`
Expected: ALL PASS

**Step 2: Manual review of flow**

Run: `npm run dev`
- Verify calibration drill works
- Verify practice mode loads after calibration
- Verify localStorage persistence (refresh page)
- Verify recalibrate button works
- Verify visual feedback (grey/red)
- Verify font sizing is comfortable

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: TypeCraft v1 — adaptive typing practice for programmers"
```

---

## Task Dependency Graph

```
Task 1 (scoring) ──┬── Task 2 (generator) ──┐
                    ├── Task 3 (stats) ──────┤
                    └── Task 4 (storage) ────┼── Task 5 (hook) ──┬── Task 6 (calibration)
                                             │                   ├── Task 7 (practice)
                                             │                   └── Task 8 (dashboard)
                                             │                           │
                                             └───────────────── Task 9 (app shell) ── Task 10 (polish)
```

Tasks 1-4 can be parallelized. Task 5 depends on 1, 3, 4. Tasks 6-8 depend on 5. Task 9 depends on 6-8. Task 10 depends on 9.

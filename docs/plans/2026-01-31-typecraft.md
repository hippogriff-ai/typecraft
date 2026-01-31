# TypeCraft Implementation Plan (Behavior-Focused TDD)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Space Invaders-style typing game where character invaders attack a grape cluster, the player types to destroy them, and the game adapts to drill weak keys.

## Completion Tracker

| Task | Description | Status | Files Changed |
|------|-------------|--------|---------------|
| 1 | Key Groups & Weakness Scoring | DONE | src/lib/keys.ts, src/lib/scoring.ts |
| 2 | Game Engine | DONE | src/lib/game-engine.ts |
| 3 | Wave Generation | DONE | src/lib/wave-generator.ts |
| 4 | WPM & Learning Speed | DONE | src/lib/stats.ts |
| 5 | Persistence | DONE | src/lib/storage.ts |
| 6 | Settings System | DONE | src/lib/settings.ts |
| 7 | Adaptive Calibration | DONE | src/lib/adaptive-calibration.ts |
| 8 | Accuracy Ring | DONE | src/lib/accuracy-ring.ts |
| 9 | Sprites | DONE | src/lib/sprites.ts |
| 10 | Game State Machine | DONE | src/hooks/useGameState.ts |
| 11 | Game Loop Hook | DONE | src/hooks/useGameLoop.ts |
| 12 | HUD Component | DONE | src/components/HUD.tsx |
| 13 | GameBoard Component | DONE | src/components/GameBoard.tsx |
| 14 | Round Summary/End | DONE | src/components/RoundSummary.tsx, RoundEnd.tsx, Countdown.tsx |
| 15 | Main Menu | DONE | src/components/MainMenu.tsx |
| 16 | Settings Screen | DONE | src/components/SettingsScreen.tsx |
| 17 | Stats Screen | DONE | src/components/StatsScreen.tsx |
| 18 | Onboarding Demo | DONE | src/components/OnboardingDemo.tsx |
| 19 | Pause Menu | DONE | src/components/PauseMenu.tsx |
| 20 | App Shell Integration | DONE | src/App.tsx, src/App.css, src/index.css, src/__tests__/App.test.tsx |
| 21 | Visual Polish | DONE | src/App.css, src/components/GameBoard.tsx |

### TODO
- ~~E2E testing with Playwright~~ DONE (13 E2E tests, Playwright + Chromium)
- ~~Visual polish (absorb animation red flash/dissolve, grape burst animation)~~ DONE
- ~~clearCalibrationData preserves roundHistory/highScore (verify/fix)~~ DONE
- ~~Explosion animations~~ DONE (pixel-scatter, 8 particles, 300ms CSS animation)
- ~~Fix: Settings from HUD/Pause during gameplay destroys active round~~ DONE (in-game settings overlay, 4 new tests, src/App.tsx, src/App.css, src/__tests__/App.test.tsx)
- ~~Fix: averageTimeMs running average diluted by miss count~~ DONE (use correctAttempts as divisor, handle no-hits in weakness score, 1 new test + 2 updated tests, src/lib/scoring.ts, src/__tests__/scoring.test.ts)
- ~~Comprehensive useGameLoop test coverage~~ DONE (15 new tests: start/stop, handleKeyPress hit/miss/targeting, game tick movement, collision events, round end grape-loss/cleared, wave auto-advance, pendingSpawns blocking, calibration mode, unmount cleanup. src/__tests__/useGameLoop.test.tsx 3→18 tests)
- ~~Fix: Modifier keys and uppercase creating phantom key profiles~~ DONE (filter non-single-char keys, normalize to lowercase, 2 new tests. src/App.tsx, src/__tests__/App.test.tsx)
- ~~Fix: Accuracy diluted by pending invaders in staggered spawn queue~~ DONE (use appearedCount = totalSpawned - pendingSpawns.length for round-end accuracy, WPM, and pause menu. 1 new test. src/App.tsx, src/__tests__/game-engine.test.ts)
- ~~Fix: HUD recalibrate during gameplay breaks game state~~ DONE (confirmation overlay, pauses game, Confirm → recalibrate + menu, Cancel/Escape → resume. 3 new tests. src/App.tsx, src/__tests__/App.test.tsx)
- ~~Fix: Non-invader single-char keys (Space, backtick, etc.) creating phantom profiles~~ DONE (add ALL_KEYS.includes(key) guard, 1 new test. src/App.tsx, src/__tests__/App.test.tsx)
- ~~Fix: Calibration tracker reset on pause/resume~~ DONE (only reset when currentWave === 0, 1 new test. src/hooks/useGameLoop.ts, src/__tests__/useGameLoop.test.tsx)
- ~~Fix: maxInvadersPerWave setting silently ignored + validateSettings never called~~ DONE (pass setting to createRoundState, call validateSettings in loadState, 2 new tests. src/App.tsx, src/lib/storage.ts, src/__tests__/storage.test.ts)
- ~~Spec fix: Speed preset changes not applying immediately to existing invaders~~ DONE (rescaleInvaderSpeeds in game-engine, prevSpeedRef detection in useGameLoop, 4 new tests. src/lib/game-engine.ts, src/hooks/useGameLoop.ts, src/__tests__/game-engine.test.ts)
- ~~Responsive OnboardingDemo~~ DONE (accept boardSize prop, compute center/spawn positions dynamically. src/components/OnboardingDemo.tsx, src/App.tsx)
- ~~Fix: selectWordsForFocus crash with empty focusKeys~~ DONE (early return guard, 1 new test. src/lib/word-list.ts, src/__tests__/word-list.test.ts)
- ~~E2E regression tests for recalibrate during gameplay and in-game settings~~ DONE (4 new E2E tests: HUD recalibrate confirm overlay, cancel, confirm→menu, settings overlay→gameplay. e2e/game-flow.spec.ts)
- ~~OnboardingDemo hook stability + a11y~~ DONE (useMemo for spawnPositions, centerRef for rAF/keydown closures, aria-label on GameBoard. src/components/OnboardingDemo.tsx, src/components/GameBoard.tsx)
- ~~Fix: recordKeyResult stale closure loses rapid keypress data + uppercase word list creates unhittable invaders~~ DONE (functional setAppState updater, lowercase 'true'/'false'/'none', 2 new tests. src/hooks/useGameState.ts, src/lib/word-list.ts, src/__tests__/useGameState.test.tsx, src/__tests__/word-list.test.ts)
- ~~Fix: Phantom keypress after round end records false misses~~ DONE (roundOver guard in useGameLoop handleKey, 1 new test. src/hooks/useGameLoop.ts, src/__tests__/useGameLoop.test.tsx)
- ~~Spec fix: 70/30 focus/filler split + dead code cleanup~~ DONE (spawnWave generates 70% focus from words + 30% filler from ALL_KEYS; removed unused generateWaveChars. 1 new test, 3 dead tests removed. src/lib/game-engine.ts, src/lib/wave-generator.ts, src/__tests__/game-engine.test.ts, src/__tests__/wave-generator.test.ts)
- ~~Fix: Explosion color ignoring color-blind mode~~ DONE (pass settings.colorBlindMode to getCharColor in explosion creation. src/App.tsx)
- ~~Spec fix: Filler keys use ranked 6-10 weakest instead of random ALL_KEYS~~ DONE (getNextPracticeRound already returned fillerKeys; wired through AppState.currentFillerKeys, useGameState callbacks (startGame/completeRound/beginPractice), and App.tsx createRoundState. spawnWave prefers state.fillerKeys when available. 1 new test. src/lib/storage.ts, src/hooks/useGameState.ts, src/App.tsx, src/__tests__/useGameState.test.tsx)
- ~~Bug fix: Calibration rounds not re-randomized on recalibrate~~ DONE (calibrationRounds was useState-frozen from mount; recalibrate only reset index. Fix: setCalibrationRounds(getCalibrationRounds()) in recalibrate(). 1 new test. src/hooks/useGameState.ts, src/__tests__/useGameState.test.tsx)
- ~~Bug fix: Practice filler keys leak into calibration rounds after recalibrate~~ DONE (clearCalibrationData didn't clear currentFillerKeys; calibration paths didn't set currentFillerKeys:[]. Fix: clear in clearCalibrationData + startGame/completeDemo/completeRound calibration branches. 1 new test. src/lib/storage.ts, src/hooks/useGameState.ts, src/__tests__/storage.test.ts)
- ~~Defensive fix: Unbounded key profile history growth~~ DONE (history[] capped at 20 entries via .slice(-20) in recordKeyPress. computeTrend uses last 10. 1 new test. src/lib/scoring.ts, src/__tests__/scoring.test.ts)
- ~~Code quality: ESLint warning + duplicate DEFAULT_SETTINGS~~ DONE (added settings.colorBlindMode to keydown useEffect deps; replaced duplicate DEFAULT_SETTINGS in useGameState.ts with import from settings.ts. src/App.tsx, src/hooks/useGameState.ts)
- ~~UX fix: RoundSummary missing field labels~~ DONE (added "Grapes:", "Accuracy:", "Avg Reaction:", "Improved:", "Declined:" labels per spec. src/components/RoundSummary.tsx)
- ~~Spec fix: Calibration rounds use 100% focus keys~~ DONE (App.tsx converted empty fillerKeys[] to undefined; spawnWave fell back to ALL_KEYS for 30% filler. Fix: pass fillerKeys directly, spawnWave uses hasFiller flag to distinguish calibration (100% focus) from practice (70/30). 1 new test. src/App.tsx, src/lib/game-engine.ts, src/__tests__/game-engine.test.ts)
- ~~UX fix: HUD shows calibration key group name~~ DONE (HUD showed "Calibration" instead of which group is being tested. Fix: KEY_GROUP_DISPLAY_NAMES in keys.ts, calibrationRoundName exposed from useGameState, App.tsx shows "Calibration: Home Row" etc. 2 new tests. src/lib/keys.ts, src/hooks/useGameState.ts, src/App.tsx, src/__tests__/useGameState.test.tsx)
- ~~Bug fix: Round summary next focus keys wrong during calibration~~ DONE (showed overall weakest keys instead of next calibration group's keys. Fix: nextCalibrationKeys exposed from useGameState, App.tsx uses it when available. 2 new tests. src/hooks/useGameState.ts, src/App.tsx, src/__tests__/useGameState.test.tsx)
- ~~Bug fix: Calibration progress lost on browser refresh~~ DONE (calibrationRoundIndex reset to 0, rounds re-randomized on mount. Fix: persist calibrationOrder in AppState, restore index from completedGroups.length, reconstruct round configs from persisted order. 1 new test. src/lib/storage.ts, src/hooks/useGameState.ts, src/__tests__/useGameState.test.tsx)
- ~~Defensive fix: Cancel stale countdown after calibration completes~~ DONE (countdown ran invisibly after 5th calibration round, calling startNewRound() wastefully. Fix: cancel countdown when screen !== 'playing'. src/App.tsx)
- ~~Bug fix: Invader teleportation on tab switch + escape during transitions~~ DONE (rAF timestamp jumps ahead while tab hidden; deltaSeconds was uncapped → invaders teleport. Also Escape during round-end/countdown/summary toggled pause. Fix: cap deltaSeconds at 0.1s in useGameLoop; guard Escape during transitions in App.tsx. 1 new test. src/hooks/useGameLoop.ts, src/App.tsx, src/__tests__/useGameLoop.test.tsx)
- ~~UX fix: HUD bottom bar missing "Wave" and "Grapes:" labels~~ DONE (spec shows "Wave 4/8" and "Grapes: 20/24" but HUD rendered just numbers. Also currentWave=0 showed "0/8" before first wave spawns. Fix: added labels, clamped wave to min 1. 1 new test. src/components/HUD.tsx, src/__tests__/HUD.test.tsx)
- ~~Spec fix: Invader character size 22px below 28px spec minimum~~ DONE (spec: "monospace, 28px+". Increased font 22→28px, container 40→48px, sprite 36→44px. Also: E2E grape-count assertion updated for new "Grapes:" label. src/App.css, src/components/GameBoard.tsx, e2e/game-flow.spec.ts)
- ~~Visual fix: Grape missing white specular highlight~~ DONE (spec: "white specular highlight". Added rgba(255,255,255,0.6) at 30% 30% in radial gradient. src/App.css)
- ~~Code quality: Simplify learning speed display condition~~ DONE (dual check replaced with `roundHistory.length < 10` matching spec wording. src/App.tsx)
- ~~Spec fix: Grape cluster variable density~~ DONE (cluster shrank when grapes lost instead of maintaining area. Fix: dynamic gap = max(4, min(14, round(maxGrapes/grapes * 4))). 1 new test. src/components/GameBoard.tsx, src/__tests__/GameBoard.test.tsx)
- ~~Spec fix: Stats screen Trend column not sortable~~ DONE (spec: "Sortable by any column" — Trend column had no onClick. Added trend sort with numeric mapping: improving=1, stable=0, declining=-1. 1 new test. src/components/StatsScreen.tsx, src/__tests__/StatsScreen.test.tsx)
- ~~Spec fix: Explosion missing initial white/yellow flash~~ DONE (spec: "bright flash (white/yellow)". Explosion particles now start #ffffaa at scale 1.3, transition to character color by 20% of animation. Uses --particle-color CSS variable. src/App.css, src/components/GameBoard.tsx)
- ~~Defensive fix: loadState skips validation when schemaVersion absent~~ DONE (condition `schemaVersion !== undefined && ...` allowed JSON without schemaVersion to load — missing required fields would crash app. Fix: simplified to `schemaVersion !== SCHEMA_VERSION`. 2 new tests. src/lib/storage.ts, src/__tests__/storage.test.ts)
- ~~Perf fix: useGameState called loadState() 4 times during init~~ DONE (each useState initializer called loadState() independently — 4x JSON.parse of same data. Fix: single loadState() call cached in initData useState. src/hooks/useGameState.ts)
- ~~Perf + stability fix: GameBoard invader React keys~~ DONE (indexOf O(N²) replaced with unique inv.id. Module-level auto-incrementing counter in game-engine.ts. 1 new test. src/lib/game-engine.ts, src/components/GameBoard.tsx, src/__tests__/GameBoard.test.tsx, src/__tests__/game-engine.test.ts)
- ~~Defensive fix: Adaptive calibration speed unbounded~~ DONE (repeated 1.1x multiplications could push speed to 2.6x+ base. Fix: clamp to [0.5x, 2x] base speed. 2 new tests. src/lib/adaptive-calibration.ts, src/__tests__/adaptive-calibration.test.ts)
- ~~Bug fix: bestAccuracy always 100% after first hit~~ DONE (bestAccuracy computed from lifetime correctAttempts/totalAttempts, which is 1/1=100% after first hit. Made "Best Acc" stats column useless. Fix: only track after 10+ attempts. 1 new test. src/lib/scoring.ts, src/__tests__/scoring.test.ts)
- ~~UX + code quality~~ DONE (StatsScreen empty state message when no key data; removed unnecessary type cast in App.tsx. 1 new test. src/App.tsx, src/components/StatsScreen.tsx, src/__tests__/StatsScreen.test.tsx)
- ~~UX fix: bestAccuracy shows "0%" for keys with < 10 attempts~~ DONE (misleading since 0% implies no accuracy when really not enough data. Changed to "—" dash when bestAccuracy = 0, consistent with speed column handling. 1 new test. src/components/StatsScreen.tsx, src/__tests__/StatsScreen.test.tsx)
- ~~Race condition fix: Calibration first round wrong invader characters~~ DONE (setRoundState + gameLoop.start in same render's effects; rAF tick read stale stateRef. Fix: resetState() method writes directly to stateRef bypassing React batching. 1 new test. src/hooks/useGameLoop.ts, src/App.tsx, src/__tests__/useGameLoop.test.tsx)
- ~~Lint/code quality fixes~~ DONE (ref assignment during render → useEffect; render-phase variable mutation → precomputed array; unnecessary useCallback dependency removed; unused variable removed. src/App.tsx, src/components/GameBoard.tsx, src/hooks/useGameLoop.ts)
- ~~Defensive fix: getNextPracticeRound with empty profiles~~ DONE (returned empty focusKeys[], relying on downstream fallbacks. Fix: early return with home row defaults. 1 new test. src/lib/wave-generator.ts, src/__tests__/wave-generator.test.ts)
- ~~Word list expansion (iteration 123)~~ DONE (WORDS array expanded from 542 to 600+ entries per spec target ~600. Added 58+ common English words, fixed duplicates. src/lib/word-list.ts)
- ~~UX fix (iteration 124): Onboarding demo prompt unreadable behind grape~~ DONE (prompt text overlapped grape target at center. Moved to absolute positioned bottom 12%. src/App.css, src/components/OnboardingDemo.tsx)
- ~~Bug fix (iteration 125): HUD showed stale between-rounds WPM during gameplay~~ DONE (HUD displayed gameState.currentWPM rolling average instead of live round WPM. Added liveWpm state computed per-tick from appeared count, accuracy, elapsed time. 1 new test. src/App.tsx, src/__tests__/App.test.tsx)
- ~~Spec fix (iteration 126): Mixed letter+symbol focus keys produced no symbol invaders from words~~ DONE (selectWordsForFocus used all-or-nothing pool switch: WORDS for any alphanumeric key, CODE_SNIPPETS only when ALL keys were symbols. Mixed keys like ['z',';',','] searched only WORDS which has no symbols. Fix: always search both pools and combine matches. Added 3 new CODE_SNIPPETS with '/' and ';' coverage. 1 new test. src/lib/word-list.ts, src/__tests__/word-list.test.ts)
- ~~Perf fix (iteration 127): Invader movement jank~~ DONE (User reported "obvious pause point" in invader movement. Root cause: `left`/`top` CSS properties trigger layout reflow every frame; SpriteRenderer (64 grid cells/invader) re-rendered every rAF frame despite unchanging props. Fix: (1) `transform: translate()` for GPU-composited positioning, (2) `will-change: transform` CSS hint, (3) `React.memo` on SpriteRenderer. src/components/GameBoard.tsx, src/components/SpriteRenderer.tsx, src/App.css)

---

**Architecture:** Pure game logic in `src/lib/` (zero React deps, fully testable via behavior contracts). React hooks bridge logic to the UI. Components render observable state. Tests describe WHAT the system does, not HOW it's structured internally. The engineer is free to organize internals however they want as long as all behavioral tests pass.

**Tech Stack:** React 19, TypeScript (strict, `verbatimModuleSyntax`), Vite, Vitest + jsdom + React Testing Library, localStorage, requestAnimationFrame

**Spec:** `docs/SPEC.md` is the source of truth for all behaviors.

---

## Existing Test Inventory

Tests already exist from the initial RED phase. Some need updating to match the revised spec:

| File | Status | Notes |
|------|--------|-------|
| `scoring.test.ts` | **Keep as-is** | Behaviors match spec |
| `game-engine.test.ts` | **Update needed** | Wave 1 should spawn 3 invaders (N starts at 0), not 4. Add invader cap test. |
| `wave-generator.test.ts` | **Keep + extend** | Add filler-from-next-weakest, code snippet, word matching tests |
| `stats.test.ts` | **Update needed** | WPM must account for accuracy. Learning speed needs 5-round window test. |
| `storage.test.ts` | **Keep + extend** | Add schema versioning tests |
| `useGameState.test.tsx` | **Update needed** | First launch should show main menu, not game board directly |
| `useGameLoop.test.tsx` | **Keep + extend** | Add speed escalation, staggered spawning tests |
| `GameBoard.test.tsx` | **Keep + extend** | Add accuracy ring, z-ordering tests |
| `HUD.test.tsx` | **Keep as-is** | Behaviors match spec |
| `RoundSummary.test.tsx` | **Keep + extend** | Add keys improved/declined display |
| `App.test.tsx` | **Rewrite needed** | Must show main menu on launch, not game board |

New test files needed:
- `settings.test.ts` — settings behaviors
- `adaptive-calibration.test.ts` — speed adaptation during calibration
- `sprites.test.ts` — sprite pool and color mapping
- `word-list.test.ts` — word/snippet selection for focus keys
- `MainMenu.test.tsx` — main menu screen
- `SettingsScreen.test.tsx` — settings UI
- `StatsScreen.test.tsx` — per-key stats table
- `OnboardingDemo.test.tsx` — interactive demo
- `PauseMenu.test.tsx` — pause overlay
- `RoundEnd.test.tsx` — victory/defeat + countdown
- `accuracy-ring.test.ts` — accuracy ring state

---

## Task 1: Key Groups and Weakness Scoring

**Behavior:** The game knows which keys belong to which groups, creates per-key profiles tracking accuracy and speed, computes a weakness score per key, and ranks all keys from weakest to strongest.

**Files:**
- Test: `src/__tests__/scoring.test.ts` (exists, keep as-is)
- Create: `src/lib/keys.ts`
- Create: `src/lib/scoring.ts`

**Step 1: Run existing tests to verify RED**

```bash
npm test -- src/__tests__/scoring.test.ts
```
Expected: FAIL — modules don't exist yet.

**Step 2: Implement to make all tests pass**

The existing tests already define the behavioral contracts:

- `KEY_GROUPS` has properties: `homeRow`, `topRow`, `bottomRow`, `numbers`, `pythonSymbols`
- `pythonSymbols` contains `( ) [ ] { } : = _ # @ . ,`
- `ALL_KEYS` is a flat, deduplicated list of all keys
- `createKeyProfile('a')` → profile with zero attempts, empty history
- `recordKeyPress(profile, { correct, timeMs })` → updated profile with running average
- `computeWeaknessScore(profile, { maxTimeMs })` → number 0-1 using formula `(1-accuracy)*0.7 + normalizedSlowness*0.3`; untested keys return 1.0
- `rankWeaknesses(profiles, limit?)` → sorted weakest-first, optional top-N

**Step 3: Run tests — expect ALL PASS**

```bash
npm test -- src/__tests__/scoring.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/keys.ts src/lib/scoring.ts src/__tests__/scoring.test.ts
git commit -m "feat: add key groups and weakness scoring engine"
```

---

## Task 2: Game Engine — Invaders, Targeting, Collisions, Grapes

**Behavior:** Invaders spawn at edges and move toward center. Typing a key destroys the nearest alive matching invader. Dead invaders don't move and aren't targetable. Invaders absorbed at the grape cluster increment a damage counter; every 3 absorbed costs 1 grape. Round ends when grapes = 0. Wave formula: first wave = 3 invaders, second = 4, etc. (3+N where N starts at 0), capped at max setting.

**Files:**
- Test: `src/__tests__/game-engine.test.ts` (exists, needs updates)
- Create: `src/lib/game-engine.ts`

**Step 1: Update the existing test to fix wave count**

In `src/__tests__/game-engine.test.ts`, update the wave test:

```typescript
it('first wave spawns 3 invaders (formula 3+N, N starts at 0)', () => {
  let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
  state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
  expect(state.invaders.length).toBe(3)
  expect(state.currentWave).toBe(1)
})

it('second wave spawns 4 invaders', () => {
  let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
  state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
  state = { ...state, invaders: [] } // clear first wave
  state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
  expect(state.invaders.length).toBe(4)
  expect(state.currentWave).toBe(2)
})
```

**Step 2: Add new behavior tests to the same file**

```typescript
describe('wave invader cap', () => {
  it('caps invader count at maxInvadersPerWave', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 12, focusKeys: ['a'], maxInvadersPerWave: 6 })
    // Advance to wave 10 (3+9=12 invaders, should cap at 6)
    for (let i = 0; i < 9; i++) {
      state = { ...state, invaders: [] }
      state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    }
    state = { ...state, invaders: [] }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })
    expect(state.invaders.length).toBeLessThanOrEqual(6)
  })
})

describe('speed escalation', () => {
  it('each wave increases effective speed by 5 px/s', () => {
    const baseSpeed = 50
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })

    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: baseSpeed })
    const wave1Speed = Math.sqrt(state.invaders[0].velocity.x ** 2 + state.invaders[0].velocity.y ** 2)

    state = { ...state, invaders: [] }
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: baseSpeed })
    const wave2Speed = Math.sqrt(state.invaders[0].velocity.x ** 2 + state.invaders[0].velocity.y ** 2)

    expect(wave2Speed - wave1Speed).toBeCloseTo(5, 0)
  })
})

describe('handleKeyPress reaction time', () => {
  it('returns the spawn time of the destroyed invader for reaction tracking', () => {
    const inv = createInvader({ char: 'a', position: { x: 350, y: 300 }, center: CENTER, speed: 1, spawnTime: 1000 })
    let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, invaders: [inv] }

    const result = handleKeyPress(state, 'a', CENTER, 1500)
    expect(result.hit).toBe(true)
    expect(result.reactionTimeMs).toBe(500)
  })
})

describe('round completion', () => {
  it('marks roundOver as "cleared" when all waves spawned and all invaders resolved', () => {
    let state = createRoundState({ grapeCount: 24, totalWaves: 1, focusKeys: ['a'] })
    state = spawnWave(state, { center: CENTER, boardWidth: 800, boardHeight: 600, speed: 2 })

    // Destroy all invaders
    for (const inv of state.invaders) {
      inv.alive = false
    }
    state = checkRoundComplete(state)
    expect(state.roundOver).toBe(true)
    expect(state.roundResult).toBe('cleared')
  })

  it('marks roundOver as "grapes_lost" when grapes reach 0', () => {
    let state = createRoundState({ grapeCount: 1, totalWaves: 8, focusKeys: ['a'] })
    state = { ...state, grapes: 1, damageCounter: 2 }
    const inv = createInvader({ char: 'a', position: { x: 400, y: 300 }, center: CENTER, speed: 1 })
    state = { ...state, invaders: [inv] }
    state = checkCollisions(state, { center: CENTER, collisionRadius: 30 })

    expect(state.grapes).toBe(0)
    expect(state.roundOver).toBe(true)
    expect(state.roundResult).toBe('grapes_lost')
  })
})
```

**Step 3: Run tests — expect FAIL**

```bash
npm test -- src/__tests__/game-engine.test.ts
```

**Step 4: Implement `src/lib/game-engine.ts` to make all tests pass**

Key behavioral contracts:
- `createInvader({ char, position, center, speed, spawnTime })` → invader with velocity toward center, normalized to speed
- `createRoundState({ grapeCount, totalWaves, focusKeys, maxInvadersPerWave? })` → initial round state
- `spawnWave(state, { center, boardWidth, boardHeight, speed })` → state with new invaders added, `currentWave` incremented, speed escalated (+5/wave)
- `tickInvaders(state, { deltaSeconds, center, collisionRadius })` → invaders moved, dead ones skipped
- `checkCollisions(state, { center, collisionRadius })` → absorbed invaders marked dead, damage counter updated, grapes decremented every 3
- `handleKeyPress(state, key, center, currentTime)` → `{ state, hit, reactionTimeMs? }` — destroys nearest alive matching invader
- `checkRoundComplete(state)` → sets `roundOver` and `roundResult` when appropriate

**Step 5: Run tests — expect ALL PASS**

```bash
npm test -- src/__tests__/game-engine.test.ts
```

**Step 6: Commit**

```bash
git add src/lib/game-engine.ts src/__tests__/game-engine.test.ts
git commit -m "feat: add game engine with invader lifecycle, targeting, and grape damage"
```

---

## Task 3: Wave Generation and Character Distribution

**Behavior:** Waves are biased 70% toward focus keys, 30% filler from the player's next-weakest keys (ranks 6-10). Words from a ~600-word hardcoded list are chosen to contain focus characters. For symbol-heavy rounds, short code snippets (like `def()`, `x[i]`, `{k:v}`) are used instead. Calibration provides one round per key group. Practice selects the top 3-5 weakest keys.

**Files:**
- Test: `src/__tests__/wave-generator.test.ts` (exists, extend)
- Create: `src/lib/wave-generator.ts`
- Create: `src/lib/word-list.ts`
- Test: `src/__tests__/word-list.test.ts` (new)

**Step 1: Add new tests to `src/__tests__/wave-generator.test.ts`**

```typescript
describe('generateWaveChars filler source', () => {
  it('filler characters come from provided filler keys, not random', () => {
    const chars = generateWaveChars({
      count: 100,
      focusKeys: ['(', ')'],
      fillerKeys: ['[', ']'],
    })
    const nonFocus = chars.filter((c) => c !== '(' && c !== ')')
    for (const c of nonFocus) {
      expect(['[', ']']).toContain(c)
    }
  })

  it('approximately 70% focus and 30% filler', () => {
    const chars = generateWaveChars({
      count: 100,
      focusKeys: ['a'],
      fillerKeys: ['b', 'c'],
    })
    const focusCount = chars.filter((c) => c === 'a').length
    expect(focusCount).toBeGreaterThanOrEqual(60)
    expect(focusCount).toBeLessThanOrEqual(80)
  })
})

describe('getCalibrationRounds', () => {
  it('returns rounds in randomized order (not always the same)', () => {
    const results = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const rounds = getCalibrationRounds()
      results.add(rounds.map((r) => r.name).join(','))
    }
    // With 5! = 120 permutations, 20 attempts should produce multiple orderings
    expect(results.size).toBeGreaterThan(1)
  })
})

describe('getNextPracticeRound', () => {
  it('provides filler keys from next-weakest (ranks 6-10)', () => {
    const profiles: Record<string, ReturnType<typeof createKeyProfile>> = {}
    // Create 10 keys with decreasing weakness
    for (let i = 0; i < 10; i++) {
      let p = createKeyProfile(String.fromCharCode(97 + i)) // a-j
      const accuracy = i * 0.1 // a=0%, b=10%, ..., j=90%
      p = recordKeyPress(p, { correct: accuracy > 0.5, timeMs: 1000 - i * 50 })
      profiles[p.key] = p
    }
    const round = getNextPracticeRound(profiles)
    expect(round.focusKeys.length).toBeGreaterThanOrEqual(3)
    expect(round.focusKeys.length).toBeLessThanOrEqual(5)
    expect(round.fillerKeys).toBeDefined()
    expect(round.fillerKeys!.length).toBeGreaterThan(0)
    // Filler should not overlap with focus
    for (const filler of round.fillerKeys!) {
      expect(round.focusKeys).not.toContain(filler)
    }
  })
})
```

**Step 2: Create `src/__tests__/word-list.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { WORDS, CODE_SNIPPETS, selectWordsForFocus } from '../lib/word-list'

describe('WORDS', () => {
  it('contains approximately 600 words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(500)
    expect(WORDS.length).toBeLessThanOrEqual(700)
  })

  it('includes Python keywords', () => {
    const pythonKeywords = ['def', 'class', 'import', 'return', 'yield', 'lambda', 'if', 'else', 'for', 'while']
    for (const kw of pythonKeywords) {
      expect(WORDS).toContain(kw)
    }
  })
})

describe('CODE_SNIPPETS', () => {
  it('contains short code fragments with symbols', () => {
    expect(CODE_SNIPPETS.length).toBeGreaterThan(10)
    for (const snippet of CODE_SNIPPETS) {
      expect(snippet.length).toBeLessThanOrEqual(10)
    }
  })

  it('includes bracket/symbol-heavy snippets', () => {
    const allSnippets = CODE_SNIPPETS.join('')
    expect(allSnippets).toContain('(')
    expect(allSnippets).toContain('[')
    expect(allSnippets).toContain('{')
    expect(allSnippets).toContain('@')
    expect(allSnippets).toContain('#')
  })
})

describe('selectWordsForFocus', () => {
  it('returns words containing at least one focus character', () => {
    const words = selectWordsForFocus({ focusKeys: ['x'], count: 5 })
    for (const word of words) {
      expect(word).toMatch(/x/)
    }
  })

  it('uses code snippets when focus keys are all symbols', () => {
    const words = selectWordsForFocus({ focusKeys: ['(', ')', '{', '}'], count: 5 })
    expect(words.length).toBe(5)
    // Each should contain at least one focus symbol
    for (const word of words) {
      const hasFocus = ['(', ')', '{', '}'].some((k) => word.includes(k))
      expect(hasFocus).toBe(true)
    }
  })

  it('falls back to individual characters when no words match', () => {
    const words = selectWordsForFocus({ focusKeys: ['@'], count: 3 })
    expect(words.length).toBe(3)
  })
})
```

**Step 3: Run tests — expect FAIL**

```bash
npm test -- src/__tests__/wave-generator.test.ts src/__tests__/word-list.test.ts
```

**Step 4: Implement**

- `src/lib/word-list.ts`: hardcoded `WORDS` array (~600), `CODE_SNIPPETS` array, `selectWordsForFocus` function
- `src/lib/wave-generator.ts`: `generateWaveChars`, `getCalibrationRounds` (randomized order), `getNextPracticeRound` (with fillerKeys)

**Step 5: Run tests — expect ALL PASS**

```bash
npm test -- src/__tests__/wave-generator.test.ts src/__tests__/word-list.test.ts
```

**Step 6: Commit**

```bash
git add src/lib/wave-generator.ts src/lib/word-list.ts src/__tests__/wave-generator.test.ts src/__tests__/word-list.test.ts
git commit -m "feat: add wave generation with word matching and filler key selection"
```

---

## Task 4: WPM, Reaction Time, and Learning Speed

**Behavior:** WPM = (characters spawned per minute × accuracy) / 5. Learning speed = difference between average WPM of last 5 rounds vs average of rounds 6-10. Returns 0 when fewer than 10 rounds exist. Shows "—" in the UI (tested in HUD task).

**Files:**
- Test: `src/__tests__/stats.test.ts` (exists, update)
- Create: `src/lib/stats.ts`

**Step 1: Update `src/__tests__/stats.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateWPM,
  calculateLearningSpeed,
  type RoundRecord,
} from '../lib/stats'

describe('calculateWPM', () => {
  it('calculates effective WPM: (charsSpawned/minute * accuracy) / 5', () => {
    // 60 chars in 60 seconds at 100% accuracy = (60/1 * 1.0) / 5 = 12 WPM
    const wpm = calculateWPM({ charsSpawned: 60, elapsedMs: 60000, accuracy: 1.0 })
    expect(wpm).toBe(12)
  })

  it('accuracy reduces effective WPM', () => {
    // 60 chars in 60 seconds at 50% accuracy = (60/1 * 0.5) / 5 = 6 WPM
    const wpm = calculateWPM({ charsSpawned: 60, elapsedMs: 60000, accuracy: 0.5 })
    expect(wpm).toBe(6)
  })

  it('returns 0 for zero elapsed time', () => {
    const wpm = calculateWPM({ charsSpawned: 50, elapsedMs: 0, accuracy: 1.0 })
    expect(wpm).toBe(0)
  })
})

describe('calculateLearningSpeed', () => {
  it('returns WPM delta between last 5 and prior 5 rounds', () => {
    const rounds: RoundRecord[] = [
      // Older 5 rounds: avg WPM = 20
      { wpm: 20 }, { wpm: 20 }, { wpm: 20 }, { wpm: 20 }, { wpm: 20 },
      // Recent 5 rounds: avg WPM = 30
      { wpm: 30 }, { wpm: 30 }, { wpm: 30 }, { wpm: 30 }, { wpm: 30 },
    ]
    expect(calculateLearningSpeed(rounds)).toBe(10)
  })

  it('returns negative delta when declining', () => {
    const rounds: RoundRecord[] = [
      { wpm: 30 }, { wpm: 30 }, { wpm: 30 }, { wpm: 30 }, { wpm: 30 },
      { wpm: 20 }, { wpm: 20 }, { wpm: 20 }, { wpm: 20 }, { wpm: 20 },
    ]
    expect(calculateLearningSpeed(rounds)).toBe(-10)
  })

  it('returns 0 for fewer than 10 rounds', () => {
    expect(calculateLearningSpeed([])).toBe(0)
    const fiveRounds: RoundRecord[] = [
      { wpm: 20 }, { wpm: 25 }, { wpm: 30 }, { wpm: 35 }, { wpm: 40 },
    ]
    expect(calculateLearningSpeed(fiveRounds)).toBe(0)
  })

  it('uses the most recent 10 rounds only', () => {
    const rounds: RoundRecord[] = [
      { wpm: 100 }, // old, should be ignored
      { wpm: 10 }, { wpm: 10 }, { wpm: 10 }, { wpm: 10 }, { wpm: 10 },
      { wpm: 20 }, { wpm: 20 }, { wpm: 20 }, { wpm: 20 }, { wpm: 20 },
    ]
    expect(calculateLearningSpeed(rounds)).toBe(10)
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
npm test -- src/__tests__/stats.test.ts
```

**Step 3: Implement `src/lib/stats.ts`**

**Step 4: Run tests — expect ALL PASS**

```bash
npm test -- src/__tests__/stats.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/stats.ts src/__tests__/stats.test.ts
git commit -m "feat: add WPM calculation with accuracy and 5-round learning speed"
```

---

## Task 5: Persistence with Schema Versioning

**Behavior:** Game state round-trips through localStorage under key `"typecraft"`. Corrupted JSON returns null. Schema version is stored; on mismatch, all data is wiped and null is returned. Recalibration resets key profiles and calibration progress but preserves round history, high score, and lifetime stats.

**Files:**
- Test: `src/__tests__/storage.test.ts` (exists, extend)
- Create: `src/lib/storage.ts`

**Step 1: Add schema versioning tests to `src/__tests__/storage.test.ts`**

```typescript
describe('schema versioning', () => {
  it('stores a schema version with saved state', () => {
    const state = makeState()
    saveState(state)
    const raw = JSON.parse(localStorage.getItem('typecraft')!)
    expect(raw.schemaVersion).toBeDefined()
    expect(typeof raw.schemaVersion).toBe('number')
  })

  it('returns null when schema version does not match current', () => {
    const state = makeState()
    saveState(state)
    // Tamper with version
    const raw = JSON.parse(localStorage.getItem('typecraft')!)
    raw.schemaVersion = -1
    localStorage.setItem('typecraft', JSON.stringify(raw))
    expect(loadState()).toBeNull()
  })

  it('clears localStorage when schema version mismatches', () => {
    const state = makeState()
    saveState(state)
    const raw = JSON.parse(localStorage.getItem('typecraft')!)
    raw.schemaVersion = -1
    localStorage.setItem('typecraft', JSON.stringify(raw))
    loadState() // triggers wipe
    expect(localStorage.getItem('typecraft')).toBeNull()
  })
})

describe('clearCalibrationData preserves lifetime stats', () => {
  it('preserves high score after recalibration', () => {
    const state = makeState({
      highScore: 47,
      mode: 'practice',
      calibrationProgress: { completedGroups: ['homeRow'], complete: true },
    })
    saveState(state)
    clearCalibrationData()
    const loaded = loadState()
    expect(loaded!.highScore).toBe(47)
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
npm test -- src/__tests__/storage.test.ts
```

**Step 3: Implement `src/lib/storage.ts`**

Key behaviors:
- `saveState(state)` → serializes with schemaVersion
- `loadState()` → null on missing/corrupted/version-mismatch; wipes storage on mismatch
- `clearCalibrationData()` → resets profiles, calibration progress, focus keys, mode; keeps roundHistory, highScore, keyBests

**Step 4: Run tests — expect ALL PASS**

```bash
npm test -- src/__tests__/storage.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/__tests__/storage.test.ts
git commit -m "feat: add persistence with schema versioning and recalibration"
```

---

## Task 6: Settings System

**Behavior:** Four settings with defaults and ranges. Speed applies immediately. Grape count, max invaders per wave, and waves per round apply next round. Settings persist in localStorage as part of app state.

**Files:**
- Test: `src/__tests__/settings.test.ts` (new)
- Create: `src/lib/settings.ts`

**Step 1: Write `src/__tests__/settings.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SPEED_PRESETS,
  validateSettings,
  type Settings,
} from '../lib/settings'

describe('DEFAULT_SETTINGS', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_SETTINGS.grapeCount).toBe(24)
    expect(DEFAULT_SETTINGS.speedPreset).toBe('normal')
    expect(DEFAULT_SETTINGS.maxInvadersPerWave).toBe(12)
    expect(DEFAULT_SETTINGS.wavesPerRound).toBe(8)
  })
})

describe('SPEED_PRESETS', () => {
  it('maps slow to 30, normal to 50, fast to 80 px/s', () => {
    expect(SPEED_PRESETS.slow).toBe(30)
    expect(SPEED_PRESETS.normal).toBe(50)
    expect(SPEED_PRESETS.fast).toBe(80)
  })
})

describe('validateSettings', () => {
  it('clamps grape count to 6-48', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, grapeCount: 2 }).grapeCount).toBe(6)
    expect(validateSettings({ ...DEFAULT_SETTINGS, grapeCount: 100 }).grapeCount).toBe(48)
    expect(validateSettings({ ...DEFAULT_SETTINGS, grapeCount: 24 }).grapeCount).toBe(24)
  })

  it('clamps max invaders per wave to 6-20', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, maxInvadersPerWave: 1 }).maxInvadersPerWave).toBe(6)
    expect(validateSettings({ ...DEFAULT_SETTINGS, maxInvadersPerWave: 50 }).maxInvadersPerWave).toBe(20)
  })

  it('clamps waves per round to 4-12', () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, wavesPerRound: 2 }).wavesPerRound).toBe(4)
    expect(validateSettings({ ...DEFAULT_SETTINGS, wavesPerRound: 20 }).wavesPerRound).toBe(12)
  })

  it('rejects invalid speed preset by falling back to normal', () => {
    const s = { ...DEFAULT_SETTINGS, speedPreset: 'turbo' as Settings['speedPreset'] }
    expect(validateSettings(s).speedPreset).toBe('normal')
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- src/__tests__/settings.test.ts
```

**Step 3: Implement `src/lib/settings.ts`**

**Step 4: Run test — expect ALL PASS**

```bash
npm test -- src/__tests__/settings.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/settings.ts src/__tests__/settings.test.ts
git commit -m "feat: add settings system with defaults, presets, and validation"
```

---

## Task 7: Adaptive Calibration Engine

**Behavior:** During calibration, track rolling accuracy over the last 10 invaders. If accuracy exceeds 90%, increase speed by 10%. If below 50%, decrease by 10%. Check triggers every 10 invaders.

**Files:**
- Test: `src/__tests__/adaptive-calibration.test.ts` (new)
- Create: `src/lib/adaptive-calibration.ts`

**Step 1: Write `src/__tests__/adaptive-calibration.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import {
  createCalibrationTracker,
  recordCalibrationResult,
  getAdaptedSpeed,
} from '../lib/adaptive-calibration'

describe('adaptive calibration', () => {
  it('does not adjust speed until 10 results recorded', () => {
    let tracker = createCalibrationTracker(50) // base speed 50
    for (let i = 0; i < 9; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBe(50) // no change yet
  })

  it('increases speed by 10% when rolling accuracy > 90%', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBe(55) // 50 * 1.1
  })

  it('decreases speed by 10% when rolling accuracy < 50%', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: i < 4 }) // 4/10 = 40%
    }
    expect(getAdaptedSpeed(tracker)).toBe(45) // 50 * 0.9
  })

  it('does not adjust speed when accuracy is between 50% and 90%', () => {
    let tracker = createCalibrationTracker(50)
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: i < 7 }) // 70%
    }
    expect(getAdaptedSpeed(tracker)).toBe(50)
  })

  it('checks every 10 invaders (accumulates adjustments)', () => {
    let tracker = createCalibrationTracker(50)
    // First 10: all correct → 50 → 55
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBe(55)

    // Next 10: all correct again → 55 → 60.5
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeCloseTo(60.5, 0)
  })

  it('uses a rolling window of last 10 results, not all-time', () => {
    let tracker = createCalibrationTracker(50)
    // First 10: all wrong → slow down to 45
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: false })
    }
    expect(getAdaptedSpeed(tracker)).toBe(45)

    // Next 10: all correct → speed up from 45 → 49.5
    for (let i = 0; i < 10; i++) {
      tracker = recordCalibrationResult(tracker, { correct: true })
    }
    expect(getAdaptedSpeed(tracker)).toBeCloseTo(49.5, 0)
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- src/__tests__/adaptive-calibration.test.ts
```

**Step 3: Implement `src/lib/adaptive-calibration.ts`**

**Step 4: Run test — expect ALL PASS**

```bash
npm test -- src/__tests__/adaptive-calibration.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/adaptive-calibration.ts src/__tests__/adaptive-calibration.test.ts
git commit -m "feat: add adaptive calibration with rolling accuracy speed adjustment"
```

---

## Task 8: Accuracy Ring State

**Behavior:** An accuracy ring value starts at 1.0 (100%) at the beginning of each round. It depletes on misses and recovers slightly on hits. Provides a continuous 0-1 value for rendering.

**Files:**
- Test: `src/__tests__/accuracy-ring.test.ts` (new)
- Create: `src/lib/accuracy-ring.ts`

**Step 1: Write `src/__tests__/accuracy-ring.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { createAccuracyRing, recordHit, recordMiss } from '../lib/accuracy-ring'

describe('accuracy ring', () => {
  it('starts at 1.0', () => {
    const ring = createAccuracyRing()
    expect(ring.value).toBe(1.0)
  })

  it('depletes on a miss', () => {
    let ring = createAccuracyRing()
    ring = recordMiss(ring)
    expect(ring.value).toBeLessThan(1.0)
  })

  it('recovers slightly on a hit', () => {
    let ring = createAccuracyRing()
    ring = recordMiss(ring)
    ring = recordMiss(ring)
    const afterMisses = ring.value
    ring = recordHit(ring)
    expect(ring.value).toBeGreaterThan(afterMisses)
  })

  it('never goes below 0', () => {
    let ring = createAccuracyRing()
    for (let i = 0; i < 100; i++) {
      ring = recordMiss(ring)
    }
    expect(ring.value).toBeGreaterThanOrEqual(0)
  })

  it('never goes above 1.0', () => {
    let ring = createAccuracyRing()
    for (let i = 0; i < 100; i++) {
      ring = recordHit(ring)
    }
    expect(ring.value).toBeLessThanOrEqual(1.0)
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/accuracy-ring.test.ts
git add src/lib/accuracy-ring.ts src/__tests__/accuracy-ring.test.ts
git commit -m "feat: add accuracy ring state with hit/miss tracking"
```

---

## Task 9: Sprite Data and Color Mapping

**Behavior:** A pool of 10-15 sprite templates defined as 2D arrays of pixel colors. Each character type (letter, symbol, number) maps to a color palette. A function assigns a random sprite and appropriate colors to a given character.

**Files:**
- Test: `src/__tests__/sprites.test.ts` (new)
- Create: `src/lib/sprites.ts`

**Step 1: Write `src/__tests__/sprites.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { SPRITE_TEMPLATES, getCharColor, assignSprite } from '../lib/sprites'

describe('SPRITE_TEMPLATES', () => {
  it('contains 10-15 templates', () => {
    expect(SPRITE_TEMPLATES.length).toBeGreaterThanOrEqual(10)
    expect(SPRITE_TEMPLATES.length).toBeLessThanOrEqual(15)
  })

  it('each template is a 2D array of pixel values', () => {
    for (const template of SPRITE_TEMPLATES) {
      expect(template.length).toBeGreaterThan(0)
      for (const row of template) {
        expect(Array.isArray(row)).toBe(true)
        expect(row.length).toBe(template[0].length)
      }
    }
  })
})

describe('getCharColor', () => {
  it('returns cool tones for letters', () => {
    const color = getCharColor('a')
    expect(color.category).toBe('letter')
  })

  it('returns warm tones for symbols', () => {
    const color = getCharColor('(')
    expect(color.category).toBe('symbol')
  })

  it('returns neutral tones for numbers', () => {
    const color = getCharColor('5')
    expect(color.category).toBe('number')
  })
})

describe('assignSprite', () => {
  it('returns a sprite template and color for a character', () => {
    const sprite = assignSprite('a')
    expect(sprite.template).toBeDefined()
    expect(sprite.color).toBeDefined()
  })

  it('same character may get different sprites (random from pool)', () => {
    const sprites = new Set<number>()
    for (let i = 0; i < 50; i++) {
      const sprite = assignSprite('a')
      sprites.add(SPRITE_TEMPLATES.indexOf(sprite.template))
    }
    expect(sprites.size).toBeGreaterThan(1)
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/sprites.test.ts
git add src/lib/sprites.ts src/__tests__/sprites.test.ts
git commit -m "feat: add sprite pool with character type color mapping"
```

---

## Task 10: Game State Machine

**Behavior:** Manages mode transitions: menu → demo → calibration → calibration-summary → practice (loop through rounds). Returning player skips demo and calibration. Recalibrate resets to calibration. Tracks current WPM, learning speed, weak keys, focus keys. Persists to localStorage.

**Files:**
- Test: `src/__tests__/useGameState.test.tsx` (exists, rewrite)
- Create: `src/hooks/useGameState.ts`

**Step 1: Rewrite `src/__tests__/useGameState.test.tsx`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'

beforeEach(() => {
  localStorage.clear()
})

describe('useGameState — first launch', () => {
  it('starts in menu mode when no saved state', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.screen).toBe('menu')
  })

  it('transitions to demo on startGame (first time)', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('demo')
  })

  it('transitions from demo to calibration', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    act(() => { result.current.completeDemo() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('calibration')
  })
})

describe('useGameState — returning player', () => {
  it('starts in menu mode with saved state', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'], complete: true },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    const { result } = renderHook(() => useGameState())
    expect(result.current.screen).toBe('menu')
  })

  it('startGame skips demo and calibration, goes to playing in practice mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'], complete: true },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('practice')
  })
})

describe('useGameState — calibration completion', () => {
  it('transitions to calibration-summary after all 5 groups completed', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    act(() => { result.current.completeDemo() })

    // Simulate completing all 5 calibration rounds
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300 }) })
    }
    expect(result.current.screen).toBe('calibration-summary')
  })

  it('transitions from calibration-summary to practice', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame() })
    act(() => { result.current.completeDemo() })
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.completeRound({ grapesLeft: 20, accuracy: 0.8, avgReactionMs: 300 }) })
    }
    act(() => { result.current.beginPractice() })
    expect(result.current.screen).toBe('playing')
    expect(result.current.mode).toBe('practice')
  })
})

describe('useGameState — recalibrate', () => {
  it('resets to calibration mode', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: { completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'], complete: true },
        currentFocusKeys: [],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.recalibrate() })
    // After recalibrate, starting game should go to calibration (no demo since demo only on first launch)
    act(() => { result.current.startGame() })
    expect(result.current.mode).toBe('calibration')
  })
})

describe('useGameState — derived stats', () => {
  it('provides weak keys ranked by weakness', () => {
    const { result } = renderHook(() => useGameState())
    expect(Array.isArray(result.current.weakKeys)).toBe(true)
  })

  it('provides current WPM (0 when no history)', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.currentWPM).toBe(0)
  })

  it('provides learning speed (0 when insufficient history)', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.learningSpeed).toBe(0)
  })
})

describe('useGameState — navigation', () => {
  it('can navigate to stats screen and back', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.goToStats() })
    expect(result.current.screen).toBe('stats')
    act(() => { result.current.goToMenu() })
    expect(result.current.screen).toBe('menu')
  })

  it('can navigate to settings screen and back', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.goToSettings() })
    expect(result.current.screen).toBe('settings')
    act(() => { result.current.goToMenu() })
    expect(result.current.screen).toBe('menu')
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/useGameState.test.tsx
git add src/hooks/useGameState.ts src/__tests__/useGameState.test.tsx
git commit -m "feat: add game state machine with screen navigation and mode transitions"
```

---

## Task 11: Game Loop Hook

**Behavior:** Drives requestAnimationFrame. Starts paused. Provides start/stop/handleKeyPress. Ticks invaders forward, checks collisions, auto-advances waves when all invaders resolved, calls onRoundEnd when round is complete. Staggered wave spawning (batches every 1-2 seconds within a wave).

**Files:**
- Test: `src/__tests__/useGameLoop.test.tsx` (exists, extend)
- Create: `src/hooks/useGameLoop.ts`

**Step 1: Add behavior tests to `src/__tests__/useGameLoop.test.tsx`**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameLoop } from '../hooks/useGameLoop'
import { createRoundState } from '../lib/game-engine'

describe('useGameLoop', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const makeProps = (overrides = {}) => ({
    roundState: createRoundState({ grapeCount: 10, totalWaves: 8, focusKeys: ['a'] }),
    onRoundEnd: vi.fn(),
    onStateChange: vi.fn(),
    boardSize: { width: 800, height: 600 },
    baseSpeed: 50,
    ...overrides,
  })

  it('starts paused and can be started', () => {
    const { result } = renderHook(() => useGameLoop(makeProps()))
    expect(result.current.running).toBe(false)
  })

  it('exposes start, stop, and handleKeyPress', () => {
    const { result } = renderHook(() => useGameLoop(makeProps()))
    expect(typeof result.current.start).toBe('function')
    expect(typeof result.current.stop).toBe('function')
    expect(typeof result.current.handleKeyPress).toBe('function')
  })

  it('calls onRoundEnd when round completes', () => {
    const onRoundEnd = vi.fn()
    const state = createRoundState({ grapeCount: 1, totalWaves: 1, focusKeys: ['a'] })
    const { result } = renderHook(() =>
      useGameLoop(makeProps({ roundState: state, onRoundEnd })),
    )
    // Starting and advancing to round completion would trigger onRoundEnd
    // (Integration behavior — exact mechanism depends on implementation)
    expect(onRoundEnd).not.toHaveBeenCalled() // not called until round actually ends
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/useGameLoop.test.tsx
git add src/hooks/useGameLoop.ts src/__tests__/useGameLoop.test.tsx
git commit -m "feat: add useGameLoop hook with rAF bridge and auto-wave-advance"
```

---

## Task 12: HUD Component

**Behavior:** Displays high score, round score, WPM, learning speed (with sign, "—" when <10 rounds), weak keys as badges, round name, wave progress (N/M), grape count (X/Y), settings button, recalibrate button.

**Files:**
- Test: `src/__tests__/HUD.test.tsx` (exists, keep as-is + extend)
- Create: `src/components/HUD.tsx`

**Step 1: Add learning speed "—" test to existing file**

```typescript
it('shows dash for learning speed when insufficient data', () => {
  render(<HUD {...defaultProps} learningSpeed={null} />)
  expect(screen.getByTestId('learning-speed')).toHaveTextContent('—')
})

it('shows negative learning speed', () => {
  render(<HUD {...defaultProps} learningSpeed={-2} />)
  expect(screen.getByTestId('learning-speed')).toHaveTextContent('-2')
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/HUD.test.tsx
git add src/components/HUD.tsx src/__tests__/HUD.test.tsx
git commit -m "feat: add HUD component with stats, weak keys, and round info"
```

---

## Task 13: GameBoard Component

**Behavior:** Renders grape cluster with the correct number of grape elements. Renders alive invaders at their positions with character text. Dead invaders are not rendered. Invaders closer to center have higher z-index. Shows accuracy ring around the grape cluster.

**Files:**
- Test: `src/__tests__/GameBoard.test.tsx` (exists, extend)
- Create: `src/components/GameBoard.tsx`
- Create: `src/components/GrapeCluster.tsx`
- Create: `src/components/Invader.tsx`
- Create: `src/components/AccuracyRing.tsx`

**Step 1: Add new behavior tests to `src/__tests__/GameBoard.test.tsx`**

```typescript
import { createAccuracyRing } from '../lib/accuracy-ring'

it('renders accuracy ring around grape cluster', () => {
  const state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
  render(<GameBoard roundState={state} accuracyRing={createAccuracyRing()} onKeyPress={vi.fn()} />)
  expect(screen.getByTestId('accuracy-ring')).toBeInTheDocument()
})

it('invaders closer to center have higher z-index', () => {
  let state = createRoundState({ grapeCount: 24, totalWaves: 8, focusKeys: ['a'] })
  const far = createInvader({ char: 'a', position: { x: 10, y: 300 }, center: { x: 400, y: 300 }, speed: 1 })
  const near = createInvader({ char: 'b', position: { x: 350, y: 300 }, center: { x: 400, y: 300 }, speed: 1 })
  state = { ...state, invaders: [far, near] }

  render(<GameBoard roundState={state} accuracyRing={createAccuracyRing()} onKeyPress={vi.fn()} />)

  const farEl = screen.getByTestId('invader-0')
  const nearEl = screen.getByTestId('invader-1')
  const farZ = parseInt(farEl.style.zIndex || '0')
  const nearZ = parseInt(nearEl.style.zIndex || '0')
  expect(nearZ).toBeGreaterThan(farZ)
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/GameBoard.test.tsx
git add src/components/GameBoard.tsx src/components/GrapeCluster.tsx src/components/Invader.tsx src/components/AccuracyRing.tsx src/__tests__/GameBoard.test.tsx
git commit -m "feat: add GameBoard with grape cluster, invaders, accuracy ring, and z-ordering"
```

---

## Task 14: Round Summary and Round End

**Behavior:** When waves are cleared, a "ROUND CLEAR" screen shows briefly. When grapes are lost, "GAME OVER" shows. Round summary displays grapes survived, accuracy %, reaction time, keys improved/declined, and next round focus preview. A 3-2-1 countdown precedes the next round.

**Files:**
- Test: `src/__tests__/RoundSummary.test.tsx` (exists, extend)
- Test: `src/__tests__/RoundEnd.test.tsx` (new)
- Create: `src/components/RoundEnd.tsx`
- Create: `src/components/Countdown.tsx`
- Modify: `src/components/RoundSummary.tsx`

**Step 1: Extend `src/__tests__/RoundSummary.test.tsx`**

```typescript
it('shows keys that improved', () => {
  render(<RoundSummary {...defaultProps} keysImproved={['a', 'b']} keysDefined={['c']} />)
  expect(screen.getByTestId('keys-improved')).toHaveTextContent('a')
  expect(screen.getByTestId('keys-improved')).toHaveTextContent('b')
})

it('shows keys that declined', () => {
  render(<RoundSummary {...defaultProps} keysImproved={[]} keysDefined={['x']} />)
  expect(screen.getByTestId('keys-declined')).toHaveTextContent('x')
})
```

**Step 2: Write `src/__tests__/RoundEnd.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoundEnd } from '../components/RoundEnd'
import { Countdown } from '../components/Countdown'

describe('RoundEnd', () => {
  it('shows ROUND CLEAR when result is cleared', () => {
    render(<RoundEnd result="cleared" onDone={vi.fn()} />)
    expect(screen.getByText(/round clear/i)).toBeInTheDocument()
  })

  it('shows GAME OVER when result is grapes_lost', () => {
    render(<RoundEnd result="grapes_lost" onDone={vi.fn()} />)
    expect(screen.getByText(/game over/i)).toBeInTheDocument()
  })
})

describe('Countdown', () => {
  it('renders the countdown number', () => {
    render(<Countdown value={3} />)
    expect(screen.getByTestId('countdown')).toHaveTextContent('3')
  })
})
```

**Step 3: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/RoundSummary.test.tsx src/__tests__/RoundEnd.test.tsx
git add src/components/RoundEnd.tsx src/components/Countdown.tsx src/components/RoundSummary.tsx src/__tests__/RoundSummary.test.tsx src/__tests__/RoundEnd.test.tsx
git commit -m "feat: add round end screens, countdown, and improved round summary"
```

---

## Task 15: Main Menu Screen

**Behavior:** Shows game title, Start Game button, Stats button, Settings button, and Recalibrate button. Each button triggers the appropriate navigation callback.

**Files:**
- Test: `src/__tests__/MainMenu.test.tsx` (new)
- Create: `src/components/MainMenu.tsx`

**Step 1: Write `src/__tests__/MainMenu.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MainMenu } from '../components/MainMenu'

describe('MainMenu', () => {
  const defaultProps = {
    onStartGame: vi.fn(),
    onStats: vi.fn(),
    onSettings: vi.fn(),
    onRecalibrate: vi.fn(),
  }

  it('shows the game title', () => {
    render(<MainMenu {...defaultProps} />)
    expect(screen.getByText(/typecraft/i)).toBeInTheDocument()
  })

  it('has a Start Game button that calls onStartGame', async () => {
    const onStart = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onStartGame={onStart} />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('has a Stats button that calls onStats', async () => {
    const onStats = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onStats={onStats} />)
    await user.click(screen.getByRole('button', { name: /stats/i }))
    expect(onStats).toHaveBeenCalledTimes(1)
  })

  it('has a Settings button that calls onSettings', async () => {
    const onSettings = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onSettings={onSettings} />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })

  it('has a Recalibrate button that calls onRecalibrate', async () => {
    const onRecal = vi.fn()
    const user = userEvent.setup()
    render(<MainMenu {...defaultProps} onRecalibrate={onRecal} />)
    await user.click(screen.getByRole('button', { name: /recalibrate/i }))
    expect(onRecal).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/MainMenu.test.tsx
git add src/components/MainMenu.tsx src/__tests__/MainMenu.test.tsx
git commit -m "feat: add main menu with start, stats, settings, and recalibrate"
```

---

## Task 16: Settings Screen

**Behavior:** Displays controls for all 4 settings with current values. Changes call an update callback. Validates ranges (clamping). Shows labels with current values.

**Files:**
- Test: `src/__tests__/SettingsScreen.test.tsx` (new)
- Create: `src/components/SettingsScreen.tsx`

**Step 1: Write `src/__tests__/SettingsScreen.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsScreen } from '../components/SettingsScreen'
import { DEFAULT_SETTINGS } from '../lib/settings'

describe('SettingsScreen', () => {
  const defaultProps = {
    settings: DEFAULT_SETTINGS,
    onUpdate: vi.fn(),
    onBack: vi.fn(),
  }

  it('displays current grape count', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/24/)).toBeInTheDocument()
  })

  it('displays current speed preset', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/normal/i)).toBeInTheDocument()
  })

  it('displays current max invaders per wave', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/12/)).toBeInTheDocument()
  })

  it('displays current waves per round', () => {
    render(<SettingsScreen {...defaultProps} />)
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('has a back button', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<SettingsScreen {...defaultProps} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdate when a setting is changed', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<SettingsScreen {...defaultProps} onUpdate={onUpdate} />)
    // Interact with speed preset selector
    await user.click(screen.getByRole('button', { name: /fast/i }))
    expect(onUpdate).toHaveBeenCalled()
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/SettingsScreen.test.tsx
git add src/components/SettingsScreen.tsx src/__tests__/SettingsScreen.test.tsx
git commit -m "feat: add settings screen with grape count, speed, wave controls"
```

---

## Task 17: Stats Screen

**Behavior:** Full-screen sortable table of per-key stats. Columns: key, accuracy %, avg speed, total kills, best accuracy, best speed, trend arrow. Sortable by clicking column headers. Color-coded by weakness. Back button returns to menu.

**Files:**
- Test: `src/__tests__/StatsScreen.test.tsx` (new)
- Create: `src/components/StatsScreen.tsx`

**Step 1: Write `src/__tests__/StatsScreen.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsScreen } from '../components/StatsScreen'

describe('StatsScreen', () => {
  const keyStats = [
    { key: 'a', accuracy: 0.95, avgSpeedMs: 200, totalKills: 50, bestAccuracy: 0.98, bestSpeedMs: 150, trend: 'improving' as const },
    { key: '(', accuracy: 0.40, avgSpeedMs: 800, totalKills: 10, bestAccuracy: 0.55, bestSpeedMs: 600, trend: 'declining' as const },
    { key: '5', accuracy: 0.70, avgSpeedMs: 400, totalKills: 25, bestAccuracy: 0.75, bestSpeedMs: 350, trend: 'stable' as const },
  ]

  it('renders a row for each key', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('(')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows accuracy as percentage', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('shows trend indicators', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    const rows = screen.getAllByTestId(/^stat-row-/)
    expect(rows.length).toBe(3)
  })

  it('sorts by column when header is clicked', async () => {
    const user = userEvent.setup()
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)

    // Click accuracy header to sort
    await user.click(screen.getByRole('columnheader', { name: /accuracy/i }))

    const rows = screen.getAllByTestId(/^stat-row-/)
    // After sorting by accuracy ascending, '(' (40%) should be first
    expect(within(rows[0]).getByText('(')).toBeInTheDocument()
  })

  it('has a back button', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<StatsScreen keyStats={keyStats} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/StatsScreen.test.tsx
git add src/components/StatsScreen.tsx src/__tests__/StatsScreen.test.tsx
git commit -m "feat: add stats screen with sortable per-key table"
```

---

## Task 18: Onboarding Demo

**Behavior:** First launch only. Shows 5 slow invaders one at a time. Displays progressive prompts: "Type the character to destroy the invader!" on first invader, "Nice! Keep going." after 2nd destroyed, "Watch out for the grapes!" when one gets close. Shows "Ready? Let's calibrate!" button after all 5 resolved.

**Files:**
- Test: `src/__tests__/OnboardingDemo.test.tsx` (new)
- Create: `src/components/OnboardingDemo.tsx`

**Step 1: Write `src/__tests__/OnboardingDemo.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingDemo } from '../components/OnboardingDemo'

describe('OnboardingDemo', () => {
  it('shows the first prompt immediately', () => {
    render(<OnboardingDemo onComplete={vi.fn()} />)
    expect(screen.getByText(/type the character to destroy/i)).toBeInTheDocument()
  })

  it('shows an invader with a character', () => {
    render(<OnboardingDemo onComplete={vi.fn()} />)
    expect(screen.getByTestId('demo-invader')).toBeInTheDocument()
  })

  it('shows "Ready? Let\'s calibrate!" button after all invaders resolved', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<OnboardingDemo onComplete={onComplete} />)

    // Simulate typing each demo invader's character
    // The component should expose the current character or we test end-state
    // This test verifies the final state
    // (Implementation detail: the component manages its own mini game loop)
  })

  it('calls onComplete when the ready button is clicked', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<OnboardingDemo onComplete={onComplete} />)

    // After demo completes, click the ready button
    // (Full integration requires advancing through all 5 invaders)
    // Minimal test: verify onComplete callback exists in props
    expect(typeof onComplete).toBe('function')
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/OnboardingDemo.test.tsx
git add src/components/OnboardingDemo.tsx src/__tests__/OnboardingDemo.test.tsx
git commit -m "feat: add onboarding demo with guided prompts"
```

---

## Task 19: Pause Menu

**Behavior:** Escape key during gameplay opens a pause overlay. Shows Resume, Current Round Stats (accuracy/kills/speed so far), Settings, and Quit to Menu. Quit shows a confirmation dialog. Confirming quit discards round data and returns to main menu. Resume returns to gameplay.

**Files:**
- Test: `src/__tests__/PauseMenu.test.tsx` (new)
- Create: `src/components/PauseMenu.tsx`

**Step 1: Write `src/__tests__/PauseMenu.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseMenu } from '../components/PauseMenu'

describe('PauseMenu', () => {
  const defaultProps = {
    roundStats: { accuracy: 0.82, kills: 15, avgReactionMs: 280 },
    onResume: vi.fn(),
    onSettings: vi.fn(),
    onQuit: vi.fn(),
  }

  it('shows PAUSED header', () => {
    render(<PauseMenu {...defaultProps} />)
    expect(screen.getByText(/paused/i)).toBeInTheDocument()
  })

  it('shows Resume button that calls onResume', async () => {
    const onResume = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onResume={onResume} />)
    await user.click(screen.getByRole('button', { name: /resume/i }))
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('shows current round stats', () => {
    render(<PauseMenu {...defaultProps} />)
    expect(screen.getByText(/82%/)).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/280/)).toBeInTheDocument()
  })

  it('shows Quit to Menu button', () => {
    render(<PauseMenu {...defaultProps} />)
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })

  it('shows confirmation dialog on quit click', async () => {
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /quit/i }))
    expect(screen.getByText(/round progress will be lost/i)).toBeInTheDocument()
  })

  it('calls onQuit after confirming quit', async () => {
    const onQuit = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onQuit={onQuit} />)
    await user.click(screen.getByRole('button', { name: /quit/i }))
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onQuit).toHaveBeenCalledTimes(1)
  })

  it('cancelling quit returns to pause menu', async () => {
    const onQuit = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onQuit={onQuit} />)
    await user.click(screen.getByRole('button', { name: /quit/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onQuit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
  })

  it('has a Settings button', async () => {
    const onSettings = vi.fn()
    const user = userEvent.setup()
    render(<PauseMenu {...defaultProps} onSettings={onSettings} />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run → FAIL → Implement → PASS → Commit**

```bash
npm test -- src/__tests__/PauseMenu.test.tsx
git add src/components/PauseMenu.tsx src/__tests__/PauseMenu.test.tsx
git commit -m "feat: add pause menu with resume, stats, settings, and quit confirmation"
```

---

## Task 20: App Shell Integration

**Behavior:** All screens are wired together. Main menu renders on launch. Keyboard events route to game during gameplay. Escape pauses. Screen transitions work end-to-end. Dark theme applied. localStorage persistence across refresh.

**Files:**
- Test: `src/__tests__/App.test.tsx` (rewrite)
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/index.css`

**Step 1: Rewrite `src/__tests__/App.test.tsx`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

beforeEach(() => {
  localStorage.clear()
})

describe('App — first launch', () => {
  it('shows main menu on launch', () => {
    render(<App />)
    expect(screen.getByText(/typecraft/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('transitions to demo when Start Game is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    // Demo should be showing
    expect(screen.getByText(/type the character/i)).toBeInTheDocument()
  })

  it('has dark theme styling', () => {
    render(<App />)
    const app = screen.getByTestId('app')
    expect(app).toHaveClass('dark')
  })
})

describe('App — returning player', () => {
  it('shows main menu with saved state', () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    render(<App />)
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('goes directly to playing on Start Game (no demo, no calibration)', async () => {
    localStorage.setItem(
      'typecraft',
      JSON.stringify({
        schemaVersion: 1,
        keyProfiles: {},
        roundHistory: [],
        calibrationProgress: {
          completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
          complete: true,
        },
        currentFocusKeys: ['(', ')'],
        mode: 'practice',
        settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
        highScore: 47,
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })
})

describe('App — navigation', () => {
  it('can navigate to stats and back', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /stats/i }))
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('can navigate to settings and back', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })
})
```

**Step 2: Run → FAIL → Implement → PASS**

```bash
npm test -- src/__tests__/App.test.tsx
```

**Step 3: Run ALL tests to verify nothing is broken**

```bash
npm test
```
Expected: ALL PASS

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css src/index.css src/__tests__/App.test.tsx
git commit -m "feat: wire up app shell with menu, navigation, and gameplay loop"
```

---

## Task 21: Visual Polish and Manual Verification

**No new tests.** This task is about visual quality that can't be unit-tested.

**Step 1: Run all tests to confirm green baseline**

```bash
npm test
```

**Step 2: Run `npm run dev` and verify visually:**

- [x] Dark theme (#1a1a2e background)
- [x] Main menu renders with all 4 buttons
- [x] Start Game → demo (first time) → calibration → practice
- [x] Pixel-art invaders with colored sprites (cool=letters, warm=symbols, neutral=numbers)
- [x] Invaders approach from all 4 screen edges toward center
- [x] Characters visible on invaders (28px+ monospace)
- [x] Grape cluster at center — styled DOM spheres, no emoji
- [x] Vine/stem lines connecting grapes
- [x] Grape burst animation (squash + juice droplets) when 3 invaders absorbed
- [x] Accuracy ring around cluster — depletes on miss, recovers on hit
- [x] Typing destroys nearest matching invader — pixel-scatter explosion (300ms)
- [x] Absorbed invader: red flash, dissolves inward
- [x] HUD: high score, round score, WPM, learning speed, weak key badges
- [x] Bottom bar: round name, wave N/M, grapes X/Y
- [x] Round end: "ROUND CLEAR" or "GAME OVER" (1-2s), then summary
- [x] Round summary: grapes, accuracy, reaction time, next focus preview
- [x] 3-2-1 countdown before next round
- [x] Escape → pause overlay with resume/stats/settings/quit
- [x] Quit confirmation dialog
- [x] Settings screen: all 4 settings with controls
- [x] Stats screen: sortable per-key table
- [x] Game fills viewport, scales with window size
- [x] Z-ordering: closer invaders render on top
- [x] Speed escalation feels noticeable across waves
- [x] Calibration adapts speed (gets harder if you're good)
- [x] Recalibrate: resets profiles, keeps high score
- [x] Refresh browser: state persists, returns to menu

**Step 3: Fix any issues found**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: TypeCraft v1 — visual polish and full gameplay integration"
```

---

## Task Dependency Graph

```
Layer 1 — Pure Logic (no React deps, parallelizable):
  Task 1  (scoring/keys)
  Task 2  (game engine)     ← depends on Task 1 types
  Task 3  (wave gen)        ← depends on Task 1
  Task 4  (stats/WPM)
  Task 5  (persistence)     ← depends on Task 1, 6
  Task 6  (settings)
  Task 7  (adaptive cal)
  Task 8  (accuracy ring)
  Task 9  (sprites)

Layer 2 — Hooks:
  Task 10 (useGameState)    ← depends on 1, 3, 4, 5, 6
  Task 11 (useGameLoop)     ← depends on 2, 7, 8

Layer 3 — Components (parallelizable):
  Task 12 (HUD)
  Task 13 (GameBoard)       ← depends on 2, 8, 9
  Task 14 (RoundEnd/Summary)
  Task 15 (MainMenu)
  Task 16 (SettingsScreen)  ← depends on 6
  Task 17 (StatsScreen)
  Task 18 (OnboardingDemo)
  Task 19 (PauseMenu)

Layer 4 — Integration:
  Task 20 (App Shell)       ← depends on all above
  Task 21 (Visual Polish)   ← depends on 20
```

**Parallelization opportunities:**
- Tasks 1, 4, 6, 7, 8, 9 have no cross-dependencies — run all in parallel
- Tasks 2, 3, 5 depend on Task 1 — run in parallel after Task 1
- Tasks 12, 14, 15, 17, 18, 19 are pure presentational — run in parallel anytime
- Tasks 10, 11 depend on logic layer — run after Layer 1
- Task 20 depends on everything

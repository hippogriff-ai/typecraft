# TypeCraft Continuity Ledger

## Goal
Build a Space Invaders-style typing game (TypeCraft) with React 19 + TypeScript + Vite. Full spec in docs/SPEC.md, plan in docs/plans/2026-01-31-typecraft.md.

## Constraints/Assumptions
- TDD approach: tests written first (RED), then implement (GREEN)
- Pure logic in src/lib/ (zero React deps), hooks in src/hooks/, components in src/components/
- Immutable state — engine functions return new state, never mutate
- TypeScript strict mode with verbatimModuleSyntax
- localStorage persistence under key "typecraft"

## Key Decisions
- 21-task plan with 4 layers (pure logic → hooks → components → integration)
- Implemented all layers in one pass since tests already existed
- stats.ts uses SessionRecord type (with timestamp+wpm) per existing tests
- Wave generator and game engine use deterministic 70/30 split (pre-allocated counts) to avoid flaky tests
- StatsScreen defaults to sorting by key (not accuracy) so clicking Accuracy header sorts ascending first
- spawnWave uses selectWordsForFocus to pick words/code-snippets, then expands to character invaders with batch positioning
- Dead invaders pruned between waves; totalSpawned counter for accurate accuracy
- Invaders colored by char type (letters=blue/green, symbols=red/orange, numbers=purple)
- Explosion system: Explosion[] state in App.tsx, passed to GameBoard, 8 CSS-animated particles per explosion, 300ms duration
- bestSpeedMs uses 0 sentinel (not Infinity) to survive JSON serialization
- OnboardingDemo uses rAF animation loop with queueMicrotask for proximity state update

## State
### Done
- All 21 plan tasks DONE
- **All 11 lib modules**: keys, scoring, game-engine, wave-generator, stats, storage, settings, adaptive-calibration, accuracy-ring, sprites, word-list
- **Both hooks**: useGameState, useGameLoop
- **All 10 components**: HUD, GameBoard, RoundSummary, MainMenu, RoundEnd, Countdown, SettingsScreen, StatsScreen, OnboardingDemo, PauseMenu
- **App.tsx fully wired**: menu → demo → calibration → playing (with pause, round-end, round-summary)
- **Dark theme CSS**: complete visual styling
- **Settings persistence**: updateSettings wired to SettingsScreen
- **Word-based batch spawning**: spawnWave uses selectWordsForFocus
- **Key profile tracking**: recordKeyResult captures hit/miss/reaction time
- **Calibration flow**: focus keys correctly set from calibration round configs
- **High score tracking**: updated on round completion, persisted
- **Invader colors**: by character type using sprites.ts color system
- **Dead invader cleanup**: pruned between waves
- **Staggered spawning**: invaders spawn in batches of ~3 every 1-2s, not all at once
- **Accuracy ring visual**: SVG circular progress ring around grape cluster, updates on hits/misses
- **Auto-timed round end**: auto-dismisses after 1.5s; 3-2-1 countdown between rounds
- **Responsive board**: viewport-based sizing via resize listener, dynamic center
- **Pause menu accuracy fix**: uses totalSpawned instead of invaders.length
- **Comprehensive state transition tests**: 17 tests covering full game flow
- **clearCalibrationData preserves highScore**: verified with test
- **Destroy animation**: pixel-scatter explosion (8 particles, CSS animation, 300ms, non-blocking)
- **handleKeyPress returns destroyedPosition**: for rendering explosions at correct location
- **Flaky wave test fix**: spawnWave trimming now prefers removing non-focus chars
- **Playtested in browser**: explosions working, full gameplay flow confirmed
- **E2E testing**: 13 Playwright tests covering all critical user flows
- **Vitest exclude e2e/**: vite.config.ts excludes e2e/ from Vitest to avoid Playwright conflicts
- **Absorb animation**: red flash + dissolve inward at collision point (400ms CSS animation)
- **Grape burst animation**: 6 juice droplet particles spray outward when grape lost (500ms CSS animation)
- **checkCollisions returns CollisionEvent[]**: position + grapeLost flag for animation triggers
- **Bug fixes (iteration 9)**: WPM with accuracy multiplier, real WPM tracking in rounds, learning speed 5-round window, wave formula 3+N (N=0), reaction time accumulation, miss doesn't record 0ms
- **Trend calculation (iteration 10)**: computeTrend() using linear regression on last 10 data points per key
- **Removed duplicate round info**: GameBoard no longer renders wave/grape info (already in HUD)
- **Per-key bests (iteration 11)**: bestAccuracy and bestSpeedMs tracked in KeyProfile, JSON-safe 0 sentinel
- **Keys improved/declined (iteration 12)**: round-start accuracy snapshot compared to round-end, passed to RoundSummary
- **Stats screen color-coding (iteration 13)**: rows tinted red-to-green based on accuracy weakness
- **Onboarding demo overhaul (iteration 14)**: spatial invaders with rAF movement, proximity-triggered "Watch out!" prompt
- **Adaptive calibration wired (iteration 15)**: CalibrationTracker now used in useGameLoop during calibration mode
- **Calibration summary enhanced (iteration 16)**: shows overall accuracy, strongest keys, and weakest keys
- **Storage wipe on parse error (iteration 17)**: corrupted localStorage now explicitly removed per spec
- **Dead code cleanup (iteration 18)**: removed unused RoundRecord and KeyGroupName types
- **Recalibrate confirmation dialog (iteration 19)**: MainMenu shows confirm/cancel before recalibrating
- **New high score display (iteration 19)**: RoundSummary shows "NEW HIGH SCORE" when applicable
- **Grape spring animation (iteration 20)**: grapes animate with spring easing when cluster reflows after loss
- **Bug fix (iteration 21)**: averageTimeMs no longer diluted by misses (timeMs=0 skipped); reaction time only tracks hits
- **Trend arrow colors (iteration 22)**: green/red/grey trend indicators in StatsScreen
- **Schema wipe notice (iteration 23)**: "Data format updated" notice shown on main menu after version mismatch wipe
- **Bug fix (iteration 24)**: practice mode completeRound no longer changes screen to 'round-summary' (which had no renderer); removed dead Screen type
- **Grape vine/stem (iteration 25)**: thin green vine line with leaf curl above grape cluster
- **188 unit tests, 13 E2E tests, build clean, lint clean**

### Now
- Spec compliance achieved — all major spec items implemented

### Next
- Additional visual polish (color-blind modes per spec)
- E2E test updates for new features

## Open Questions
- None

## Working Set
- docs/plans/2026-01-31-typecraft.md — completion tracker

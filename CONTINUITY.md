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
- **Lint clean, 164/164 tests pass, build clean**
- **Playtested in browser**: explosions working, full gameplay flow confirmed
- **E2E testing**: 13 Playwright tests covering all critical user flows (menu, demo, calibration, gameplay, pause, quit, settings, stats, persistence, HUD)
- **Vitest exclude e2e/**: vite.config.ts excludes e2e/ from Vitest to avoid Playwright conflicts
- **Absorb animation**: red flash + dissolve inward at collision point (400ms CSS animation)
- **Grape burst animation**: 6 juice droplet particles spray outward when grape lost (500ms CSS animation)
- **checkCollisions returns CollisionEvent[]**: position + grapeLost flag for animation triggers
- **Bug fixes (iteration 9)**: WPM with accuracy multiplier, real WPM tracking in rounds, learning speed 5-round window, wave formula 3+N (N=0), reaction time accumulation, miss doesn't record 0ms
- **167 unit tests, 13 E2E tests, build clean, lint clean**

### Now
- Ready for next iteration

### Next
- More bug fixes from code review (per-key bests, trend calculation, onboarding demo prompts)
- Additional gameplay tuning

## Open Questions
- None

## Working Set
- docs/plans/2026-01-31-typecraft.md — completion tracker

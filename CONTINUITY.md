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
- **Lint clean, 146/146 tests pass, build clean**
- **Playtested in browser**: full flow works end-to-end

### Now
- Ready for next iteration

### Next
- E2E testing with Playwright
- Visual polish (accuracy ring visual, explosion animations)
- Responsive board sizing (currently hardcoded 800x600)

## Open Questions
- None

## Working Set
- docs/plans/2026-01-31-typecraft.md — completion tracker

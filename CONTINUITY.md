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

## State
### Done
- Project setup (Vite, React 19, Vitest, Testing Library)
- Spec + Plan written
- **All 11 lib modules implemented**: keys, scoring, game-engine, wave-generator, stats, storage, settings, adaptive-calibration, accuracy-ring, sprites, word-list
- **Both hooks implemented**: useGameState, useGameLoop
- **All 10 components implemented**: HUD, GameBoard, RoundSummary, MainMenu, RoundEnd, Countdown, SettingsScreen, StatsScreen, OnboardingDemo, PauseMenu
- **App.tsx fully wired** — menu → demo → calibration-summary → playing (with pause, round-end, round-summary)
- **Dark theme CSS** — App.css and index.css fully styled
- **Settings persistence** — updateSettings in useGameState, wired to SettingsScreen
- **Word-based batch spawning** — spawnWave uses selectWordsForFocus, characters from same word spawn near each other
- **Key profile tracking** — recordKeyResult in useGameState captures hit/miss/reaction time from gameplay, enables adaptive weakness detection
- **146/146 tests pass across 22 test files, build passes clean**
- **Playtested in browser** — full flow works: menu → demo → calibration → gameplay with HUD, grape cluster, invaders

### Now
- Iteration complete. Ready for next iteration.

### Next
- Calibration focus keys: ensure calibration rounds set the correct group-specific focus keys
- Visual polish (pixel-art sprites on invaders, animations, accuracy ring visual)
- E2E testing with Playwright

## Open Questions
- None

## Working Set
- docs/plans/2026-01-31-typecraft.md — completion tracker

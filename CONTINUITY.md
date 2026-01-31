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

## State
### Done
- Project setup (Vite, React 19, Vitest, Testing Library)
- Spec + Plan written
- **All 11 lib modules implemented**: keys, scoring, game-engine, wave-generator, stats, storage, settings, adaptive-calibration, accuracy-ring, sprites, word-list
- **Both hooks implemented**: useGameState, useGameLoop
- **All 10 components implemented**: HUD, GameBoard, RoundSummary, MainMenu, RoundEnd, Countdown, SettingsScreen, StatsScreen, OnboardingDemo, PauseMenu
- **App.tsx fully wired** — menu → demo → calibration-summary → playing (with pause, round-end, round-summary)
- **App.test.tsx** — 7 tests for screen navigation (menu, dark theme, demo on first launch, returning player, stats, settings)
- **Dark theme CSS** — App.css and index.css fully styled
- **141/141 tests pass across 22 test files, build passes clean**

### Now
- Iteration 3: Pick next most important task and implement

### Next
- Wire updateSettings in SettingsScreen (currently noop)
- Visual polish (pixel-art sprites on invaders, animations)
- E2E testing with Playwright

## Open Questions
- None

## Working Set
- docs/plans/2026-01-31-typecraft.md — completion tracker

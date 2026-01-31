# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TypeCraft is a Space Invaders-style typing game built with React 19 + TypeScript + Vite. Pixel-art invaders labeled with characters approach a grape cluster; pressing the matching key destroys the nearest invader. The game identifies weak keys and drills them. Full spec in `docs/SPEC.md`, implementation plan in `docs/plans/2026-01-31-typecraft.md`.

## Continuity
Read `CONTINUITY.md` before executing.
After finish, document your changes on a high level in `CONTINUITY.md`

## Spec
See docs filder

## Commands

- `npm test` — run all tests once (vitest run)
- `npm run test:watch` — run tests in watch mode (vitest)
- `npm test -- src/__tests__/scoring.test.ts` — run a single test file
- `npm run dev` — start dev server (Vite)
- `npm run build` — typecheck then build (`tsc -b && vite build`)
- `npm run lint` — ESLint

## Architecture

**Pure logic layer** (`src/lib/`) — zero React dependencies, fully unit-testable:
- `keys.ts` — key group definitions (`KEY_GROUPS`, `ALL_KEYS`)
- `scoring.ts` — key profiles, weakness scoring (`createKeyProfile`, `recordKeyPress`, `computeWeaknessScore`, `rankWeaknesses`)
- `game-engine.ts` — invader creation/movement, collision detection, keypress handling. All functions are pure: take state in, return new state. Core types: `Vec2`, `Invader`, `RoundState`
- `wave-generator.ts` — character generation for waves, calibration round configs, practice round selection
- `stats.ts` — WPM calculation, learning speed tracking
- `storage.ts` — localStorage persistence with schema versioning. Storage key: `"typecraft"`. State shape: `AppState`

**Hooks** (`src/hooks/`):
- `useGameLoop` — requestAnimationFrame bridge. Exposes `start`, `stop`, `handleKeyPress`. Starts paused.
- `useGameState` — app-level state manager (mode transitions, round setup, persistence)

**Components** (`src/components/`):
- `GameBoard` — main game area rendering invaders + grape cluster
- `HUD` — top/bottom bars with scores, WPM, weak keys, wave progress
- `RoundSummary` — between-round stats display

## Testing

Vitest with jsdom environment. Test setup imports `@testing-library/jest-dom/vitest` for DOM matchers. Tests live in `src/__tests__/`. Vitest globals are enabled (no need to import `describe`/`it`/`expect` but existing tests do import them explicitly — follow whichever pattern the file uses).

## TypeScript

Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`. Target ES2022. Uses `verbatimModuleSyntax` — use `import type` for type-only imports.

## Key Patterns

- Game state is immutable — engine functions return new state objects, never mutate
- Invader positions use `Vec2 = { x: number, y: number }`
- `handleKeyPress` returns `{ state: RoundState, hit: boolean }` — the `hit` flag distinguishes successful targeting from misses
- `spawnWave` and `tickInvaders` take config objects with `center`, `boardWidth`/`boardHeight`, `speed`, `collisionRadius`
- localStorage uses a single key `"typecraft"` containing the full `AppState` JSON

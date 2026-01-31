# TypeCraft - Typing Practice for Programmers

## Product Spec

### Goal

An offline typing practice app that identifies a programmer's weakest keys and drills them with adaptive exercises. Focused on Python syntax symbols.

### Success Criteria

- User can identify their weakest keys within the first session
- Practice exercises adapt to target weaknesses
- Progress persists across browser sessions via localStorage
- User sees measurable improvement over time

---

## Core Concepts

### Key Profile

Every key (or key combo like `Shift+[` for `{`) has a profile tracking:
- **Accuracy**: percentage of correct hits over total attempts
- **Speed**: average time-to-press in milliseconds
- **Trend**: accuracy/speed trajectory over recent sessions (learning speed)

### Weakness Score

A composite metric per key: `weakness = (1 - accuracy) * 0.7 + normalizedSlowness * 0.3`

Higher weakness = more practice needed. Keys are ranked by weakness score to determine drill priority.

### Key Groups

Keys are organized into groups for structured practice:

| Group | Keys |
|-------|------|
| Home row | a s d f g h j k l ; |
| Top row | q w e r t y u i o p |
| Bottom row | z x c v b n m , . / |
| Numbers | 0-9 |
| Python Core Symbols | ( ) [ ] { } : = _ # @ . , |
| Shift Combos | All shifted versions of above |

---

## Features

### 1. Calibration Drill

**Purpose**: Systematically assess the user's proficiency on every key.

**Behavior**:
- Presents each key (and key combo) in isolation, one at a time
- Each key is tested multiple times (minimum 5 presses) for statistical significance
- Displays the target key prominently on screen
- Records accuracy and reaction time per press
- At the end, computes the initial Key Profile and Weakness Score for all keys
- Results are saved to localStorage

**Recalibration**: User can trigger recalibration at any time, which resets all Key Profiles and re-runs the full drill.

### 2. Adaptive Practice Session

**Purpose**: Drill the user's weakest keys with generated exercises.

**Behavior**:
- Selects the top N weakest keys (configurable, default 5)
- Generates short typing sequences (8-20 characters) that heavily feature those weak keys
- Sequences include:
  - Isolated key repetitions: `((())))`
  - Mixed weak keys: `{[()]}::`
  - Realistic Python snippets: `def __init__(self):`
  - Common bigrams containing weak keys
- After each sequence, updates Key Profiles with new data
- Re-ranks weaknesses periodically (every 10 sequences) and shifts focus
- Session continues until user stops

### 3. Visual Feedback During Typing

**Behavior**:
- Target text displayed in large monospace font (minimum 24px)
- Cursor/highlight shows current position
- As user types:
  - Correct characters turn **grey** (`#888`)
  - Incorrect characters turn **red** (`#e74c3c`) and stay red
- Typing continues forward regardless of errors (no backspace correction during drills)
- At end of sequence: summary shows errors and time

### 4. Dashboard / Stats Panel

**Displayed metrics**:
- **Current WPM**: rolling average over last 5 sequences
- **Weak Links**: top 5 weakest keys with their weakness scores, shown as a ranked list
- **Learning Speed**: WPM improvement rate (WPM delta per session), shown as a simple trend indicator (improving / plateau / declining)
- **Session History**: number of sessions completed, total practice time

### 5. Persistence (localStorage)

**Stored data**:
- All Key Profiles (accuracy, speed, trend per key)
- Weakness rankings
- Session history (timestamps, WPM per session)
- Current practice state (which keys being drilled, position in drill sequence)
- Calibration status (calibrated vs needs calibration)

**Resume behavior**: On app launch, if localStorage has data:
- Skip calibration, go directly to practice
- Load previous weakness rankings
- Continue drilling where user left off

**Fresh start**: If no localStorage data, prompt calibration first.

### 6. Recalibration

**Trigger**: Explicit button in the UI ("Recalibrate")

**Behavior**:
- Clears all Key Profiles and weakness data
- Keeps session history (for long-term tracking)
- Restarts the calibration drill from scratch

---

## UI Layout

```
+--------------------------------------------------+
|  TypeCraft                        [Recalibrate]  |
+--------------------------------------------------+
|                                                    |
|  Stats Bar:                                        |
|  WPM: 45  |  Learning: +3 WPM/session  |         |
|                                                    |
|  Weak Links: [ _ ] [ { ] [ ( ] [ : ] [ # ]       |
|                                                    |
+--------------------------------------------------+
|                                                    |
|          def __init__(self):                       |
|          ^^^                                       |
|          (typed: grey/red)  (untyped: default)     |
|                                                    |
+--------------------------------------------------+
```

### Typography
- Typing area: monospace font, minimum 28px
- Stats: 16-18px, clear contrast
- Dark background preferred for long sessions (dark theme)

---

## Non-Goals (Out of Scope)

- Online/cloud sync
- Multiplayer / leaderboards
- Sound effects
- Custom theme picker
- Support for languages other than Python symbols
- Mobile/touch support
- Backspace during drills (errors are recorded, not corrected)

---

## Technical Constraints

- **Stack**: React + TypeScript + Vite
- **Storage**: localStorage only (no backend)
- **Offline**: Must work without network after initial load
- **Testing**: Vitest + React Testing Library, TDD approach
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

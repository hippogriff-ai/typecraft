# TypeCraft - Space Invaders Typing Game

## Product Spec

### Goal

A typing practice game where pixel-art space invaders — each labeled with a character — attack a grape cluster. The player destroys invaders by typing the correct keys. The game identifies weak keys and spawns waves that drill those weaknesses. Focused on Python syntax symbols.

### Success Criteria

- Game is fun and creates urgency (invaders approaching grapes)
- Invaders have a pixel-art mosaic aesthetic (inspired by Paris street artist "Invader"), with varied colors per character type
- Weak keys are identified within the first few rounds
- Rounds adapt to target weaknesses
- Progress persists across browser sessions via localStorage
- Player sees measurable improvement over time

---

## App Structure & Navigation

### Screens

1. **Main Menu**: Start Game, Stats/Leaderboard, Settings, Recalibrate
2. **Interactive Demo** (first launch only): guided onboarding mini-round
3. **Calibration Summary** (after all calibration rounds): weakness ranking overview
4. **Gameplay**: the main game area with HUD
5. **Pause Menu**: overlay during gameplay (Escape key)
6. **Round End**: brief victory/defeat screen (1-2 seconds)
7. **Round Summary**: stats review between rounds
8. **Stats Screen**: full-screen per-key leaderboard
9. **Settings Screen**: accessible from main menu and pause menu

### Main Menu

- **Start Game**: begins calibration (first time) or practice (returning player)
- **Stats/Leaderboard**: opens full stats screen
- **Settings**: opens settings screen
- **Recalibrate**: confirmation dialog, then resets key profiles and restarts calibration

### Pause Menu (Escape during gameplay)

Overlay with options:
- **Resume**: returns to gameplay
- **Current Round Stats**: shows accuracy, kills, speed so far this round
- **Settings**: settings panel (changes apply immediately for speed; grape count and wave count apply next round)
- **Quit to Menu**: confirmation dialog ("Quit? Round progress will be lost."), then discards all round data and returns to main menu

---

## Game Concept

A grape cluster (with 24 grapes by default) sits at the center of the screen. Character invaders spawn from all edges and drift inward toward the grapes. Each invader displays a single character. When the player presses a key, the nearest invader displaying that character explodes. If an invader reaches the grape cluster, it damages it. Every 3 invaders that touch the grapes cause 1 grape to fall. When all grapes are gone, the round ends.

Rounds are themed around specific keys or key groups. Calibration rounds test all key groups to find weaknesses. Practice rounds drill the weakest keys.

---

## Scoreboard

### Round Score

Each round's score = **number of invaders destroyed** during that round. Simple and direct. No combo or streak multipliers.

### High Score

The all-time highest round score is displayed on screen during gameplay. Persisted in localStorage. Gives the player something to beat.

### Per-Key Leaderboard

For each key, track personal bests:
- **Best accuracy**: highest accuracy % achieved in any round featuring that key
- **Best speed**: fastest average reaction time for that key
- **Total kills**: lifetime count of invaders destroyed for that key

Accessible from the full stats screen.

---

## Settings (User-Adjustable)

| Setting | Default | Range | Applies |
|---------|---------|-------|---------|
| Starting grapes | 24 | 6-48 | Next round |
| Invader speed | Normal | Slow / Normal / Fast | Immediately |
| Max invaders per wave | 12 | 6-20 | Next round |
| Waves per round | 8 | 4-12 | Next round |

Settings are accessible from the main menu, HUD gear icon, and pause menu. Persisted in localStorage.

### Speed Presets

| Preset | Base Speed | Description |
|--------|-----------|-------------|
| Slow | 30 px/s | Relaxed pace for beginners |
| Normal | 50 px/s | Standard challenge |
| Fast | 80 px/s | For experienced typists |

Within a round, speed escalates by **+5 px/s per wave** on top of the base speed. This escalation applies in both calibration and practice modes.

---

## Core Concepts

### Key Profile

Every character has **one shared profile** regardless of which key group it belongs to. If a character appears in multiple groups (e.g., `.` in both "Bottom row" and "Python Core Symbols"), all performance data aggregates to the same profile.

Each profile tracks:
- **Accuracy**: percentage of correct hits (invader destroyed vs invader reached grapes)
- **Speed**: average reaction time in milliseconds from invader spawn to keypress
- **Trend**: direction and magnitude derived from **linear regression** on the last 10 data points per key. Displayed as: improving (green arrow up), declining (red arrow down), or stable (grey dash)

### Weakness Score

`weakness = (1 - accuracy) * 0.7 + normalizedSlowness * 0.3`

Higher weakness = more practice needed. Keys ranked by weakness score determine which rounds to play.

### Key Groups

| Group | Keys |
|-------|------|
| Home row | a s d f g h j k l ; |
| Top row | q w e r t y u i o p |
| Bottom row | z x c v b n m , . / |
| Numbers | 0-9 |
| Python Core Symbols | ( ) [ ] { } : = _ # @ . , |

Note: some characters appear in multiple groups. Their profiles are shared (see Key Profile above).

---

## Game Mechanics

### Keyboard Input

- Listen for the `key` property of `KeyboardEvent` (the actual character produced)
- Shifted characters work naturally: Shift+9 produces `(`, which matches a `(` invader
- Every keypress event is processed with **no cooldown or debounce** — rapid-fire typing of the same key is valid and rewarded
- Each press targets the next-nearest matching invader

### Invaders

- Each invader is a DOM element displaying a single character
- Invaders spawn at random positions along screen edges (top, bottom, left, right)
- They move in a straight line toward the grape cluster at the center
- Speed escalates per wave (+5 px/s per wave on top of the base speed)
- **Z-ordering**: invaders closer to the grape cluster render on top (higher z-index), making the most urgent threats visually prominent

#### Word-Based Batches

Invaders spawn in batches based on words:
- **Word sources**: Python keywords (`def`, `class`, `import`, `return`, `yield`, etc.) and common daily English words. Hardcoded list of **~600 words**.
- **Word selection**: words are chosen to contain the round's focus characters. E.g., if drilling `(` and `)`, pick words/snippets that include those characters.
- **Symbol-heavy rounds**: when focus keys are rare symbols (e.g., `@`, `#`, `{`, `}`), use **short code snippets** instead of words: `def()`, `x[i]`, `{k:v}`, `if x:`, `@dec`, `#comment`.
- **Batch spawning**: characters from the same word spawn near each other from the same screen edge, then **scatter** — each character takes its own independent path toward the center. They are NOT linked after spawn.
- **Staggered spawning**: within a wave, batches spawn every 1-2 seconds (not all at once).

### Targeting

- Player presses any key on the keyboard
- The nearest invader to the grape cluster center that matches the pressed key is destroyed (explodes)
- If no matching invader exists on screen, the keypress is a **miss** (recorded for accuracy)
- If multiple invaders share the same character, the one closest to center is targeted first
- Destroyed invaders are **immediately removed from targeting** (even while the explosion animation plays)

### Reaction Time Tracking

When multiple invaders with the same character are on screen, reaction time is measured from the **spawn time of the destroyed invader** (the one nearest to center) to the keypress. Only the destroyed invader's timing counts.

### Miss Feedback

An **accuracy ring** surrounds the grape cluster:
- Starts full (100%) at the beginning of each round
- Depletes on misses (keypresses with no matching invader on screen)
- Recovers slightly on hits
- Provides continuous visual feedback without per-miss disruption

### Grape Cluster

- Starts each round with a configurable number of grapes (default: 24, adjustable in settings)
- Positioned at the center of the screen
- **Collision detection**: an invader is absorbed when it enters a fixed radius around the screen center (the cluster's visual bounding radius + small margin). This radius stays **constant** regardless of how many grapes remain.
- **Fixed zone, variable density**: the cluster always occupies the same center area. With fewer grapes, they're more spread out. With more, they're packed tighter.
- A damage counter tracks absorbed invaders internally
- Every 3 absorbed invaders, 1 grape falls (burst animation). **No visible counter near the cluster** — only the HUD shows `Grapes: X/N`
- When grape count reaches 0, the round ends

### Waves

- A round consists of multiple waves (default: 8, configurable 4-12)
- Wave N spawns `3 + N` invaders where **N starts at 0** (wave 1 = 3 invaders, wave 2 = 4, ... wave 8 = 10)
- Invader count per wave is **capped** at the max invaders setting (default: 12, configurable 6-20)
- Invaders within a wave spawn **staggered** in small batches every 1-2 seconds
- **Auto-advance**: the next wave starts automatically after all invaders from the current wave are destroyed or absorbed
- Speed escalation: each wave adds +5 px/s to the base speed

### Round End

When a round ends (all waves cleared or grapes lost):
- **Waves cleared**: brief "ROUND CLEAR" celebration screen (1-2 seconds)
- **Grapes lost**: "GAME OVER" with dramatic animation (cluster shatters, 1-2 seconds)
- Then transitions to the round summary screen

### Round Outcome

After the round end screen:
- **Grapes survived**: count of remaining grapes (0 to max)
- **Accuracy**: characters correctly typed / total characters spawned
- **Speed**: average reaction time
- Key profiles updated with round data
- **3-2-1 countdown** before the next round begins

---

## Game Flow

### First Launch (No localStorage)

1. **Interactive Demo**: guided onboarding mini-round (see Onboarding below)
2. **Calibration Rounds**: one round per key group, in **randomized order**
3. After all 5 calibration rounds: **Calibration Summary** screen showing initial weakness ranking, strongest/weakest keys, overall accuracy, and a "Begin Practice" button
4. Transition to practice mode

### Onboarding (Interactive Demo)

First launch only. A mini practice round:
1. 5 slow invaders spawn **one at a time**
2. Prompt 1 (on first invader): "Type the character to destroy the invader!"
3. Prompt 2 (after 2nd destroyed): "Nice! Keep going."
4. Prompt 3 (when one gets close to grapes): "Watch out for the grapes!"
5. After all 5 resolved: "Ready? Let's calibrate!" button

### Calibration Rounds

- One round per key group (5 total): Home row, Top row, Bottom row, Numbers, Python Core Symbols
- Order is **randomized** each time calibration is triggered
- **Adaptive difficulty**: track rolling accuracy over the last 10 invaders
  - If accuracy > 90%: increase speed by 10%
  - If accuracy < 50%: decrease speed by 10%
  - Check triggers every 10 invaders
- Speed escalation per wave applies equally as in practice mode
- Standard wave count and grape count from settings

### Returning Player (localStorage exists)

1. Load key profiles and weakness rankings
2. Show main menu
3. "Start Game" jumps to practice mode, next round targets current weakest keys

### Practice Mode

1. Select top 3-5 weakest keys as **focus keys**
2. Generate round: **70% focus keys, 30% filler**
3. **Filler source**: the player's next-weakest keys (ranked 6-10). Still targeted practice, just lower priority.
4. Words/snippets are chosen to contain focus characters (see Word-Based Batches)
5. Play round
6. Update key profiles
7. Re-rank weaknesses
8. Repeat

### Recalibration

- Triggered from main menu "Recalibrate" button
- **Resets**: accuracy, speed, and trend for all key profiles
- **Keeps**: high score, total kills, round history (lifetime achievements preserved)
- Restarts calibration rounds from scratch (randomized order)

---

## Visual Design

### Layout

Game area **fills the entire browser viewport**. Invader positions, speeds, grape cluster, and all UI elements scale relative to window size.

```
+----------------------------------------------------------+
|  TypeCraft    HI:47  Score:32  WPM:45  +3/5rnd  [⚙] [Recal]|
+----------------------------------------------------------+
|  Weak: [ _ ] [ { ] [ ( ] [ : ] [ # ]                     |
+----------------------------------------------------------+
|                                                            |
|         (          a                                       |
|              [                                             |
|                    ●●●●●●                                  |
|                   ●●●●●●●    ◯ accuracy ring               |
|                    ●●●●●●                                  |
|           :        ●●●●●        )                          |
|                                                            |
|     _                         )                            |
|                                                            |
+----------------------------------------------------------+
|  Round 3: Python Symbols  |  Wave 4/8  |  Grapes: 20/24  |
+----------------------------------------------------------+
```

### Invaders

- Each invader uses a **pixel-art sprite** from a pool of **10-15 templates**
- Sprites are defined as **data arrays** (2D arrays of pixel colors, e.g., 8x8 grid). A single `SpriteRenderer` component reads the array and renders CSS grid cells
- Each invader gets a **randomly assigned** sprite template from the pool — the character text overlaid is the primary identifier
- The character is displayed prominently inside or below the sprite (monospace, 28px+)
- Color palette varies by character type:
  - **Letters**: cool tones (blues, teals, greens)
  - **Symbols**: warm/hot tones (reds, oranges, magentas) — so symbols visually stand out
  - **Numbers**: neutral tones (purples, greys)
- **Destroy animation**: pixel-scatter (squares fly outward and fade), **300ms duration**, **non-blocking** — input is never blocked during animations
- **Absorb animation**: brief red flash, sprite dissolves inward

### Grape Cluster

- Arranged in a natural cluster shape at center (honeycomb/bunch layout)
- **Fixed zone, variable density**: cluster always occupies the same center area. With fewer grapes they spread out; with more they pack tighter
- Each grape is a **styled DOM element** — a radial-gradient circle with highlight/shadow to look like a 3D sphere (deep purple `#6b2fa0` to dark `#2d1050`, with a white specular highlight)
- Grapes are connected by a thin stem/vine line (CSS) to give the cluster a natural bunch feel
- **NO emoji** — every grape is a distinct rendered element so the exact count is visually clear
- **Burst animation**: when a grape is lost, it ruptures — the sphere squashes, splits into juice droplets (small circles that spray outward with physics-like arcs), and the grape fades. Should feel visceral, not just a fade-out.
- Remaining grapes shift slightly to close the gap (subtle spring animation)
- **Accuracy ring**: circular progress ring surrounding the cluster. Full = 100% accuracy. Depletes on misses, recovers on hits.

### HUD (Heads-Up Display)

- **Top bar**: app name, high score, current round score, WPM, learning speed, settings gear, recalibrate button
- **Below top bar**: weak keys displayed as badges (top 5)
- **Bottom bar**: round info (focus, wave progress, grape count)

### Typography & Theme

- Dark background (#1a1a2e or similar dark navy)
- Invader characters: white/bright on colored badges, minimum 28px monospace
- Stats: 16-18px, muted colors
- Grapes: vibrant purple/green
- Destroyed invader: bright flash (white/yellow)

### Accessibility

- **Color-blind modes**: 2-3 alternative color palettes for common color vision deficiencies (deuteranopia, protanopia). Toggled in settings.

---

## Stats & Dashboard

### HUD Metrics (visible during gameplay)

- **High Score**: all-time best round score
- **Round Score**: invaders destroyed this round (live counter)
- **Current WPM**: Effective CPM / 5 (total characters spawned per minute of active gameplay, multiplied by accuracy). Rolling average over last 5 rounds.
- **Learning Speed**: WPM delta — difference between current WPM (avg of last 5 rounds) and previous WPM (avg of rounds 6-10). Displayed as "+X" or "-X". Requires 10+ rounds to display; show "—" before that.
- **Weak Links**: top 5 weakest keys as badges
- **Round Info**: current round focus, wave N of M, grapes remaining

### Round Summary (between rounds)

- Grapes survived: X / N
- Accuracy: X%
- Average reaction time: Xms
- Keys improved / Keys declined
- "Next round: [focus keys]" preview
- **3-2-1 countdown** auto-starts before the next round begins

### Stats Screen (Full Screen)

Accessible from main menu "Stats/Leaderboard" button. Contains a **sortable per-key table** with columns:

| Column | Description |
|--------|-------------|
| Key | The character |
| Accuracy % | Current accuracy |
| Avg Speed (ms) | Current average reaction time |
| Total Kills | Lifetime invaders destroyed |
| Best Accuracy | Personal best accuracy % |
| Best Speed | Personal best reaction time |
| Trend | Arrow indicator (improving/declining/stable) |

- Sortable by any column
- **Color-coded by weakness**: high weakness keys in red/warm tones, strong keys in green/cool tones
- Back button returns to main menu

---

## Persistence (localStorage)

### Schema Versioning

- All stored data includes a **schema version number**
- On version mismatch or JSON parse error: **wipe all data** and restart calibration
- Show a brief notice to the player: "Data format updated. Starting fresh calibration."

### Stored Data

- Schema version
- All Key Profiles (accuracy, speed, trend per key)
- Per-key personal bests (accuracy, speed, total kills)
- Weakness rankings
- High score (all-time best round score)
- Round history (timestamps, scores, focus keys, grapes survived)
- Current game state:
  - Calibration progress (which groups completed)
  - Current round focus keys
  - Mode (calibration / practice)
- Settings (grape count, invader speed, max invaders per wave, waves per round)
- Session-level stats (total rounds, total time)

### Resume Behavior

On app launch with existing data:
- Show main menu
- "Start Game" loads practice mode
- Next round targets current weakest keys

### Fresh Start

No data → interactive demo → calibration rounds.

---

## Non-Goals (Out of Scope)

- Online/cloud sync
- Multiplayer / leaderboards
- Sound effects
- Custom theme picker
- Languages other than Python symbols
- Mobile/touch support
- Backspace / undo during rounds
- Combo/streak scoring mechanics

---

## Technical Constraints

- **Stack**: React + TypeScript + Vite
- **Rendering**: DOM-based (CSS absolute positioning + transforms, animated with requestAnimationFrame)
- **Storage**: localStorage only (no backend)
- **Offline**: Must work without network after initial load
- **Testing**: Vitest + React Testing Library, TDD approach
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Performance**: Game loop via requestAnimationFrame, positions updated in refs to avoid excessive React re-renders
- **Viewport**: game fills entire browser viewport, all positions and sizes scale relative to window dimensions

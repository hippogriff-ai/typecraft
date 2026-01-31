import { test, expect } from '@playwright/test'

const RETURNING_PLAYER = {
  schemaVersion: 1,
  keyProfiles: {},
  roundHistory: [],
  calibrationProgress: {
    completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
    complete: true,
  },
  currentFocusKeys: ['a', 's', 'd', 'f'],
  mode: 'practice',
  settings: { grapeCount: 24, speedPreset: 'normal', maxInvadersPerWave: 12, wavesPerRound: 8 },
  highScore: 10,
}

/** Navigate and inject localStorage state, then reload so app picks it up. */
async function setupReturningPlayer(page: import('@playwright/test').Page, overrides = {}) {
  await page.goto('/')
  const state = JSON.stringify({ ...RETURNING_PLAYER, ...overrides })
  await page.evaluate((s) => localStorage.setItem('typecraft', s), state)
  await page.reload()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
}

/**
 * E2E: First launch — menu is shown with all navigation buttons.
 * Verifies the app loads and renders the main menu correctly.
 */
test('first launch shows main menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /typecraft/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /stats/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /settings/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /recalibrate/i })).toBeVisible()
})

/**
 * E2E: First launch Start Game → onboarding demo.
 * Spec: "First launch only. A mini practice round."
 */
test('first launch Start Game opens onboarding demo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByText(/type the character/i)).toBeVisible()
  await expect(page.getByTestId('demo-invader')).toBeVisible()
})

/**
 * E2E: Complete the onboarding demo by typing 5 characters → calibration.
 * Spec: "After all 5 resolved: Ready? Let's calibrate! button"
 */
test('completing demo leads to calibration', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('demo-invader')).toBeVisible()

  // The demo shows 5 invaders one at a time (a, s, d, f, j)
  const demoChars = ['a', 's', 'd', 'f', 'j']
  for (const char of demoChars) {
    await expect(page.getByTestId('demo-invader')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press(char)
    await page.waitForTimeout(300)
  }

  // After all 5, the "Ready? Let's calibrate!" button should appear
  await expect(page.getByRole('button', { name: /calibrate/i })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /calibrate/i }).click()

  // Should now be in playing screen with calibration mode
  await expect(page.getByTestId('game-board')).toBeVisible({ timeout: 5000 })
})

/**
 * E2E: Returning player skips demo/calibration, goes directly to playing.
 * Spec: "Returning player: Start Game jumps to practice mode"
 */
test('returning player goes directly to practice on Start Game', async ({ page }) => {
  await setupReturningPlayer(page)
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()
  await expect(page.getByText('HI:10')).toBeVisible()
})

/**
 * E2E: Navigation — stats screen and back.
 * Verifies menu → stats → back to menu navigation.
 */
test('navigate to stats screen and back', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /stats/i }).click()
  await expect(page.getByRole('button', { name: /back/i })).toBeVisible()
  await page.getByRole('button', { name: /back/i }).click()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
})

/**
 * E2E: Stats screen displays per-key data from persisted key profiles.
 * Verifies that the stats table renders actual game data (accuracy, kills, speed)
 * for keys that have recorded activity, not just navigation.
 */
test('stats screen displays per-key data from persisted profiles', async ({ page }) => {
  const profiles = {
    a: {
      key: 'a', totalAttempts: 20, correctAttempts: 18, lifetimeKills: 18,
      averageTimeMs: 250, bestAccuracy: 0.95, bestSpeedMs: 150, history: [],
    },
    s: {
      key: 's', totalAttempts: 15, correctAttempts: 6, lifetimeKills: 6,
      averageTimeMs: 500, bestAccuracy: 0, bestSpeedMs: 400, history: [],
    },
  }
  await setupReturningPlayer(page, {
    keyProfiles: profiles,
    totalRounds: 5,
    totalPlayTimeMs: 120000,
  })
  await page.getByRole('button', { name: /stats/i }).click()
  await expect(page.getByTestId('stats-screen')).toBeVisible()
  // Table should have rows for keys 'a' and 's'
  await expect(page.getByTestId('stat-row-a')).toBeVisible()
  await expect(page.getByTestId('stat-row-s')).toBeVisible()
  // Key 'a': 18/20 = 90% accuracy, 18 kills
  const rowA = page.getByTestId('stat-row-a')
  await expect(rowA).toContainText('90%')
  await expect(rowA).toContainText('18')
  // Key 's': 6/15 = 40% accuracy, 6 kills
  const rowS = page.getByTestId('stat-row-s')
  await expect(rowS).toContainText('40%')
  await expect(rowS).toContainText('6')
  // Session stats should be visible
  await expect(page.getByTestId('session-stats')).toContainText('5 rounds')
})

/**
 * E2E: Navigation — settings screen and back.
 * Verifies menu → settings → back to menu navigation.
 */
test('navigate to settings screen and back', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /settings/i }).click()
  await expect(page.getByRole('button', { name: /back/i })).toBeVisible()
  await expect(page.getByText(/24/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Normal' })).toBeVisible()
  await page.getByRole('button', { name: /back/i }).click()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
})

/**
 * E2E: Typing destroys invaders and increases score.
 * Spec: "Player presses any key → nearest matching invader destroyed"
 */
test('typing destroys invaders and score increases', async ({ page }) => {
  await setupReturningPlayer(page, { highScore: 0, settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  // Wait for invaders to spawn and be visible
  await expect(page.locator('.invader').first()).toBeVisible({ timeout: 3000 })

  // Score starts at 0
  await expect(page.getByText('Score:0')).toBeVisible()

  // Read an invader's character and type it
  const char = await page.locator('.invader').first().textContent()
  if (char) {
    await page.keyboard.press(char.trim())
    await page.waitForTimeout(100)
    await expect(page.getByText('Score:1')).toBeVisible()
  }
})

/**
 * E2E: Escape key opens pause menu with resume button.
 * Spec: "Escape key during gameplay opens a pause overlay"
 */
test('escape opens pause menu during gameplay', async ({ page }) => {
  await setupReturningPlayer(page, { settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByText(/paused/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /resume/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /quit/i })).toBeVisible()

  // Resume returns to gameplay
  await page.getByRole('button', { name: /resume/i }).click()
  await expect(page.getByText(/paused/i)).not.toBeVisible()
  await expect(page.getByTestId('game-board')).toBeVisible()
})

/**
 * E2E: Quit from pause menu returns to main menu.
 * Spec: "Quit to Menu: confirmation dialog, then discards round data"
 */
test('quit from pause returns to menu after confirmation', async ({ page }) => {
  await setupReturningPlayer(page, { settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /quit/i }).click()
  await expect(page.getByText(/round progress will be lost/i)).toBeVisible()

  await page.getByRole('button', { name: /confirm/i }).click()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
})

/**
 * E2E: Recalibrate resets to calibration mode.
 * Spec: "Recalibrate: resets accuracy, speed, and trend for all key profiles"
 */
test('recalibrate resets to calibration mode', async ({ page }) => {
  await setupReturningPlayer(page, { highScore: 42 })
  await page.getByRole('button', { name: /recalibrate/i }).click()
  // Confirmation dialog appears — must click Confirm to actually recalibrate
  await page.getByRole('button', { name: /confirm/i }).click()

  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()
  await expect(page.getByText(/calibration/i)).toBeVisible()
})

/**
 * E2E: localStorage persistence — state survives page reload.
 * Spec: "On app launch with existing data: Show main menu"
 */
test('state persists across page reload', async ({ page }) => {
  await setupReturningPlayer(page, { highScore: 99, settings: { ...RETURNING_PLAYER.settings, speedPreset: 'fast' } })

  await page.reload()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()

  // Verify persisted settings
  await page.getByRole('button', { name: /settings/i }).click()
  await expect(page.getByRole('button', { name: 'Fast' })).toBeVisible()
})

/**
 * E2E: Color-blind mode persists across page reload.
 * Spec: "Color-blind modes: 2-3 alternative color palettes for common
 * color vision deficiencies (deuteranopia, protanopia). Toggled in settings."
 */
test('color-blind mode setting persists across page reload', async ({ page }) => {
  await setupReturningPlayer(page, {
    settings: { ...RETURNING_PLAYER.settings, colorBlindMode: 'deuteranopia' },
  })

  await page.reload()
  await page.getByRole('button', { name: /settings/i }).click()
  await expect(page.getByRole('button', { name: /deuteranopia/i })).toHaveAttribute('aria-pressed', 'true')
})

/**
 * E2E: Grape cluster and accuracy ring are visible during gameplay.
 * Spec: "Grape cluster at center", "Accuracy ring surrounding the cluster"
 */
test('gameplay shows grape cluster and accuracy ring', async ({ page }) => {
  await setupReturningPlayer(page, { settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()

  await expect(page.getByTestId('game-board')).toBeVisible()
  await expect(page.getByTestId('grape-cluster')).toBeVisible()
  await expect(page.getByTestId('accuracy-ring')).toBeVisible()
  await expect(page.locator('[data-testid="grape"]')).toHaveCount(24)
})

/**
 * E2E: HUD displays all required information during gameplay.
 * Spec: "Top bar: app name, high score, current round score, WPM, learning speed"
 */
test('HUD displays game information', async ({ page }) => {
  await setupReturningPlayer(page, { highScore: 15 })
  await page.getByRole('button', { name: /start game/i }).click()

  await expect(page.getByText('TypeCraft')).toBeVisible()
  await expect(page.getByText('HI:15')).toBeVisible()
  await expect(page.getByText('Score:0')).toBeVisible()
  await expect(page.getByText(/WPM:/)).toBeVisible()
  await expect(page.getByText(/Wave 1\/8/)).toBeVisible()
  await expect(page.getByTestId('grape-count')).toHaveText('Grapes: 24/24')
})

/**
 * E2E: HUD recalibrate during gameplay shows confirmation overlay.
 * Regression test for iteration 38: recalibrate button previously called
 * recalibrate() directly without confirmation, leaving game in broken state.
 */
test('HUD recalibrate during gameplay shows confirmation overlay', async ({ page }) => {
  await setupReturningPlayer(page, { settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  // Click HUD recalibrate button
  await page.getByRole('button', { name: /recalibrate/i }).click()
  await expect(page.getByTestId('recalibrate-confirm-overlay')).toBeVisible()
  // Game board still behind overlay
  await expect(page.getByTestId('game-board')).toBeVisible()

  // Cancel returns to gameplay
  await page.getByRole('button', { name: /cancel/i }).click()
  await expect(page.getByTestId('recalibrate-confirm-overlay')).not.toBeVisible()
  await expect(page.getByTestId('game-board')).toBeVisible()
})

/**
 * E2E: HUD recalibrate confirm goes to main menu.
 * Verifies that confirming recalibration during gameplay properly resets
 * and returns to the main menu without breaking game state.
 */
test('HUD recalibrate confirm during gameplay goes to menu', async ({ page }) => {
  await setupReturningPlayer(page, { settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  await page.getByRole('button', { name: /recalibrate/i }).click()
  await page.getByRole('button', { name: /confirm/i }).click()
  await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
})

/**
 * E2E: Practice round completion — destroy all invaders, see round-end and
 * round-summary screens. This is the core gameplay loop.
 * Spec: "Round End: brief victory/defeat screen (1-2 seconds)" then
 *        "Round Summary: stats review between rounds"
 */
test('practice round completion shows round-end and round-summary', async ({ page }) => {
  // Use 1 wave with minimal invaders on slow speed for quick, reliable test
  await setupReturningPlayer(page, {
    settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow', wavesPerRound: 1, maxInvadersPerWave: 6 },
  })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  // Destroy invaders as they appear. Staggered spawning means batches arrive
  // over several seconds, so keep trying until round-end or summary appears.
  for (let attempt = 0; attempt < 40; attempt++) {
    // Check if we've reached round-end or round-summary (round is complete)
    const doneIndicator = page.getByTestId('round-end').or(page.getByText(/grapes survived/i))
    if (await doneIndicator.isVisible().catch(() => false)) break

    const invaders = page.locator('.invader')
    const count = await invaders.count()
    if (count > 0) {
      const char = await invaders.first().textContent()
      if (char?.trim()) {
        await page.keyboard.press(char.trim())
      }
      await page.waitForTimeout(150)
    } else {
      await page.waitForTimeout(500)
    }
  }

  // Round summary should appear (either directly or after round-end auto-dismiss)
  await expect(page.getByText(/grapes survived/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /next round/i })).toBeVisible()
})

/**
 * E2E: In-game settings overlay returns to gameplay on close.
 * Regression test for iteration 33: settings from HUD previously destroyed
 * the active round and returned to main menu instead of gameplay.
 */
test('HUD settings returns to gameplay on close', async ({ page }) => {
  await setupReturningPlayer(page, { settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow' } })
  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()

  // Open settings from HUD
  await page.getByRole('button', { name: /^settings$/i }).click()
  await expect(page.getByTestId('settings-screen')).toBeVisible()
  // Game board still behind overlay
  await expect(page.getByTestId('game-board')).toBeVisible()

  // Close settings
  await page.getByRole('button', { name: /back/i }).click()
  await expect(page.getByTestId('settings-screen')).not.toBeVisible()
  await expect(page.getByTestId('game-board')).toBeVisible()
  // Not on main menu
  await expect(page.getByRole('button', { name: /start game/i })).not.toBeVisible()
})

/**
 * E2E: Calibration gameplay — play through the last calibration round,
 * see calibration summary with stats, and begin practice mode.
 * Spec: "After all 5 calibration rounds: Calibration Summary screen
 *        showing initial weakness ranking, strongest/weakest keys,
 *        overall accuracy, and a 'Begin Practice' button"
 */
test('calibration round completion leads to calibration summary and practice', async ({ page }) => {
  // Set up state with 4/5 calibration groups done (pythonSymbols remaining)
  await setupReturningPlayer(page, {
    calibrationProgress: {
      completedGroups: ['homeRow', 'topRow', 'bottomRow', 'numbers'],
      complete: false,
    },
    calibrationOrder: ['homeRow', 'topRow', 'bottomRow', 'numbers', 'pythonSymbols'],
    mode: 'calibration',
    currentFocusKeys: ['(', ')', '[', ']', '{', '}', ':', '=', '_', '#', '@', '.', ','],
    settings: { ...RETURNING_PLAYER.settings, speedPreset: 'slow', wavesPerRound: 1, maxInvadersPerWave: 6 },
  })

  await page.getByRole('button', { name: /start game/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()
  await expect(page.getByText(/calibration/i)).toBeVisible()

  // Destroy invaders as they appear until the round ends
  for (let attempt = 0; attempt < 40; attempt++) {
    const doneIndicator = page.getByTestId('round-end').or(page.getByText(/grapes survived/i))
    if (await doneIndicator.isVisible().catch(() => false)) break

    const invaders = page.locator('.invader')
    const count = await invaders.count()
    if (count > 0) {
      const char = await invaders.first().textContent()
      if (char?.trim()) {
        await page.keyboard.press(char.trim())
      }
      await page.waitForTimeout(150)
    } else {
      await page.waitForTimeout(500)
    }
  }

  // Round summary should appear after round-end auto-dismiss
  await expect(page.getByText(/grapes survived/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /next round/i })).toBeVisible()

  // Click "Next Round" — last calibration group done, should show summary
  await page.getByRole('button', { name: /next round/i }).click()

  // Calibration summary with stats and begin practice button
  await expect(page.getByTestId('calibration-summary')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/calibration complete/i)).toBeVisible()
  await expect(page.getByTestId('overall-accuracy')).toBeVisible()
  await expect(page.getByRole('button', { name: /begin practice/i })).toBeVisible()

  // Begin practice → gameplay resumes in practice mode
  await page.getByRole('button', { name: /begin practice/i }).click()
  await expect(page.getByTestId('game-board')).toBeVisible()
})

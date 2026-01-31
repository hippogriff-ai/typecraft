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
  await expect(page.getByTestId('grape-count')).toHaveText('24/24')
})

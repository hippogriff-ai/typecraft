/**
 * Tests for the StatsScreen component.
 * Verifies key stat row rendering, accuracy display, trend indicators,
 * column sorting, and back button. Can be simplified if table columns change.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsScreen } from '../components/StatsScreen'

describe('StatsScreen', () => {
  const keyStats = [
    { key: 'a', accuracy: 0.95, avgSpeedMs: 200, totalKills: 50, bestAccuracy: 0.98, bestSpeedMs: 150, trend: 'improving' as const },
    { key: '(', accuracy: 0.40, avgSpeedMs: 800, totalKills: 10, bestAccuracy: 0.55, bestSpeedMs: 600, trend: 'declining' as const },
    { key: '5', accuracy: 0.70, avgSpeedMs: 400, totalKills: 25, bestAccuracy: 0.75, bestSpeedMs: 350, trend: 'stable' as const },
  ]

  it('renders a row for each key', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('(')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows accuracy as percentage', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('shows trend indicators', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    const rows = screen.getAllByTestId(/^stat-row-/)
    expect(rows.length).toBe(3)
  })

  it('sorts by column when header is clicked', async () => {
    const user = userEvent.setup()
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)

    await user.click(screen.getByRole('columnheader', { name: /^accuracy %$/i }))

    const rows = screen.getAllByTestId(/^stat-row-/)
    expect(within(rows[0]).getByText('(')).toBeInTheDocument()
  })

  /**
   * Spec: "Color-coded by weakness: high weakness keys in red/warm tones, strong keys in green/cool tones"
   * Rows with high accuracy should have green-tinted backgrounds, low accuracy should have red-tinted backgrounds.
   */
  it('color-codes rows by weakness (accuracy-based)', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    const strongRow = screen.getByTestId('stat-row-a')
    const weakRow = screen.getByTestId('stat-row-(')
    // Strong key (95% accuracy) should have green-dominant background
    expect(strongRow).toHaveStyle({ backgroundColor: expect.stringContaining('rgba(') })
    const strongBg = strongRow.style.backgroundColor
    const weakBg = weakRow.style.backgroundColor
    // Both should have background colors set
    expect(strongBg).toBeTruthy()
    expect(weakBg).toBeTruthy()
    // They should be different colors
    expect(strongBg).not.toBe(weakBg)
  })

  /**
   * Spec: "Trend: Arrow indicator — improving (green arrow up), declining (red arrow down), or stable (grey dash)"
   * Each trend indicator should be color-coded to match its direction.
   */
  it('color-codes trend arrows: green for improving, red for declining, grey for stable', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)
    const improvingRow = screen.getByTestId('stat-row-a')
    const decliningRow = screen.getByTestId('stat-row-(')
    const stableRow = screen.getByTestId('stat-row-5')

    const improvingTrend = within(improvingRow).getByTestId('trend-indicator')
    const decliningTrend = within(decliningRow).getByTestId('trend-indicator')
    const stableTrend = within(stableRow).getByTestId('trend-indicator')

    expect(improvingTrend.style.color).toContain('green')
    expect(decliningTrend.style.color).toContain('red')
    expect(stableTrend.style.color).toContain('grey')
  })

  /**
   * Spec: "Sortable by any column" — the Trend column must be sortable too.
   * Sorting by trend should order: declining (-1) → stable (0) → improving (1) ascending.
   */
  it('sorts by trend column when header is clicked', async () => {
    const user = userEvent.setup()
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} />)

    await user.click(screen.getByRole('columnheader', { name: /trend/i }))

    const rows = screen.getAllByTestId(/^stat-row-/)
    // Ascending: declining (-1) first → stable (0) → improving (1)
    expect(within(rows[0]).getByText('(')).toBeInTheDocument() // declining
    expect(within(rows[1]).getByText('5')).toBeInTheDocument() // stable
    expect(within(rows[2]).getByText('a')).toBeInTheDocument() // improving
  })

  /**
   * Spec: "Session-level stats (total rounds, total time)" under Stored Data.
   * The stats screen should display lifetime round count and total play time.
   */
  it('displays session-level stats (total rounds and total play time)', () => {
    render(<StatsScreen keyStats={keyStats} onBack={vi.fn()} totalRounds={42} totalPlayTimeMs={7380000} />)
    expect(screen.getByText(/42 rounds/i)).toBeInTheDocument()
    // 7380000ms = 2h 3m
    expect(screen.getByText(/2h 3m/)).toBeInTheDocument()
  })

  /**
   * Keys with 0 kills should show "—" for speed metrics (avg speed, best speed)
   * since "0ms" implies instant reaction time rather than "no data".
   */
  it('shows dash instead of 0ms for keys with no kills', () => {
    const stats = [
      { key: 'z', accuracy: 0, avgSpeedMs: 0, totalKills: 0, bestAccuracy: 0, bestSpeedMs: 0, trend: 'stable' as const },
    ]
    render(<StatsScreen keyStats={stats} onBack={vi.fn()} />)
    const row = screen.getByTestId('stat-row-z')
    const cells = within(row).getAllByRole('cell')
    // cells: key, accuracy, avg speed, kills, best acc, best speed, trend
    expect(cells[2]).toHaveTextContent('—')  // avg speed
    expect(cells[5]).toHaveTextContent('—')  // best speed
  })

  /** Shows "—" for bestAccuracy when not enough data (< 10 attempts, bestAccuracy = 0). */
  it('shows dash for bestAccuracy when value is zero', () => {
    const stats = [
      { key: 'a', accuracy: 0.5, avgSpeedMs: 200, totalKills: 3, bestAccuracy: 0, bestSpeedMs: 200, trend: 'stable' as const },
    ]
    render(<StatsScreen keyStats={stats} onBack={vi.fn()} />)
    const row = screen.getByTestId('stat-row-a')
    const cells = within(row).getAllByRole('cell')
    // cells: key, accuracy, avg speed, kills, best acc, best speed, trend
    expect(cells[4]).toHaveTextContent('—') // bestAccuracy = 0 → dash
  })

  /** Displays a helpful message when no key data exists (e.g., first launch). */
  it('shows empty state message when no key stats exist', () => {
    render(<StatsScreen keyStats={[]} onBack={vi.fn()} />)
    expect(screen.getByTestId('stats-empty')).toHaveTextContent('No data yet')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('has a back button', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<StatsScreen keyStats={keyStats} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})

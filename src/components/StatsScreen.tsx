import { useState } from 'react'

export interface KeyStat {
  key: string
  accuracy: number
  avgSpeedMs: number
  totalKills: number
  bestAccuracy: number
  bestSpeedMs: number
  trend: 'improving' | 'declining' | 'stable'
}

type SortColumn = 'key' | 'accuracy' | 'avgSpeedMs' | 'totalKills' | 'bestAccuracy' | 'bestSpeedMs' | 'trend'

interface StatsScreenProps {
  keyStats: KeyStat[]
  onBack: () => void
  totalRounds?: number
  totalPlayTimeMs?: number
}

function formatPlayTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function StatsScreen({ keyStats, onBack, totalRounds, totalPlayTimeMs }: StatsScreenProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('key')
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  const trendOrder: Record<string, number> = { improving: 1, stable: 0, declining: -1 }

  const sorted = [...keyStats].sort((a, b) => {
    if (sortCol === 'trend') {
      const aVal = trendOrder[a.trend] ?? 0
      const bVal = trendOrder[b.trend] ?? 0
      return sortAsc ? aVal - bVal : bVal - aVal
    }
    const aVal = a[sortCol]
    const bVal = b[sortCol]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  const trendArrow = (trend: KeyStat['trend']) => {
    switch (trend) {
      case 'improving': return { symbol: '\u2191', color: 'green' }
      case 'declining': return { symbol: '\u2193', color: 'red' }
      case 'stable': return { symbol: '\u2014', color: 'grey' }
    }
  }

  // Color-code rows by weakness: red (weak) → green (strong) based on accuracy
  const rowColor = (accuracy: number): string => {
    // accuracy 0→1 maps to red→green
    const r = Math.round(255 * (1 - accuracy))
    const g = Math.round(255 * accuracy)
    return `rgba(${r}, ${g}, 60, 0.15)`
  }

  return (
    <div className="stats-screen" data-testid="stats-screen">
      <h2>Key Statistics</h2>
      {(totalRounds != null && totalRounds > 0) && (
        <div className="session-stats" data-testid="session-stats">
          <span>{totalRounds} rounds</span>
          <span>{formatPlayTime(totalPlayTimeMs ?? 0)}</span>
        </div>
      )}
      {sorted.length === 0 ? (
        <p data-testid="stats-empty">No data yet. Complete some rounds to see your stats.</p>
      ) : (
      <table>
        <thead>
          <tr>
            <th scope="col" onClick={() => handleSort('key')}>Key</th>
            <th scope="col" onClick={() => handleSort('accuracy')}>Accuracy %</th>
            <th scope="col" onClick={() => handleSort('avgSpeedMs')}>Avg Speed (ms)</th>
            <th scope="col" onClick={() => handleSort('totalKills')}>Total Kills</th>
            <th scope="col" onClick={() => handleSort('bestAccuracy')}>Best Accuracy</th>
            <th scope="col" onClick={() => handleSort('bestSpeedMs')}>Best Speed</th>
            <th scope="col" onClick={() => handleSort('trend')}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((stat) => (
            <tr key={stat.key} data-testid={`stat-row-${stat.key}`} style={{ backgroundColor: rowColor(stat.accuracy) }}>
              <td>{stat.key}</td>
              <td>{Math.round(stat.accuracy * 100)}%</td>
              <td>{stat.totalKills > 0 ? `${stat.avgSpeedMs}ms` : '\u2014'}</td>
              <td>{stat.totalKills}</td>
              <td>{stat.bestAccuracy > 0 ? `${Math.round(stat.bestAccuracy * 100)}%` : '\u2014'}</td>
              <td>{stat.totalKills > 0 ? `${stat.bestSpeedMs}ms` : '\u2014'}</td>
              <td><span data-testid="trend-indicator" style={{ color: trendArrow(stat.trend).color }}>{trendArrow(stat.trend).symbol}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      <button onClick={onBack}>Back</button>
    </div>
  )
}

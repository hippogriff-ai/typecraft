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

type SortColumn = 'key' | 'accuracy' | 'avgSpeedMs' | 'totalKills' | 'bestAccuracy' | 'bestSpeedMs'

interface StatsScreenProps {
  keyStats: KeyStat[]
  onBack: () => void
}

export function StatsScreen({ keyStats, onBack }: StatsScreenProps) {
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

  const sorted = [...keyStats].sort((a, b) => {
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
      <table>
        <thead>
          <tr>
            <th role="columnheader" onClick={() => handleSort('key')}>Key</th>
            <th role="columnheader" onClick={() => handleSort('accuracy')}>Accuracy</th>
            <th role="columnheader" onClick={() => handleSort('avgSpeedMs')}>Avg Speed</th>
            <th role="columnheader" onClick={() => handleSort('totalKills')}>Kills</th>
            <th role="columnheader" onClick={() => handleSort('bestAccuracy')}>Best Acc</th>
            <th role="columnheader" onClick={() => handleSort('bestSpeedMs')}>Best Speed</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((stat) => (
            <tr key={stat.key} data-testid={`stat-row-${stat.key}`} style={{ backgroundColor: rowColor(stat.accuracy) }}>
              <td>{stat.key}</td>
              <td>{Math.round(stat.accuracy * 100)}%</td>
              <td>{stat.avgSpeedMs}ms</td>
              <td>{stat.totalKills}</td>
              <td>{Math.round(stat.bestAccuracy * 100)}%</td>
              <td>{stat.bestSpeedMs}ms</td>
              <td><span data-testid="trend-indicator" style={{ color: trendArrow(stat.trend).color }}>{trendArrow(stat.trend).symbol}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onBack}>Back</button>
    </div>
  )
}

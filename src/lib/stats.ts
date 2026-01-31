export interface SessionRecord {
  timestamp: number
  wpm: number
}

export interface RoundRecord {
  wpm: number
}

export function calculateWPM(opts: {
  charCount: number
  elapsedMs: number
  accuracy?: number
}): number {
  if (opts.elapsedMs === 0) return 0
  const acc = opts.accuracy ?? 1
  const charsPerMinute = (opts.charCount / opts.elapsedMs) * 60000
  return Math.round((charsPerMinute * acc) / 5)
}

export function calculateLearningSpeed(sessions: SessionRecord[]): number {
  if (sessions.length < 10) return 0

  const recent = sessions.slice(-5)
  const previous = sessions.slice(-10, -5)

  const recentAvg = recent.reduce((s, r) => s + r.wpm, 0) / recent.length
  const previousAvg = previous.reduce((s, r) => s + r.wpm, 0) / previous.length

  return Math.round(recentAvg - previousAvg)
}

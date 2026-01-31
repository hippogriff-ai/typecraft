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
}): number {
  if (opts.elapsedMs === 0) return 0
  const charsPerMinute = (opts.charCount / opts.elapsedMs) * 60000
  return Math.round(charsPerMinute / 5)
}

export function calculateLearningSpeed(sessions: SessionRecord[]): number {
  if (sessions.length < 2) return 0

  const first = sessions[0].wpm
  const last = sessions[sessions.length - 1].wpm
  return (last - first) / (sessions.length - 1)
}

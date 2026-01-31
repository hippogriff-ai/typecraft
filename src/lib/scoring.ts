export interface KeyPressRecord {
  correct: boolean
  timeMs: number
}

export interface KeyProfile {
  key: string
  totalAttempts: number
  correctAttempts: number
  averageTimeMs: number
  history: KeyPressRecord[]
}

export function createKeyProfile(key: string): KeyProfile {
  return {
    key,
    totalAttempts: 0,
    correctAttempts: 0,
    averageTimeMs: 0,
    history: [],
  }
}

export function recordKeyPress(
  profile: KeyProfile,
  press: KeyPressRecord,
): KeyProfile {
  const totalAttempts = profile.totalAttempts + 1
  const correctAttempts = profile.correctAttempts + (press.correct ? 1 : 0)
  const averageTimeMs =
    (profile.averageTimeMs * profile.totalAttempts + press.timeMs) / totalAttempts

  return {
    ...profile,
    totalAttempts,
    correctAttempts,
    averageTimeMs,
    history: [...profile.history, press],
  }
}

export function computeWeaknessScore(
  profile: KeyProfile,
  opts: { maxTimeMs: number },
): number {
  if (profile.totalAttempts === 0) return 1.0

  const accuracy = profile.correctAttempts / profile.totalAttempts
  const normalizedSlowness = Math.min(profile.averageTimeMs / opts.maxTimeMs, 1)

  return (1 - accuracy) * 0.7 + normalizedSlowness * 0.3
}

export type Trend = 'improving' | 'declining' | 'stable'

/**
 * Compute trend direction from the last 10 data points using linear regression.
 * Spec: "direction and magnitude derived from linear regression on the last 10 data points per key"
 * Returns 'improving' if slope > threshold, 'declining' if slope < -threshold, 'stable' otherwise.
 */
export function computeTrend(profile: KeyProfile): Trend {
  const recent = profile.history.slice(-10)
  if (recent.length < 3) return 'stable'

  // y values: 1 for correct, 0 for miss
  const n = recent.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    const y = recent[i].correct ? 1 : 0
    sumX += i
    sumY += y
    sumXY += i * y
    sumX2 += i * i
  }

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return 'stable'

  const slope = (n * sumXY - sumX * sumY) / denom

  // Threshold: ~5% change per data point is meaningful
  if (slope > 0.05) return 'improving'
  if (slope < -0.05) return 'declining'
  return 'stable'
}

export function rankWeaknesses(
  profiles: KeyProfile[],
  limit?: number,
): KeyProfile[] {
  const maxTimeMs = Math.max(
    ...profiles.map((p) => p.averageTimeMs),
    1,
  )
  const sorted = [...profiles].sort(
    (a, b) =>
      computeWeaknessScore(b, { maxTimeMs }) -
      computeWeaknessScore(a, { maxTimeMs }),
  )
  return limit !== undefined ? sorted.slice(0, limit) : sorted
}

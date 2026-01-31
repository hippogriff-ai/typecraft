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

import { KEY_GROUPS, ALL_KEYS } from './keys'
import type { KeyProfile } from './scoring'
import { computeWeaknessScore } from './scoring'

export interface RoundConfig {
  name: string
  focusKeys: string[]
  fillerKeys?: string[]
}

export function generateWaveChars(opts: {
  count: number
  focusKeys: string[]
  fillerKeys?: string[]
}): string[] {
  const focusCount = Math.round(opts.count * 0.7)
  const fillerCount = opts.count - focusCount
  const fillerPool = opts.fillerKeys ?? ALL_KEYS.filter((k) => !opts.focusKeys.includes(k))

  const chars: string[] = []

  for (let i = 0; i < focusCount; i++) {
    chars.push(opts.focusKeys[Math.floor(Math.random() * opts.focusKeys.length)])
  }
  for (let i = 0; i < fillerCount; i++) {
    chars.push(fillerPool[Math.floor(Math.random() * fillerPool.length)])
  }

  // Shuffle to mix focus and filler
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars
}

export function getCalibrationRounds(): RoundConfig[] {
  const groups: RoundConfig[] = Object.entries(KEY_GROUPS).map(
    ([name, keys]) => ({
      name,
      focusKeys: [...keys],
    }),
  )

  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[groups[i], groups[j]] = [groups[j], groups[i]]
  }

  return groups
}

export function getNextPracticeRound(
  profiles: Record<string, KeyProfile>,
): RoundConfig {
  const profileList = Object.values(profiles)

  const maxTimeMs = Math.max(...profileList.map((p) => p.averageTimeMs), 1)
  const ranked = [...profileList].sort(
    (a, b) =>
      computeWeaknessScore(b, { maxTimeMs }) -
      computeWeaknessScore(a, { maxTimeMs }),
  )

  const focusKeys = ranked.slice(0, 5).map((p) => p.key)
  const fillerKeys = ranked.slice(5, 10).map((p) => p.key)

  return {
    name: 'Practice',
    focusKeys,
    fillerKeys: fillerKeys.length > 0 ? fillerKeys : undefined,
  }
}

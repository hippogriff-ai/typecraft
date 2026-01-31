import { KEY_GROUPS } from './keys'
import type { KeyProfile } from './scoring'
import { computeWeaknessScore } from './scoring'

export interface RoundConfig {
  name: string
  focusKeys: string[]
  fillerKeys?: string[]
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

const HOME_ROW_DEFAULTS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']

export function getNextPracticeRound(
  profiles: Record<string, KeyProfile>,
): RoundConfig {
  const profileList = Object.values(profiles)

  if (profileList.length === 0) {
    return { name: 'Practice', focusKeys: HOME_ROW_DEFAULTS.slice(0, 5) }
  }

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

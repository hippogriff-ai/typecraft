export interface AccuracyRing {
  value: number
}

const MISS_PENALTY = 0.08
const HIT_RECOVERY = 0.02

export function createAccuracyRing(): AccuracyRing {
  return { value: 1.0 }
}

export function recordMiss(ring: AccuracyRing): AccuracyRing {
  return { value: Math.max(0, ring.value - MISS_PENALTY) }
}

export function recordHit(ring: AccuracyRing): AccuracyRing {
  return { value: Math.min(1.0, ring.value + HIT_RECOVERY) }
}

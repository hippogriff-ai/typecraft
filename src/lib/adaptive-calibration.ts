export interface CalibrationTracker {
  baseSpeed: number
  currentSpeed: number
  results: boolean[]
  adjustmentCount: number
}

export function createCalibrationTracker(baseSpeed: number): CalibrationTracker {
  return {
    baseSpeed,
    currentSpeed: baseSpeed,
    results: [],
    adjustmentCount: 0,
  }
}

export function recordCalibrationResult(
  tracker: CalibrationTracker,
  result: { correct: boolean },
): CalibrationTracker {
  const results = [...tracker.results, result.correct]
  let currentSpeed = tracker.currentSpeed
  let adjustmentCount = tracker.adjustmentCount

  if (results.length >= 10 && results.length % 10 === 0) {
    const last10 = results.slice(-10)
    const accuracy = last10.filter(Boolean).length / 10

    if (accuracy > 0.9) {
      currentSpeed = Math.min(currentSpeed * 1.1, tracker.baseSpeed * 2)
      adjustmentCount++
    } else if (accuracy < 0.5) {
      currentSpeed = Math.max(currentSpeed * 0.9, tracker.baseSpeed * 0.5)
      adjustmentCount++
    }
  }

  return { ...tracker, results, currentSpeed, adjustmentCount }
}

export function getAdaptedSpeed(tracker: CalibrationTracker): number {
  return tracker.currentSpeed
}

/**
 * Tests for the accuracy ring state machine.
 * Verifies ring starts at 1.0, depletes on misses, recovers on hits, and stays in [0, 1] bounds.
 * Can be simplified if miss/hit values change — only boundary behavior matters.
 */
import { describe, it, expect } from 'vitest'
import { createAccuracyRing, recordHit, recordMiss } from '../lib/accuracy-ring'

describe('accuracy ring', () => {
  it('starts at 1.0', () => {
    const ring = createAccuracyRing()
    expect(ring.value).toBe(1.0)
  })

  it('depletes on a miss', () => {
    let ring = createAccuracyRing()
    ring = recordMiss(ring)
    expect(ring.value).toBeLessThan(1.0)
  })

  it('recovers slightly on a hit', () => {
    let ring = createAccuracyRing()
    ring = recordMiss(ring)
    ring = recordMiss(ring)
    const afterMisses = ring.value
    ring = recordHit(ring)
    expect(ring.value).toBeGreaterThan(afterMisses)
  })

  it('never goes below 0', () => {
    let ring = createAccuracyRing()
    for (let i = 0; i < 100; i++) {
      ring = recordMiss(ring)
    }
    expect(ring.value).toBeGreaterThanOrEqual(0)
  })

  it('never goes above 1.0', () => {
    let ring = createAccuracyRing()
    for (let i = 0; i < 100; i++) {
      ring = recordHit(ring)
    }
    expect(ring.value).toBeLessThanOrEqual(1.0)
  })

  it('starts full and depletes proportionally', () => {
    let ring = createAccuracyRing()
    const after1Miss = recordMiss(ring)
    const after2Misses = recordMiss(after1Miss)
    expect(after2Misses.value).toBeLessThan(after1Miss.value)
  })
})

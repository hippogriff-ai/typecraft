import { describe, it, expect } from 'vitest'
import { generateSequence, generateCalibrationSequence } from '../lib/generator'

describe('generateSequence', () => {
  it('returns a string of specified length', () => {
    const seq = generateSequence({ weakKeys: ['(', ')'], length: 12 })
    expect(seq.length).toBe(12)
  })

  it('heavily features the weak keys', () => {
    const seq = generateSequence({ weakKeys: ['(', ')'], length: 50 })
    const weakCount = seq.split('').filter((c) => c === '(' || c === ')').length
    // At least 60% should be weak keys
    expect(weakCount / seq.length).toBeGreaterThanOrEqual(0.6)
  })

  it('includes some non-weak keys for realistic typing', () => {
    const seq = generateSequence({ weakKeys: ['('], length: 50 })
    const nonWeak = seq.split('').filter((c) => c !== '(').length
    expect(nonWeak).toBeGreaterThan(0)
  })
})

describe('generateCalibrationSequence', () => {
  it('returns a sequence for a single key repeated N times', () => {
    const seq = generateCalibrationSequence('a', 5)
    expect(seq).toBe('aaaaa')
  })

  it('works for symbol keys', () => {
    const seq = generateCalibrationSequence('(', 3)
    expect(seq).toBe('(((')
  })
})

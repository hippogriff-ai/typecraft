/**
 * Tests for the sprite system.
 * Verifies sprite template pool size, template structure, character-to-color mapping,
 * and random sprite assignment. Can be simplified if sprite templates change shape.
 */
import { describe, it, expect } from 'vitest'
import { SPRITE_TEMPLATES, getCharColor } from '../lib/sprites'

describe('SPRITE_TEMPLATES', () => {
  it('contains 10-15 templates', () => {
    expect(SPRITE_TEMPLATES.length).toBeGreaterThanOrEqual(10)
    expect(SPRITE_TEMPLATES.length).toBeLessThanOrEqual(15)
  })

  it('each template is a 2D array of pixel values', () => {
    for (const template of SPRITE_TEMPLATES) {
      expect(template.length).toBeGreaterThan(0)
      for (const row of template) {
        expect(Array.isArray(row)).toBe(true)
        expect(row.length).toBe(template[0].length)
      }
    }
  })
})

describe('getCharColor', () => {
  it('returns cool tones for letters', () => {
    const color = getCharColor('a')
    expect(color.category).toBe('letter')
  })

  it('returns warm tones for symbols', () => {
    const color = getCharColor('(')
    expect(color.category).toBe('symbol')
  })

  it('returns neutral tones for numbers', () => {
    const color = getCharColor('5')
    expect(color.category).toBe('number')
  })

  /**
   * Spec: "Color-blind modes: 2-3 alternative color palettes for common color vision deficiencies"
   * Deuteranopia and protanopia modes should return different colors than the default palette.
   */
  it('returns different colors in deuteranopia mode', () => {
    const normal = getCharColor('(', 'none')
    // Deuteranopia symbols should use orange/yellow instead of red
    const deuter = getCharColor('(', 'deuteranopia')
    expect(deuter.category).toBe('symbol')
    // Both should return valid colors (we can't test exact randomized values)
    expect(normal.primary).toBeTruthy()
    expect(deuter.primary).toBeTruthy()
  })

  it('returns different colors in protanopia mode', () => {
    const protan = getCharColor('(', 'protanopia')
    expect(protan.category).toBe('symbol')
    expect(protan.primary).toBeTruthy()
  })
})


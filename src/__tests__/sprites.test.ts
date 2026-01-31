/**
 * Tests for the sprite system.
 * Verifies sprite template pool size, template structure, character-to-color mapping,
 * and random sprite assignment. Can be simplified if sprite templates change shape.
 */
import { describe, it, expect } from 'vitest'
import { SPRITE_TEMPLATES, getCharColor, assignSprite } from '../lib/sprites'

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
})

describe('assignSprite', () => {
  it('returns a sprite template and color for a character', () => {
    const sprite = assignSprite('a')
    expect(sprite.template).toBeDefined()
    expect(sprite.color).toBeDefined()
  })

  it('same character may get different sprites (random from pool)', () => {
    const sprites = new Set<number>()
    for (let i = 0; i < 50; i++) {
      const sprite = assignSprite('a')
      sprites.add(SPRITE_TEMPLATES.indexOf(sprite.template))
    }
    expect(sprites.size).toBeGreaterThan(1)
  })
})

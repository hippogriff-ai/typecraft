/**
 * Tests for the word list and code snippet system.
 * Verifies word pool size, Python keyword presence, snippet structure,
 * and focus-key-based word selection. Can be simplified if word list changes.
 */
import { describe, it, expect } from 'vitest'
import { WORDS, CODE_SNIPPETS, selectWordsForFocus } from '../lib/word-list'

describe('WORDS', () => {
  it('contains approximately 600 words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(500)
    expect(WORDS.length).toBeLessThanOrEqual(700)
  })

  /**
   * All words must be lowercase. Invader chars are compared directly to
   * lowercased keypress input, so uppercase chars create unhittable invaders.
   */
  it('contains only lowercase characters', () => {
    for (const word of WORDS) {
      expect(word).toBe(word.toLowerCase())
    }
  })

  it('includes Python keywords', () => {
    const pythonKeywords = ['def', 'class', 'import', 'return', 'yield', 'lambda', 'if', 'else', 'for', 'while']
    for (const kw of pythonKeywords) {
      expect(WORDS).toContain(kw)
    }
  })
})

describe('CODE_SNIPPETS', () => {
  it('contains short code fragments with symbols', () => {
    expect(CODE_SNIPPETS.length).toBeGreaterThan(10)
    for (const snippet of CODE_SNIPPETS) {
      expect(snippet.length).toBeLessThanOrEqual(10)
    }
  })

  it('includes bracket/symbol-heavy snippets', () => {
    const allSnippets = CODE_SNIPPETS.join('')
    expect(allSnippets).toContain('(')
    expect(allSnippets).toContain('[')
    expect(allSnippets).toContain('{')
    expect(allSnippets).toContain('@')
    expect(allSnippets).toContain('#')
  })
})

describe('selectWordsForFocus', () => {
  it('returns words containing at least one focus character', () => {
    const words = selectWordsForFocus({ focusKeys: ['x'], count: 5 })
    for (const word of words) {
      expect(word).toMatch(/x/)
    }
  })

  it('uses code snippets when focus keys are all symbols', () => {
    const words = selectWordsForFocus({ focusKeys: ['(', ')', '{', '}'], count: 5 })
    expect(words.length).toBe(5)
    for (const word of words) {
      const hasFocus = ['(', ')', '{', '}'].some((k) => word.includes(k))
      expect(hasFocus).toBe(true)
    }
  })

  it('falls back to individual characters when no words match', () => {
    const words = selectWordsForFocus({ focusKeys: ['@'], count: 3 })
    expect(words.length).toBe(3)
  })

  /**
   * When focus keys are a mix of letters and symbols (e.g., ['z', ';', ',']),
   * the old implementation searched only WORDS (because 'z' is alphanumeric).
   * But WORDS don't contain symbols like ';' or ',', so those focus keys
   * never appeared in word-derived batches. Fix: always search both pools
   * (WORDS + CODE_SNIPPETS), combining matches so symbol-containing snippets
   * like 'a,b' and 'x;y' are included alongside letter-containing words.
   */
  it('finds matches from both WORDS and CODE_SNIPPETS for mixed letter+symbol focus keys', () => {
    const words = selectWordsForFocus({ focusKeys: ['z', ',', '.'], count: 20 })
    expect(words.length).toBe(20)
    // Should contain at least some snippet matches (for ',' and '.')
    // and some word matches (for 'z')
    const hasSnippetMatch = words.some((w) => w.includes(',') || w.includes('.'))
    const hasWordMatch = words.some((w) => w.includes('z'))
    expect(hasSnippetMatch).toBe(true)
    expect(hasWordMatch).toBe(true)
  })

  /**
   * Empty focusKeys could happen if practice round selection fails or state
   * is corrupted. Without a guard, Math.random() * 0 = NaN, producing
   * undefined values in the returned array.
   */
  it('returns valid strings when focusKeys is empty', () => {
    const words = selectWordsForFocus({ focusKeys: [], count: 3 })
    expect(words.length).toBe(3)
    for (const word of words) {
      expect(typeof word).toBe('string')
      expect(word.length).toBeGreaterThan(0)
    }
  })
})

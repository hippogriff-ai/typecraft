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
})

export type SpriteTemplate = number[][]

export interface CharColor {
  primary: string
  secondary: string
  category: 'letter' | 'symbol' | 'number'
}

export interface AssignedSprite {
  template: SpriteTemplate
  color: CharColor
}

export const SPRITE_TEMPLATES: SpriteTemplate[] = [
  // 8x8 pixel art invader templates
  [
    [0,0,1,0,0,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,0,1],
    [1,0,1,0,0,1,0,1],
    [0,0,0,1,1,0,0,0],
  ],
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1],
  ],
  [
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
  ],
  [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
  ],
  [
    [0,0,0,1,1,0,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,0],
  ],
  [
    [1,0,0,0,0,0,0,1],
    [0,1,0,1,1,0,1,0],
    [0,0,1,1,1,1,0,0],
    [0,1,0,1,1,0,1,0],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
  ],
  [
    [0,0,1,0,0,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,0,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
  ],
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,0,1],
    [1,0,1,0,0,1,0,1],
    [0,0,0,1,1,0,0,0],
    [0,0,1,0,0,1,0,0],
  ],
  [
    [0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,0,0,1,1,0,0,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
  ],
  [
    [0,1,0,0,0,0,1,0],
    [1,0,1,0,0,1,0,1],
    [1,0,1,1,1,1,0,1],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
  ],
  [
    [0,0,1,0,0,1,0,0],
    [0,0,0,1,1,0,0,0],
    [1,1,1,1,1,1,1,1],
    [1,0,1,0,0,1,0,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,0,0,0,0,1,1],
  ],
  [
    [0,0,0,1,1,0,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,0,0,0,1,1],
    [1,0,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1],
  ],
]

import type { ColorBlindMode } from './settings'

const LETTER_COLORS: CharColor[] = [
  { primary: '#4fc3f7', secondary: '#0288d1', category: 'letter' },
  { primary: '#4dd0e1', secondary: '#00838f', category: 'letter' },
  { primary: '#81c784', secondary: '#388e3c', category: 'letter' },
  { primary: '#4db6ac', secondary: '#00695c', category: 'letter' },
]

const SYMBOL_COLORS: CharColor[] = [
  { primary: '#ff7043', secondary: '#d84315', category: 'symbol' },
  { primary: '#ef5350', secondary: '#c62828', category: 'symbol' },
  { primary: '#ec407a', secondary: '#ad1457', category: 'symbol' },
  { primary: '#ffa726', secondary: '#ef6c00', category: 'symbol' },
]

const NUMBER_COLORS: CharColor[] = [
  { primary: '#ab47bc', secondary: '#6a1b9a', category: 'number' },
  { primary: '#78909c', secondary: '#37474f', category: 'number' },
  { primary: '#9575cd', secondary: '#4527a0', category: 'number' },
]

// Deuteranopia-safe palette: blue vs orange (avoids red-green confusion)
const DEUTER_LETTER_COLORS: CharColor[] = [
  { primary: '#64b5f6', secondary: '#1565c0', category: 'letter' },
  { primary: '#42a5f5', secondary: '#0d47a1', category: 'letter' },
  { primary: '#90caf9', secondary: '#1976d2', category: 'letter' },
]

const DEUTER_SYMBOL_COLORS: CharColor[] = [
  { primary: '#ffa726', secondary: '#e65100', category: 'symbol' },
  { primary: '#ffb74d', secondary: '#ef6c00', category: 'symbol' },
  { primary: '#ffcc02', secondary: '#f57f17', category: 'symbol' },
]

const DEUTER_NUMBER_COLORS: CharColor[] = [
  { primary: '#b0bec5', secondary: '#546e7a', category: 'number' },
  { primary: '#cfd8dc', secondary: '#455a64', category: 'number' },
]

// Protanopia-safe palette: blue vs yellow (avoids red confusion)
const PROTAN_LETTER_COLORS: CharColor[] = [
  { primary: '#4fc3f7', secondary: '#0277bd', category: 'letter' },
  { primary: '#4dd0e1', secondary: '#006064', category: 'letter' },
  { primary: '#80deea', secondary: '#00838f', category: 'letter' },
]

const PROTAN_SYMBOL_COLORS: CharColor[] = [
  { primary: '#fdd835', secondary: '#f9a825', category: 'symbol' },
  { primary: '#ffee58', secondary: '#f57f17', category: 'symbol' },
  { primary: '#fff176', secondary: '#fbc02d', category: 'symbol' },
]

const PROTAN_NUMBER_COLORS: CharColor[] = [
  { primary: '#b0bec5', secondary: '#546e7a', category: 'number' },
  { primary: '#90a4ae', secondary: '#37474f', category: 'number' },
]

function getPalette(mode: ColorBlindMode) {
  switch (mode) {
    case 'deuteranopia':
      return { letter: DEUTER_LETTER_COLORS, symbol: DEUTER_SYMBOL_COLORS, number: DEUTER_NUMBER_COLORS }
    case 'protanopia':
      return { letter: PROTAN_LETTER_COLORS, symbol: PROTAN_SYMBOL_COLORS, number: PROTAN_NUMBER_COLORS }
    default:
      return { letter: LETTER_COLORS, symbol: SYMBOL_COLORS, number: NUMBER_COLORS }
  }
}

function isLetter(char: string): boolean {
  return /^[a-zA-Z]$/.test(char)
}

function isNumber(char: string): boolean {
  return /^[0-9]$/.test(char)
}

export function getCharColor(char: string, mode: ColorBlindMode = 'none'): CharColor {
  const palette = getPalette(mode)
  if (isLetter(char)) {
    return palette.letter[Math.floor(Math.random() * palette.letter.length)]
  }
  if (isNumber(char)) {
    return palette.number[Math.floor(Math.random() * palette.number.length)]
  }
  return palette.symbol[Math.floor(Math.random() * palette.symbol.length)]
}

export function assignSprite(char: string): AssignedSprite {
  const template =
    SPRITE_TEMPLATES[Math.floor(Math.random() * SPRITE_TEMPLATES.length)]
  const color = getCharColor(char)
  return { template, color }
}

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

function isLetter(char: string): boolean {
  return /^[a-zA-Z]$/.test(char)
}

function isNumber(char: string): boolean {
  return /^[0-9]$/.test(char)
}

export function getCharColor(char: string): CharColor {
  if (isLetter(char)) {
    return LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)]
  }
  if (isNumber(char)) {
    return NUMBER_COLORS[Math.floor(Math.random() * NUMBER_COLORS.length)]
  }
  return SYMBOL_COLORS[Math.floor(Math.random() * SYMBOL_COLORS.length)]
}

export function assignSprite(char: string): AssignedSprite {
  const template =
    SPRITE_TEMPLATES[Math.floor(Math.random() * SPRITE_TEMPLATES.length)]
  const color = getCharColor(char)
  return { template, color }
}

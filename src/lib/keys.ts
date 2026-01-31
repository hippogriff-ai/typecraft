export const KEY_GROUPS = {
  homeRow: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  topRow: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  bottomRow: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  pythonSymbols: ['(', ')', '[', ']', '{', '}', ':', '=', '_', '#', '@', '.', ','],
} as const

export const KEY_GROUP_DISPLAY_NAMES: Record<string, string> = {
  homeRow: 'Home Row',
  topRow: 'Top Row',
  bottomRow: 'Bottom Row',
  numbers: 'Numbers',
  pythonSymbols: 'Python Symbols',
}

export const ALL_KEYS: string[] = [
  ...new Set(Object.values(KEY_GROUPS).flat()),
]

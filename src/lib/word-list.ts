export const WORDS: string[] = [
  // Python keywords
  'def', 'class', 'import', 'from', 'return', 'yield', 'lambda', 'if', 'elif', 'else',
  'for', 'while', 'break', 'continue', 'pass', 'try', 'except', 'finally', 'raise', 'with',
  'as', 'assert', 'async', 'await', 'del', 'global', 'nonlocal', 'in', 'is', 'not',
  'and', 'or', 'true', 'false', 'none',
  // Python builtins
  'print', 'len', 'range', 'list', 'dict', 'set', 'tuple', 'str', 'int', 'float',
  'bool', 'type', 'super', 'self', 'init', 'main', 'open', 'close', 'read', 'write',
  'append', 'extend', 'insert', 'remove', 'pop', 'sort', 'reverse', 'copy', 'clear',
  'items', 'keys', 'values', 'update', 'get', 'join', 'split', 'strip', 'replace',
  'find', 'index', 'count', 'format', 'map', 'filter', 'zip', 'enumerate', 'sum',
  'min', 'max', 'abs', 'round', 'sorted', 'reversed', 'any', 'all', 'isinstance',
  'hasattr', 'getattr', 'setattr', 'callable', 'property', 'staticmethod', 'classmethod',
  'input', 'output', 'file', 'path', 'name', 'value', 'data', 'result', 'error',
  // Common English words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'these',
  'give', 'day', 'most', 'us', 'great', 'between', 'need', 'large', 'often', 'last',
  'long', 'small', 'change', 'move', 'light', 'each', 'point', 'home', 'many', 'high',
  'place', 'old', 'end', 'hand', 'part', 'turn', 'start', 'show', 'every', 'world',
  'much', 'head', 'help', 'line', 'state', 'still', 'own', 'night', 'real', 'left',
  'number', 'school', 'never', 'become', 'again', 'story', 'city', 'right', 'under', 'same',
  'body', 'young', 'week', 'group', 'side', 'both', 'run', 'few', 'house', 'next',
  'while', 'case', 'keep', 'eye', 'fact', 'door', 'might', 'room', 'child', 'very',
  'game', 'system', 'power', 'word', 'water', 'money', 'learn', 'play', 'food', 'book',
  'family', 'social', 'idea', 'person', 'music', 'best', 'sure', 'call', 'woman', 'country',
  'study', 'problem', 'area', 'during', 'until', 'away', 'enough', 'early', 'face', 'form',
  'since', 'table', 'land', 'level', 'being', 'today', 'question', 'company', 'across', 'name',
  // Programming words
  'code', 'function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'null',
  'loop', 'condition', 'method', 'module', 'package', 'server', 'client', 'request', 'response',
  'database', 'query', 'token', 'parse', 'build', 'test', 'debug', 'deploy', 'config',
  'async', 'sync', 'callback', 'promise', 'event', 'handler', 'listener', 'context',
  'scope', 'closure', 'prototype', 'instance', 'constructor', 'interface', 'abstract',
  'virtual', 'static', 'public', 'private', 'protected', 'final', 'const', 'let',
  'throw', 'catch', 'error', 'stack', 'trace', 'buffer', 'stream', 'pipe', 'queue',
  'cache', 'memory', 'thread', 'process', 'signal', 'socket', 'port', 'host', 'route',
  'middleware', 'template', 'render', 'component', 'prop', 'state', 'hook', 'effect',
  'reducer', 'action', 'store', 'dispatch', 'subscribe', 'provider', 'consumer',
  // More common words to reach ~600
  'able', 'above', 'accept', 'according', 'account', 'act', 'add', 'address', 'age', 'ago',
  'agree', 'air', 'allow', 'almost', 'along', 'already', 'although', 'always', 'among', 'amount',
  'animal', 'another', 'answer', 'appear', 'apply', 'art', 'ask', 'assume', 'attack', 'attention',
  'available', 'avoid', 'bad', 'base', 'beat', 'beautiful', 'bed', 'before', 'begin', 'behind',
  'believe', 'below', 'benefit', 'big', 'bit', 'black', 'blood', 'blue', 'board', 'boy',
  'break', 'bring', 'brother', 'building', 'business', 'buy', 'card', 'care', 'carry', 'cause',
  'center', 'central', 'certain', 'chair', 'challenge', 'character', 'charge', 'check', 'choice',
  'church', 'citizen', 'claim', 'clear', 'close', 'cold', 'collection', 'college', 'color',
  'common', 'community', 'compare', 'computer', 'concern', 'contain', 'control', 'cost', 'couple',
  'course', 'court', 'cover', 'create', 'crime', 'cultural', 'cup', 'current', 'cut', 'dark',
  'daughter', 'dead', 'deal', 'death', 'decade', 'decide', 'decision', 'deep', 'defense',
  'degree', 'democrat', 'design', 'despite', 'detail', 'develop', 'die', 'difference', 'difficult',
  'dinner', 'direction', 'discover', 'discuss', 'disease', 'doctor', 'dog', 'draw', 'dream', 'drive',
  'drop', 'drug', 'eat', 'economy', 'edge', 'education', 'effort', 'eight', 'either', 'election',
  'employee', 'energy', 'enjoy', 'enter', 'entire', 'environment', 'especially', 'establish', 'evening',
  'everyone', 'everything', 'evidence', 'exactly', 'example', 'executive', 'exist', 'expect',
  'experience', 'explain', 'fail', 'fall', 'far', 'father', 'fear', 'feel', 'field',
  'fight', 'figure', 'fill', 'fine', 'financial', 'finger', 'finish', 'fire', 'firm', 'fish',
  'five', 'floor', 'fly', 'follow', 'foot', 'force', 'foreign', 'forget', 'forward', 'four',
  'free', 'friend', 'front', 'full', 'fund', 'future', 'garden', 'gas', 'general', 'generation',
  'girl', 'glass', 'goal', 'gold', 'gone', 'government', 'green', 'ground', 'grow', 'growth',
  'guess', 'gun', 'guy', 'hair', 'half', 'hang', 'happen', 'happy', 'hard',
  'hear', 'heart', 'heavy', 'hit', 'hold', 'hope', 'hot', 'huge', 'human',
  'hundred', 'indicate', 'image', 'impact', 'important', 'improve', 'include', 'increase', 'indeed',
]

export const CODE_SNIPPETS: string[] = [
  'def()',
  'x[i]',
  '{k:v}',
  'if x:',
  '@dec',
  '#note',
  'f(x)',
  'a[0]',
  '{a:b}',
  'fn()',
  'x.y',
  'a,b',
  'i+=1',
  'x=0',
  'n!=0',
  'a==b',
  'x>=y',
  'x<=y',
  'd[k]',
  '(a,b)',
  'a/b',
  'x;y',
  'a;b',
]

export function selectWordsForFocus(opts: {
  focusKeys: string[]
  count: number
}): string[] {
  if (opts.focusKeys.length === 0) {
    return Array.from({ length: opts.count }, () => 'a')
  }

  // Search both WORDS and CODE_SNIPPETS pools, combining matches.
  // This ensures mixed letter+symbol focus keys (e.g., ['z', ';', ','])
  // find relevant words for letters AND code snippets for symbols.
  const wordMatches = WORDS.filter((word) =>
    opts.focusKeys.some((key) => word.includes(key)),
  )
  const snippetMatches = CODE_SNIPPETS.filter((snippet) =>
    opts.focusKeys.some((key) => snippet.includes(key)),
  )
  const matching = [...wordMatches, ...snippetMatches]

  if (matching.length === 0) {
    return Array.from({ length: opts.count }, () =>
      opts.focusKeys[Math.floor(Math.random() * opts.focusKeys.length)],
    )
  }

  const result: string[] = []
  for (let i = 0; i < opts.count; i++) {
    result.push(matching[Math.floor(Math.random() * matching.length)])
  }
  return result
}

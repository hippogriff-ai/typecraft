interface RoundEndProps {
  result: 'cleared' | 'grapes_lost'
  onDone: () => void
}

export function RoundEnd({ result, onDone }: RoundEndProps) {
  return (
    <div className="round-end" data-testid="round-end" onClick={onDone}>
      <h1>{result === 'cleared' ? 'ROUND CLEAR' : 'GAME OVER'}</h1>
    </div>
  )
}

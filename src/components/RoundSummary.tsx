interface RoundSummaryProps {
  grapesLeft: number
  maxGrapes: number
  accuracy: number
  avgReactionMs: number
  roundScore: number
  highScore: number
  isNewHighScore: boolean
  focusKeys: string[]
  nextFocusKeys: string[]
  keysImproved?: string[]
  keysDefined?: string[]
  onNextRound: () => void
}

export function RoundSummary(props: RoundSummaryProps) {
  const keysDeclined = (props.keysDefined ?? []).filter(
    (k) => !(props.keysImproved ?? []).includes(k),
  )

  return (
    <div className="round-summary" data-testid="round-summary">
      <h2>Round Summary</h2>

      <div data-testid="grapes-survived">
        {props.grapesLeft}/{props.maxGrapes}
      </div>

      <div data-testid="accuracy">
        {Math.round(props.accuracy * 100)}%
      </div>

      <div data-testid="reaction-time">{props.avgReactionMs}ms</div>

      {props.keysImproved && props.keysImproved.length > 0 && (
        <div data-testid="keys-improved">
          {props.keysImproved.join(' ')}
        </div>
      )}

      {keysDeclined.length > 0 && (
        <div data-testid="keys-declined">{keysDeclined.join(' ')}</div>
      )}

      <div data-testid="next-focus">
        Next: {props.nextFocusKeys.join(' ')}
      </div>

      <button onClick={props.onNextRound}>Next Round</button>
    </div>
  )
}

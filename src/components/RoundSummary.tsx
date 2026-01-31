interface RoundSummaryProps {
  grapesLeft: number
  maxGrapes: number
  accuracy: number
  avgReactionMs: number
  roundScore: number
  isNewHighScore: boolean
  nextFocusKeys: string[]
  keysImproved?: string[]
  keysDeclined?: string[]
  onNextRound: () => void
}

export function RoundSummary(props: RoundSummaryProps) {
  const keysDeclined = props.keysDeclined ?? []

  return (
    <div className="round-summary" data-testid="round-summary">
      <h2>Round Summary</h2>

      <div data-testid="grapes-survived">
        Grapes survived: {props.grapesLeft}/{props.maxGrapes}
      </div>

      <div data-testid="accuracy">
        Accuracy: {Math.round(props.accuracy * 100)}%
      </div>

      <div data-testid="reaction-time">Average reaction time: {props.avgReactionMs}ms</div>

      {props.isNewHighScore && (
        <div data-testid="new-high-score" className="new-high-score">
          NEW HIGH SCORE: {props.roundScore}
        </div>
      )}

      {props.keysImproved && props.keysImproved.length > 0 && (
        <div data-testid="keys-improved">
          Keys improved: {props.keysImproved.join(' ')}
        </div>
      )}

      {keysDeclined.length > 0 && (
        <div data-testid="keys-declined">Keys declined: {keysDeclined.join(' ')}</div>
      )}

      <div data-testid="next-focus">
        Next round: {props.nextFocusKeys.join(' ')}
      </div>

      <button onClick={props.onNextRound}>Next Round</button>
    </div>
  )
}

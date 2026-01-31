interface HUDProps {
  wpm: number
  learningSpeed: number | null
  weakKeys: string[]
  roundName: string
  currentWave: number
  totalWaves: number
  grapes: number
  maxGrapes: number
  roundScore: number
  highScore: number
  onRecalibrate: () => void
  onOpenSettings: () => void
}

export function HUD(props: HUDProps) {
  const speedDisplay =
    props.learningSpeed === null
      ? '\u2014'
      : props.learningSpeed > 0
        ? `+${props.learningSpeed}`
        : `${props.learningSpeed}`

  return (
    <div data-testid="hud">
      <div className="hud-top">
        <span>TypeCraft</span>
        <span data-testid="high-score">HI:{props.highScore}</span>
        <span data-testid="round-score">Score:{props.roundScore}</span>
        <span data-testid="wpm">WPM:{props.wpm}</span>
        <span data-testid="learning-speed">{speedDisplay}</span>
        <button onClick={props.onOpenSettings} aria-label="Settings">{'\u2699'}</button>
        <button onClick={props.onRecalibrate} aria-label="Recalibrate">Recal</button>
      </div>
      <div data-testid="weak-keys" className="weak-keys">
        {props.weakKeys.map((key) => (
          <span key={key} className="weak-key-badge">
            {key}
          </span>
        ))}
      </div>
      <div className="hud-bottom">
        <span data-testid="round-name">{props.roundName}</span>
        <span data-testid="wave-progress">
          {props.currentWave}/{props.totalWaves}
        </span>
        <span data-testid="grape-count">
          {props.grapes}/{props.maxGrapes}
        </span>
      </div>
    </div>
  )
}

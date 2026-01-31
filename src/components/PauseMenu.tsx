import { useState } from 'react'

interface PauseMenuProps {
  roundStats: {
    accuracy: number
    kills: number
    avgReactionMs: number
  }
  onResume: () => void
  onSettings: () => void
  onQuit: () => void
}

export function PauseMenu({ roundStats, onResume, onSettings, onQuit }: PauseMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="pause-menu" data-testid="pause-menu">
      <h2>PAUSED</h2>

      <div className="pause-stats">
        <div>Accuracy: {Math.round(roundStats.accuracy * 100)}%</div>
        <div>Kills: {roundStats.kills}</div>
        <div>Avg Reaction: {roundStats.avgReactionMs}ms</div>
      </div>

      {!showConfirm ? (
        <div className="pause-buttons">
          <button onClick={onResume}>Resume</button>
          <button onClick={onSettings}>Settings</button>
          <button onClick={() => setShowConfirm(true)}>Quit to Menu</button>
        </div>
      ) : (
        <div className="confirm-quit">
          <p>Quit? Round progress will be lost.</p>
          <button onClick={onQuit}>Confirm</button>
          <button onClick={() => setShowConfirm(false)}>Cancel</button>
        </div>
      )}
    </div>
  )
}

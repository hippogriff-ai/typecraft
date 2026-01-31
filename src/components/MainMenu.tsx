import { useState } from 'react'

interface MainMenuProps {
  onStartGame: () => void
  onStats: () => void
  onSettings: () => void
  onRecalibrate: () => void
}

export function MainMenu(props: MainMenuProps) {
  const [showRecalibrateConfirm, setShowRecalibrateConfirm] = useState(false)

  return (
    <div className="main-menu" data-testid="main-menu">
      <h1>TypeCraft</h1>
      <div className="menu-buttons">
        <button onClick={props.onStartGame}>Start Game</button>
        <button onClick={props.onStats}>Stats/Leaderboard</button>
        <button onClick={props.onSettings}>Settings</button>
        {!showRecalibrateConfirm ? (
          <button onClick={() => setShowRecalibrateConfirm(true)}>Recalibrate</button>
        ) : (
          <div data-testid="recalibrate-confirm" className="confirm-dialog">
            <p>Reset all key profiles and restart calibration?</p>
            <button onClick={() => { props.onRecalibrate(); setShowRecalibrateConfirm(false) }}>
              Confirm
            </button>
            <button onClick={() => setShowRecalibrateConfirm(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

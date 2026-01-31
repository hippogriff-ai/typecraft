interface MainMenuProps {
  onStartGame: () => void
  onStats: () => void
  onSettings: () => void
  onRecalibrate: () => void
}

export function MainMenu(props: MainMenuProps) {
  return (
    <div className="main-menu" data-testid="main-menu">
      <h1>TypeCraft</h1>
      <div className="menu-buttons">
        <button onClick={props.onStartGame}>Start Game</button>
        <button onClick={props.onStats}>Stats</button>
        <button onClick={props.onSettings}>Settings</button>
        <button onClick={props.onRecalibrate}>Recalibrate</button>
      </div>
    </div>
  )
}

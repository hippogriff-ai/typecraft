import type { Settings } from '../lib/settings'

interface SettingsScreenProps {
  settings: Settings
  onUpdate: (settings: Settings) => void
  onBack: () => void
}

export function SettingsScreen({ settings, onUpdate, onBack }: SettingsScreenProps) {
  return (
    <div className="settings-screen" data-testid="settings-screen">
      <h2>Settings</h2>

      <div className="setting-row">
        <label>Grapes: {settings.grapeCount}</label>
        <input
          type="range"
          min={6}
          max={48}
          value={settings.grapeCount}
          aria-label={`Grapes: ${settings.grapeCount}`}
          onChange={(e) =>
            onUpdate({ ...settings, grapeCount: Number(e.target.value) })
          }
        />
      </div>

      <div className="setting-row">
        <label>Speed: {settings.speedPreset}</label>
        <div className="speed-buttons">
          <button
            onClick={() => onUpdate({ ...settings, speedPreset: 'slow' })}
            aria-pressed={settings.speedPreset === 'slow'}
          >
            Slow
          </button>
          <button
            onClick={() => onUpdate({ ...settings, speedPreset: 'normal' })}
            aria-pressed={settings.speedPreset === 'normal'}
          >
            Normal
          </button>
          <button
            onClick={() => onUpdate({ ...settings, speedPreset: 'fast' })}
            aria-pressed={settings.speedPreset === 'fast'}
          >
            Fast
          </button>
          <button
            onClick={() => onUpdate({ ...settings, speedPreset: 'ultra' })}
            aria-pressed={settings.speedPreset === 'ultra'}
          >
            Ultra
          </button>
        </div>
      </div>

      <div className="setting-row">
        <label>Max Invaders/Wave: {settings.maxInvadersPerWave}</label>
        <input
          type="range"
          min={6}
          max={30}
          value={settings.maxInvadersPerWave}
          aria-label={`Max Invaders per Wave: ${settings.maxInvadersPerWave}`}
          onChange={(e) =>
            onUpdate({ ...settings, maxInvadersPerWave: Number(e.target.value) })
          }
        />
      </div>

      <div className="setting-row">
        <label>Waves/Round: {settings.wavesPerRound}</label>
        <input
          type="range"
          min={4}
          max={12}
          value={settings.wavesPerRound}
          aria-label={`Waves per Round: ${settings.wavesPerRound}`}
          onChange={(e) =>
            onUpdate({ ...settings, wavesPerRound: Number(e.target.value) })
          }
        />
      </div>

      <div className="setting-row">
        <label>Color-blind Mode: {!settings.colorBlindMode || settings.colorBlindMode === 'none' ? 'Off' : settings.colorBlindMode}</label>
        <div className="speed-buttons">
          <button
            onClick={() => onUpdate({ ...settings, colorBlindMode: 'none' })}
            aria-pressed={!settings.colorBlindMode || settings.colorBlindMode === 'none'}
          >
            Off
          </button>
          <button
            onClick={() => onUpdate({ ...settings, colorBlindMode: 'deuteranopia' })}
            aria-pressed={settings.colorBlindMode === 'deuteranopia'}
          >
            Deuteranopia
          </button>
          <button
            onClick={() => onUpdate({ ...settings, colorBlindMode: 'protanopia' })}
            aria-pressed={settings.colorBlindMode === 'protanopia'}
          >
            Protanopia
          </button>
        </div>
      </div>

      <button onClick={onBack}>Back</button>
    </div>
  )
}

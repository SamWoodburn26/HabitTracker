import type { InputMode } from '../types'

type ModeToggleProps = {
  mode: InputMode
  onChange: (mode: InputMode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="Input mode">
      <button
        type="button"
        className={mode === 'type' ? 'active' : undefined}
        onClick={() => onChange('type')}
      >
        Type
      </button>
      <button
        type="button"
        className={mode === 'write' ? 'active' : undefined}
        onClick={() => onChange('write')}
      >
        Write
      </button>
    </div>
  )
}

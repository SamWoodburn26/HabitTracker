import { useEffect, useRef, useState } from 'react'
import type { ThemeColors } from '../types'
import { ColorWheel } from './ColorWheel'
import { normalizeHex } from '../lib/color'

type ColorPickerBarProps = {
  colors: ThemeColors
  onChange: <K extends keyof ThemeColors>(key: K, value: ThemeColors[K]) => void
  compact?: boolean
}

export const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'habitTracker', label: 'Habits' },
  { key: 'gratitudeTitle', label: 'Gratitude' },
  { key: 'gratitudeAccent', label: 'Grat. lines' },
  { key: 'dailyPlanner', label: 'Planner' },
  { key: 'ink', label: 'Ink' },
  { key: 'paper', label: 'Paper' },
  { key: 'text', label: 'Text' },
]

export function ColorPickerBar({
  colors,
  onChange,
  compact,
}: ColorPickerBarProps) {
  const [openKey, setOpenKey] = useState<keyof ThemeColors | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openKey) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenKey(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openKey])

  return (
    <div
      ref={rootRef}
      className={`color-picker-bar${compact ? ' compact' : ''}`}
      role="group"
      aria-label="Colors"
    >
      {COLOR_FIELDS.map(({ key, label }) => {
        const open = openKey === key
        return (
          <div key={key} className="color-swatch-wrap">
            <button
              type="button"
              className={`color-swatch${open ? ' open' : ''}`}
              title={label}
              aria-label={label}
              aria-expanded={open}
              onClick={() => setOpenKey(open ? null : key)}
            >
              <span className="color-swatch-label">{label}</span>
              <span
                className="color-swatch-chip"
                style={{ background: normalizeHex(colors[key]) }}
              />
            </button>
            {open && (
              <div className="color-wheel-popover">
                <ColorWheel
                  value={colors[key]}
                  label={label}
                  onChange={(hex) => onChange(key, hex)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

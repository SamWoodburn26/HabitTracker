import { useEffect, useMemo } from 'react'
import { ColorPickerBar } from '../components/ColorPickerBar'
import { InkCanvas, InkTools } from '../components/InkCanvas'
import { ModeToggle } from '../components/ModeToggle'
import { TemplatePicker } from '../components/TemplatePicker'
import { TopBar } from '../components/TopBar'
import type { AppDataApi } from '../hooks/useAppData'
import { DailyPlannerTemplate } from '../templates/DailyPlannerTemplate'
import { GratitudeTemplate } from '../templates/GratitudeTemplate'
import { HabitTrackerTemplate } from '../templates/HabitTrackerTemplate'
import type { InkStroke } from '../types'

type HabitTrackerPageProps = {
  api: AppDataApi
  onBack: () => void
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const n = Number.parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function HabitTrackerPage({ api, onBack }: HabitTrackerPageProps) {
  const {
    data,
    activeHabitSheet,
    activeGratitudeSheet,
    activeDailySheet,
    setActiveTemplate,
    setInputMode,
    addHabitSheet,
    setActiveHabitSheetId,
    setHabitSheetStrokes,
    addGratitudeSheet,
    setActiveGratitudeSheetId,
    setGratitudeSheetStrokes,
    addDailySheet,
    setActiveDailySheetId,
    setDailySheetStrokes,
    setColor,
  } = api

  const writeMode = data.inputMode === 'write'
  const { colors } = data

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent-green', colors.habitTracker)
    root.style.setProperty('--accent-purple', colors.gratitudeTitle)
    root.style.setProperty('--accent-blue', colors.gratitudeAccent)
    root.style.setProperty('--accent-orange', colors.dailyPlanner)
    root.style.setProperty('--paper', colors.paper)
    root.style.setProperty('--ink', colors.text)
    root.style.setProperty('--check-fill', hexToRgba(colors.habitTracker, 0.22))
    root.style.setProperty('--dp-dashed', hexToRgba(colors.dailyPlanner, 0.45))
    root.style.setProperty('--dp-line', hexToRgba(colors.dailyPlanner, 0.4))
    root.style.setProperty('--grat-item-line', hexToRgba(colors.gratitudeAccent, 0.5))
  }, [colors])

  const pageNav = useMemo(() => {
    if (data.activeTemplate === 'habit-tracker') {
      return {
        pages: data.habitSheets,
        activeId: data.activeHabitSheetId,
        onSelect: setActiveHabitSheetId,
        onAdd: addHabitSheet,
        strokes: activeHabitSheet?.strokes ?? [],
        setStrokes: setHabitSheetStrokes,
      }
    }
    if (data.activeTemplate === 'gratitude') {
      return {
        pages: data.gratitudeSheets,
        activeId: data.activeGratitudeSheetId,
        onSelect: setActiveGratitudeSheetId,
        onAdd: addGratitudeSheet,
        strokes: activeGratitudeSheet?.strokes ?? [],
        setStrokes: setGratitudeSheetStrokes,
      }
    }
    return {
      pages: data.dailySheets,
      activeId: data.activeDailySheetId,
      onSelect: setActiveDailySheetId,
      onAdd: addDailySheet,
      strokes: activeDailySheet?.strokes ?? [],
      setStrokes: setDailySheetStrokes,
    }
  }, [
    data.activeTemplate,
    data.habitSheets,
    data.activeHabitSheetId,
    data.gratitudeSheets,
    data.activeGratitudeSheetId,
    data.dailySheets,
    data.activeDailySheetId,
    activeHabitSheet,
    activeGratitudeSheet,
    activeDailySheet,
    setActiveHabitSheetId,
    addHabitSheet,
    setHabitSheetStrokes,
    setActiveGratitudeSheetId,
    addGratitudeSheet,
    setGratitudeSheetStrokes,
    setActiveDailySheetId,
    addDailySheet,
    setDailySheetStrokes,
  ])

  const persistStrokes = (next: InkStroke[]) => {
    pageNav.setStrokes(next)
  }

  return (
    <div>
      <TopBar title="Habit Tracker" onBack={onBack} />
      <div className="toolbar-row">
        <TemplatePicker
          active={data.activeTemplate}
          onSelect={setActiveTemplate}
        />
        <ModeToggle mode={data.inputMode} onChange={setInputMode} />
        {writeMode && (
          <InkTools
            onUndo={() => persistStrokes(pageNav.strokes.slice(0, -1))}
            onClear={() => persistStrokes([])}
            disabled={pageNav.strokes.length === 0}
          />
        )}
      </div>
      <div className="toolbar-row">
        <ColorPickerBar colors={colors} onChange={setColor} compact />
      </div>
      <div className="section-pages">
        {pageNav.pages.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`journal-page-chip${p.id === pageNav.activeId ? ' active' : ''}`}
            onClick={() => pageNav.onSelect(p.id)}
          >
            {p.title}
          </button>
        ))}
        <button type="button" className="journal-page-chip" onClick={pageNav.onAdd}>
          + Page
        </button>
      </div>
      <div
        className="page-panel dot-grid"
        style={{ position: 'relative', backgroundColor: colors.paper }}
      >
        {data.activeTemplate === 'habit-tracker' && (
          <HabitTrackerTemplate api={api} />
        )}
        {data.activeTemplate === 'gratitude' && (
          <GratitudeTemplate api={api} />
        )}
        {data.activeTemplate === 'daily-planner' && (
          <DailyPlannerTemplate api={api} />
        )}
        <InkCanvas
          strokes={pageNav.strokes}
          onChange={persistStrokes}
          enabled={writeMode}
          color={colors.ink}
          size={3.5}
        />
      </div>
      {writeMode && (
        <p className="muted" style={{ marginTop: 10, fontSize: '0.9rem' }}>
          Write mode: draw with Apple Pencil or finger. Switch to Type to edit
          fields and check boxes.
        </p>
      )}
    </div>
  )
}

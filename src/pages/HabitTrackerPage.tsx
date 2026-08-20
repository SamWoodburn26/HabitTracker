import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColorPickerBar } from '../components/ColorPickerBar'
import {
  InkCanvas,
  InkTools,
  type EraseFieldHit,
  type InkTool,
} from '../components/InkCanvas'
import { ModeToggle } from '../components/ModeToggle'
import { TemplatePicker } from '../components/TemplatePicker'
import { TopBar } from '../components/TopBar'
import type { AppDataApi } from '../hooks/useAppData'
import { useStrokeUndo } from '../hooks/useStrokeUndo'
import { DailyPlannerTemplate } from '../templates/DailyPlannerTemplate'
import { GratitudeTemplate } from '../templates/GratitudeTemplate'
import { HabitTrackerTemplate } from '../templates/HabitTrackerTemplate'

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
    setHabitMonthLabel,
    setHobbyItem,
    setMonthHighlights,
    updateGratitude,
    updateDailyPlan,
    setColor,
  } = api

  const writeMode = data.inputMode === 'write'
  const { colors } = data
  const [inkTool, setInkTool] = useState<InkTool>('pen')

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

  useEffect(() => {
    if (!writeMode) setInkTool('pen')
  }, [writeMode])

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

  const pageKey = `${data.activeTemplate}:${pageNav.activeId}`
  const { commit, undo, canUndo } = useStrokeUndo(
    pageKey,
    pageNav.strokes,
    pageNav.setStrokes,
  )

  const eraseTypedFields = useCallback(
    (fields: EraseFieldHit[]) => {
      for (const hit of fields) {
        switch (hit.field) {
          case 'habit-month':
            if (activeHabitSheet?.habitMonthLabel) setHabitMonthLabel('')
            break
          case 'hobby':
            if (
              hit.index != null &&
              activeHabitSheet?.hobbyList[hit.index]
            ) {
              setHobbyItem(hit.index, '')
            }
            break
          case 'highlights':
            if (activeHabitSheet?.monthHighlights) setMonthHighlights('')
            break
          case 'grat-date': {
            if (!hit.entryId || !activeGratitudeSheet) break
            const entry = activeGratitudeSheet.entries.find((e) => e.id === hit.entryId)
            if (entry?.date) updateGratitude(hit.entryId, { date: '' })
            break
          }
          case 'grat-item': {
            if (!hit.entryId || hit.index == null || !activeGratitudeSheet) break
            const entry = activeGratitudeSheet.entries.find((e) => e.id === hit.entryId)
            if (!entry || !entry.items[hit.index]) break
            const items = [...entry.items] as [string, string, string]
            items[hit.index] = ''
            updateGratitude(hit.entryId, { items })
            break
          }
          case 'dp-date': {
            if (!hit.entryId || !activeDailySheet) break
            const plan = activeDailySheet.plans.find((p) => p.id === hit.entryId)
            if (plan?.date) updateDailyPlan(hit.entryId, { date: '' })
            break
          }
          case 'wantTo': {
            if (!hit.entryId || hit.index == null || !activeDailySheet) break
            const plan = activeDailySheet.plans.find((p) => p.id === hit.entryId)
            if (!plan || !plan.wantTo[hit.index]) break
            const wantTo = [...plan.wantTo]
            wantTo[hit.index] = ''
            updateDailyPlan(hit.entryId, { wantTo })
            break
          }
          case 'needTo': {
            if (!hit.entryId || hit.index == null || !activeDailySheet) break
            const plan = activeDailySheet.plans.find((p) => p.id === hit.entryId)
            if (!plan || !plan.needTo[hit.index]) break
            const needTo = [...plan.needTo]
            needTo[hit.index] = ''
            updateDailyPlan(hit.entryId, { needTo })
            break
          }
          case 'goal': {
            if (!hit.entryId || !activeDailySheet) break
            const plan = activeDailySheet.plans.find((p) => p.id === hit.entryId)
            if (plan?.goal) updateDailyPlan(hit.entryId, { goal: '' })
            break
          }
          case 'highlight': {
            if (!hit.entryId || !activeDailySheet) break
            const plan = activeDailySheet.plans.find((p) => p.id === hit.entryId)
            if (plan?.highlight) updateDailyPlan(hit.entryId, { highlight: '' })
            break
          }
          default:
            break
        }
      }
    },
    [
      activeHabitSheet,
      activeGratitudeSheet,
      activeDailySheet,
      setHabitMonthLabel,
      setHobbyItem,
      setMonthHighlights,
      updateGratitude,
      updateDailyPlan,
    ],
  )

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
            tool={inkTool}
            onToolChange={setInkTool}
            onUndo={undo}
            onClear={() => commit([])}
            canUndo={canUndo}
            canClear={pageNav.strokes.length > 0}
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
          onChange={commit}
          onEraseFields={eraseTypedFields}
          enabled={writeMode}
          tool={inkTool}
          color={colors.ink}
          size={3.5}
        />
      </div>
      {writeMode && (
        <p className="muted" style={{ marginTop: 10, fontSize: '0.9rem' }}>
          Write mode: draw with Apple Pencil or finger. Use Erase and scribble
          over ink or typed fields to clear them. Switch to Type to edit fields
          and check boxes.
        </p>
      )}
    </div>
  )
}

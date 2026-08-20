import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countHabitChecks, petProgress } from '../lib/petProgress'
import {
  createHabitSheet,
  emptyDailyPlan,
  emptyGratitudeEntries,
  uid,
} from '../storage/defaults'
import { fetchCloudAppData, saveCloudAppData } from '../storage/cloud'
import { loadAppData, saveAppData } from '../storage/storage'
import type {
  AppData,
  DailyPlannerEntry,
  GratitudeEntry,
  HabitId,
  HabitTrackerSheet,
  InkStroke,
  InputMode,
  JournalPage,
  TemplateId,
  ThemeColors,
} from '../types'

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

function updateHabitSheet(
  sheets: HabitTrackerSheet[],
  sheetId: string,
  updater: (sheet: HabitTrackerSheet) => HabitTrackerSheet,
): HabitTrackerSheet[] {
  return sheets.map((s) => (s.id === sheetId ? updater(s) : s))
}

type UseAppDataOptions = {
  userId?: string | null
}

export function useAppData({ userId = null }: UseAppDataOptions = {}) {
  const [data, setData] = useState<AppData>(() => loadAppData())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const skipNextCloudSave = useRef(false)
  const hydratedUser = useRef<string | null>(null)

  useEffect(() => {
    saveAppData(data)
  }, [data])

  useEffect(() => {
    if (!userId) {
      hydratedUser.current = null
      setSyncStatus('idle')
      return
    }
    if (hydratedUser.current === userId) return

    let cancelled = false
    setSyncStatus('syncing')

    ;(async () => {
      try {
        const remote = await fetchCloudAppData(userId)
        if (cancelled) return
        if (remote) {
          skipNextCloudSave.current = true
          setData(remote)
          saveAppData(remote)
        } else {
          await saveCloudAppData(userId, loadAppData())
        }
        hydratedUser.current = userId
        setSyncStatus('saved')
      } catch {
        if (!cancelled) setSyncStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId || hydratedUser.current !== userId) return
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false
      return
    }

    setSyncStatus('syncing')
    const timer = window.setTimeout(() => {
      void saveCloudAppData(userId, data)
        .then(() => setSyncStatus('saved'))
        .catch(() => setSyncStatus('error'))
    }, 800)

    return () => window.clearTimeout(timer)
  }, [data, userId])

  const activeHabitSheet =
    data.habitSheets.find((s) => s.id === data.activeHabitSheetId) ??
    data.habitSheets[0]

  const activeGratitudeSheet =
    data.gratitudeSheets.find((s) => s.id === data.activeGratitudeSheetId) ??
    data.gratitudeSheets[0]

  const activeDailySheet =
    data.dailySheets.find((s) => s.id === data.activeDailySheetId) ??
    data.dailySheets[0]

  const totalChecks = useMemo(() => {
    let total = 0
    for (const sheet of data.habitSheets) {
      total += countHabitChecks(sheet.habitChecks)
    }
    return total
  }, [data.habitSheets])

  const pet = useMemo(() => petProgress(totalChecks), [totalChecks])

  const toggleHabitCheck = useCallback((habitId: HabitId, day: number) => {
    setData((prev) => {
      const sheetId = prev.activeHabitSheetId
      const sheet = prev.habitSheets.find((s) => s.id === sheetId)
      if (!sheet) return prev
      const dayKey = String(day)
      const habitDays = sheet.habitChecks[habitId] ?? {}
      const wasChecked = Boolean(habitDays[dayKey])
      const nextChecked = !wasChecked
      return {
        ...prev,
        habitSheets: updateHabitSheet(prev.habitSheets, sheetId, (s) => ({
          ...s,
          habitChecks: {
            ...s.habitChecks,
            [habitId]: {
              ...habitDays,
              [dayKey]: nextChecked,
            },
          },
        })),
        coins: Math.max(0, prev.coins + (nextChecked ? 1 : -1)),
      }
    })
  }, [])

  const setHabitMonthLabel = useCallback((habitMonthLabel: string) => {
    setData((prev) => ({
      ...prev,
      habitSheets: updateHabitSheet(prev.habitSheets, prev.activeHabitSheetId, (s) => ({
        ...s,
        habitMonthLabel,
      })),
    }))
  }, [])

  const setMonthHighlights = useCallback((monthHighlights: string) => {
    setData((prev) => ({
      ...prev,
      habitSheets: updateHabitSheet(prev.habitSheets, prev.activeHabitSheetId, (s) => ({
        ...s,
        monthHighlights,
      })),
    }))
  }, [])

  const setHobbyItem = useCallback((index: number, value: string) => {
    setData((prev) => ({
      ...prev,
      habitSheets: updateHabitSheet(prev.habitSheets, prev.activeHabitSheetId, (s) => {
        const hobbyList = [...s.hobbyList]
        hobbyList[index] = value
        return { ...s, hobbyList }
      }),
    }))
  }, [])

  const updateGratitude = useCallback(
    (id: string, patch: Partial<GratitudeEntry>) => {
      setData((prev) => ({
        ...prev,
        gratitudeSheets: prev.gratitudeSheets.map((sheet) =>
          sheet.id !== prev.activeGratitudeSheetId
            ? sheet
            : {
                ...sheet,
                entries: sheet.entries.map((entry) =>
                  entry.id === id ? { ...entry, ...patch } : entry,
                ),
              },
        ),
      }))
    },
    [],
  )

  const updateDailyPlan = useCallback(
    (id: string, patch: Partial<DailyPlannerEntry>) => {
      setData((prev) => ({
        ...prev,
        dailySheets: prev.dailySheets.map((sheet) =>
          sheet.id !== prev.activeDailySheetId
            ? sheet
            : {
                ...sheet,
                plans: sheet.plans.map((entry) =>
                  entry.id === id ? { ...entry, ...patch } : entry,
                ),
              },
        ),
      }))
    },
    [],
  )

  const addDailyPlan = useCallback(() => {
    setData((prev) => ({
      ...prev,
      dailySheets: prev.dailySheets.map((sheet) =>
        sheet.id !== prev.activeDailySheetId
          ? sheet
          : { ...sheet, plans: [...sheet.plans, emptyDailyPlan()] },
      ),
    }))
  }, [])

  const setActiveTemplate = useCallback((activeTemplate: TemplateId) => {
    setData((prev) => ({ ...prev, activeTemplate }))
  }, [])

  const setInputMode = useCallback((inputMode: InputMode) => {
    setData((prev) => ({ ...prev, inputMode }))
  }, [])

  const updateJournalPage = useCallback(
    (id: string, patch: Partial<JournalPage>) => {
      setData((prev) => ({
        ...prev,
        journalPages: prev.journalPages.map((page) =>
          page.id === id ? { ...page, ...patch } : page,
        ),
      }))
    },
    [],
  )

  const setJournalStrokes = useCallback((id: string, strokes: InkStroke[]) => {
    setData((prev) => ({
      ...prev,
      journalPages: prev.journalPages.map((page) =>
        page.id === id ? { ...page, strokes } : page,
      ),
    }))
  }, [])

  const addJournalPage = useCallback(() => {
    const id = uid('journal')
    setData((prev) => ({
      ...prev,
      journalPages: [
        ...prev.journalPages,
        {
          id,
          title: `Page ${prev.journalPages.length + 1}`,
          text: '',
          strokes: [],
        },
      ],
      activeJournalPageId: id,
    }))
  }, [])

  const setActiveJournalPageId = useCallback((activeJournalPageId: string) => {
    setData((prev) => ({ ...prev, activeJournalPageId }))
  }, [])

  const setJournalPinHash = useCallback((journalPinHash: string | null) => {
    setData((prev) => ({ ...prev, journalPinHash }))
  }, [])

  const addHabitSheet = useCallback(() => {
    setData((prev) => {
      const sheet = createHabitSheet(prev.habitSheets.length + 1)
      return {
        ...prev,
        habitSheets: [...prev.habitSheets, sheet],
        activeHabitSheetId: sheet.id,
      }
    })
  }, [])

  const setActiveHabitSheetId = useCallback((activeHabitSheetId: string) => {
    setData((prev) => ({ ...prev, activeHabitSheetId }))
  }, [])

  const setHabitSheetStrokes = useCallback((strokes: InkStroke[]) => {
    setData((prev) => ({
      ...prev,
      habitSheets: updateHabitSheet(prev.habitSheets, prev.activeHabitSheetId, (s) => ({
        ...s,
        strokes,
      })),
    }))
  }, [])

  const addGratitudeSheet = useCallback(() => {
    const id = uid('grat-sheet')
    setData((prev) => ({
      ...prev,
      gratitudeSheets: [
        ...prev.gratitudeSheets,
        {
          id,
          title: `Page ${prev.gratitudeSheets.length + 1}`,
          entries: emptyGratitudeEntries(),
          strokes: [],
        },
      ],
      activeGratitudeSheetId: id,
    }))
  }, [])

  const setActiveGratitudeSheetId = useCallback((activeGratitudeSheetId: string) => {
    setData((prev) => ({ ...prev, activeGratitudeSheetId }))
  }, [])

  const setGratitudeSheetStrokes = useCallback((strokes: InkStroke[]) => {
    setData((prev) => ({
      ...prev,
      gratitudeSheets: prev.gratitudeSheets.map((s) =>
        s.id === prev.activeGratitudeSheetId ? { ...s, strokes } : s,
      ),
    }))
  }, [])

  const addDailySheet = useCallback(() => {
    const id = uid('daily-sheet')
    setData((prev) => ({
      ...prev,
      dailySheets: [
        ...prev.dailySheets,
        {
          id,
          title: `Page ${prev.dailySheets.length + 1}`,
          plans: [emptyDailyPlan()],
          strokes: [],
        },
      ],
      activeDailySheetId: id,
    }))
  }, [])

  const setActiveDailySheetId = useCallback((activeDailySheetId: string) => {
    setData((prev) => ({ ...prev, activeDailySheetId }))
  }, [])

  const setDailySheetStrokes = useCallback((strokes: InkStroke[]) => {
    setData((prev) => ({
      ...prev,
      dailySheets: prev.dailySheets.map((s) =>
        s.id === prev.activeDailySheetId ? { ...s, strokes } : s,
      ),
    }))
  }, [])

  const setColor = useCallback(<K extends keyof ThemeColors>(key: K, value: ThemeColors[K]) => {
    setData((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }))
  }, [])

  const setColors = useCallback((colors: Partial<ThemeColors>) => {
    setData((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }))
  }, [])

  const setPetGameHighScore = useCallback((score: number) => {
    const next = Math.max(0, Math.floor(score))
    setData((prev) =>
      next > (prev.petGameHighScore ?? 0) ? { ...prev, petGameHighScore: next } : prev,
    )
  }, [])

  return {
    data,
    pet,
    totalChecks,
    syncStatus,
    activeHabitSheet,
    activeGratitudeSheet,
    activeDailySheet,
    toggleHabitCheck,
    setHabitMonthLabel,
    setMonthHighlights,
    setHobbyItem,
    updateGratitude,
    updateDailyPlan,
    addDailyPlan,
    setActiveTemplate,
    setInputMode,
    updateJournalPage,
    setJournalStrokes,
    addJournalPage,
    setActiveJournalPageId,
    setJournalPinHash,
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
    setColors,
    setPetGameHighScore,
  }
}

export type AppDataApi = ReturnType<typeof useAppData>

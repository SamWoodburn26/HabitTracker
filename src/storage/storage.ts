import type {
  AppData,
  HabitChecks,
  HabitTrackerSheet,
  ThemeColors,
} from '../types'
import {
  createDefaultAppData,
  createHabitSheet,
  emptyDailyPlan,
  emptyGratitudeEntries,
  uid,
  DEFAULT_COLORS,
} from './defaults'

const STORAGE_KEY = 'habits-app-v1'

export type LegacyAppData = Partial<AppData> & {
  habitChecks?: HabitChecks
  habitMonthLabel?: string
  hobbyList?: string[]
  monthHighlights?: string
  gratitude?: AppData['gratitudeSheets'][0]['entries']
  dailyPlans?: AppData['dailySheets'][0]['plans']
}

export function migrateAppData(parsed: LegacyAppData): AppData {
  const defaults = createDefaultAppData()

  let habitSheets = parsed.habitSheets
  let activeHabitSheetId = parsed.activeHabitSheetId

  if (!habitSheets?.length) {
    const sheet: HabitTrackerSheet = {
      ...createHabitSheet(1),
      habitMonthLabel: parsed.habitMonthLabel ?? defaults.habitSheets[0].habitMonthLabel,
      habitChecks: parsed.habitChecks ?? {},
      hobbyList: parsed.hobbyList ?? defaults.habitSheets[0].hobbyList,
      monthHighlights: parsed.monthHighlights ?? '',
    }
    habitSheets = [sheet]
    activeHabitSheetId = sheet.id
  }

  let gratitudeSheets = parsed.gratitudeSheets
  let activeGratitudeSheetId = parsed.activeGratitudeSheetId
  if (!gratitudeSheets?.length) {
    const id = uid('grat-sheet')
    gratitudeSheets = [
      {
        id,
        title: 'Page 1',
        entries: parsed.gratitude ?? emptyGratitudeEntries(),
        strokes: [],
      },
    ]
    activeGratitudeSheetId = id
  }

  let dailySheets = parsed.dailySheets
  let activeDailySheetId = parsed.activeDailySheetId
  if (!dailySheets?.length) {
    const id = uid('daily-sheet')
    dailySheets = [
      {
        id,
        title: 'Page 1',
        plans: parsed.dailyPlans?.length ? parsed.dailyPlans : [emptyDailyPlan()],
        strokes: [],
      },
    ]
    activeDailySheetId = id
  }

  const colors: ThemeColors = {
    ...DEFAULT_COLORS,
    ...(parsed.colors ?? {}),
  }

  return {
    ...defaults,
    ...parsed,
    habits: parsed.habits ?? defaults.habits,
    habitSheets,
    activeHabitSheetId: activeHabitSheetId ?? habitSheets[0].id,
    gratitudeSheets,
    activeGratitudeSheetId: activeGratitudeSheetId ?? gratitudeSheets[0].id,
    dailySheets,
    activeDailySheetId: activeDailySheetId ?? dailySheets[0].id,
    journalPages: parsed.journalPages?.length
      ? parsed.journalPages
      : defaults.journalPages,
    activeJournalPageId:
      parsed.activeJournalPageId ??
      (parsed.journalPages?.[0]?.id ?? defaults.activeJournalPageId),
    colors,
    coins: parsed.coins ?? 0,
    activeTemplate: parsed.activeTemplate ?? 'habit-tracker',
    inputMode: parsed.inputMode === 'write' ? 'write' : 'type',
  }
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultAppData()
    return migrateAppData(JSON.parse(raw) as LegacyAppData)
  } catch {
    return createDefaultAppData()
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Quota or private mode — ignore for MVP
  }
}

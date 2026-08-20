import { DEFAULT_HABITS, DEFAULT_HOBBIES } from '../data/defaultHabits'
import type {
  AppData,
  DailyPlannerEntry,
  GratitudeEntry,
  HabitTrackerSheet,
  ThemeColors,
} from '../types'

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function emptyGratitudeEntries(): GratitudeEntry[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: uid(`grat-${i}`),
    date: '',
    items: ['', '', ''] as [string, string, string],
  }))
}

export function emptyDailyPlan(): DailyPlannerEntry {
  return {
    id: uid('daily'),
    date: '',
    wantTo: ['', '', '', ''],
    needTo: ['', '', '', ''],
    goal: '',
    highlight: '',
  }
}

export const DEFAULT_COLORS: ThemeColors = {
  habitTracker: '#4a8f6a',
  gratitudeTitle: '#7b5ea7',
  gratitudeAccent: '#6a9bb8',
  dailyPlanner: '#d17a3a',
  ink: '#3a2f35',
  paper: '#fff7fa',
  text: '#3a2f35',
}

export function createHabitSheet(pageNum: number): HabitTrackerSheet {
  const habitMonth = currentMonth()
  return {
    id: uid('ht-sheet'),
    title: `Page ${pageNum}`,
    habitMonthLabel: monthLabel(habitMonth),
    habitChecks: {},
    hobbyList: [...DEFAULT_HOBBIES],
    monthHighlights: '',
    strokes: [],
  }
}

export function createDefaultAppData(): AppData {
  const journalId = uid('journal')
  const habitSheet = createHabitSheet(1)
  const gratitudeId = uid('grat-sheet')
  const dailyId = uid('daily-sheet')

  return {
    habits: DEFAULT_HABITS.map((label, i) => ({
      id: `habit-${i + 1}`,
      label,
    })),
    habitSheets: [habitSheet],
    activeHabitSheetId: habitSheet.id,
    gratitudeSheets: [
      {
        id: gratitudeId,
        title: 'Page 1',
        entries: emptyGratitudeEntries(),
        strokes: [],
      },
    ],
    activeGratitudeSheetId: gratitudeId,
    dailySheets: [
      {
        id: dailyId,
        title: 'Page 1',
        plans: [emptyDailyPlan()],
        strokes: [],
      },
    ],
    activeDailySheetId: dailyId,
    journalPages: [
      {
        id: journalId,
        title: 'Page 1',
        text: '',
        strokes: [],
      },
    ],
    journalPinHash: null,
    coins: 0,
    petGameHighScore: 0,
    activeTemplate: 'habit-tracker',
    inputMode: 'type',
    activeJournalPageId: journalId,
    colors: { ...DEFAULT_COLORS },
  }
}
